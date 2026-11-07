from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from uuid import uuid4
from datetime import datetime, timezone
from app.crud.workflow import (
    get_agent_events_for_run,
    get_workflow_run,
    get_state_diffs_for_run,
)

router = APIRouter()


class ExportSession(BaseModel):
    run_id: str
    include_events: bool = True
    include_diffs: bool = True
    description: Optional[str] = None


# In-memory export store (Phase 17 — replaced by DB in Phase 19 cloud sync)
_export_sessions: Dict[str, Dict[str, Any]] = {}


@router.post(
    "/export/session",
    status_code=status.HTTP_201_CREATED,
    summary="Export a debug session for sharing",
)
async def export_debug_session(session: ExportSession):
    """Export a workflow run's events, diffs, and metadata as a shareable debug session.

    Returns a share_token that can be used to retrieve the exported session via GET.
    """
    run = await get_workflow_run(session.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {session.run_id} not found")

    events = []
    if session.include_events:
        events = await get_agent_events_for_run(session.run_id)

    diffs = []
    if session.include_diffs:
        diffs = await get_state_diffs_for_run(session.run_id)

    share_token = str(uuid4())
    exported_at = datetime.now(timezone.utc).isoformat()

    session_data = {
        "share_token": share_token,
        "run": run.model_dump() if hasattr(run, "model_dump") else run,
        "events": [e.model_dump() if hasattr(e, "model_dump") else e for e in events],
        "diffs": diffs,
        "description": session.description,
        "exported_at": exported_at,
        "total_events": len(events),
        "total_diffs": len(diffs),
    }

    _export_sessions[share_token] = session_data
    return {
        "share_token": share_token,
        "share_url": f"/api/v1/export/session/{share_token}",
        "run_id": session.run_id,
        "exported_at": exported_at,
        "total_events": len(events),
        "total_diffs": len(diffs),
    }


@router.get(
    "/export/session/{share_token}",
    response_model=Dict[str, Any],
    summary="Retrieve an exported debug session by share token",
)
async def get_exported_session(share_token: str):
    """Retrieve a previously exported debug session by its share token."""
    if share_token not in _export_sessions:
        raise HTTPException(status_code=404, detail="Export session not found")
    return _export_sessions[share_token]


@router.get(
    "/export/sessions",
    response_model=List[Dict[str, Any]],
    summary="List all exported debug sessions",
)
async def list_exported_sessions():
    """List all exported sessions, newest first."""
    sessions = sorted(
        _export_sessions.values(),
        key=lambda s: s.get("exported_at", ""),
        reverse=True,
    )
    # Return summary only (no full event payloads)
    return [
        {
            "share_token": s["share_token"],
            "run_id": s["run_id"],
            "description": s.get("description"),
            "exported_at": s["exported_at"],
            "total_events": s["total_events"],
            "total_diffs": s["total_diffs"],
        }
        for s in sessions
    ]
