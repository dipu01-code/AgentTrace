from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.v1.endpoints.auth import require_auth
from app.crud.workflow import get_agent_events_for_run, get_state_diffs_for_run, get_workflow_run
from app.db.database import get_database

router = APIRouter()


class ExportSession(BaseModel):
    run_id: str
    include_events: bool = True
    include_diffs: bool = True
    description: Optional[str] = None


@router.post("/export/session", status_code=status.HTTP_201_CREATED, summary="Export a debug session for sharing")
async def export_debug_session(session: ExportSession, user=Depends(require_auth)):
    """Snapshot a run's metadata, events and diffs under an unguessable share token."""
    run = await get_workflow_run(session.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {session.run_id} not found")
    events = await get_agent_events_for_run(session.run_id) if session.include_events else []
    diffs = await get_state_diffs_for_run(session.run_id) if session.include_diffs else []

    doc = {
        "share_token": str(uuid4()),
        "run_id": session.run_id,
        "owner_id": str(user["_id"]),
        "run": run.model_dump(mode="json"),
        "events": [e.model_dump(mode="json") for e in events],
        "diffs": diffs,
        "description": session.description,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "total_events": len(events),
        "total_diffs": len(diffs),
    }
    await get_database().export_sessions.insert_one(doc)
    return {
        "share_token": doc["share_token"],
        "share_url": f"/api/v1/export/session/{doc['share_token']}",
        "run_id": session.run_id,
        "exported_at": doc["exported_at"],
        "total_events": doc["total_events"],
        "total_diffs": doc["total_diffs"],
    }


# Public on purpose: the share token is the capability.
@router.get("/export/session/{share_token}", response_model=Dict[str, Any],
            summary="Retrieve an exported debug session by share token")
async def get_exported_session(share_token: str):
    doc = await get_database().export_sessions.find_one({"share_token": share_token}, {"_id": 0, "owner_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Export session not found")
    return doc


@router.get("/export/sessions", response_model=List[Dict[str, Any]], summary="List your exported debug sessions")
async def list_exported_sessions(user=Depends(require_auth)):
    cursor = (
        get_database()
        .export_sessions.find(
            {"owner_id": str(user["_id"])},
            {"_id": 0, "share_token": 1, "run_id": 1, "description": 1, "exported_at": 1,
             "total_events": 1, "total_diffs": 1},
        )
        .sort("exported_at", -1)
        .limit(100)
    )
    return [doc async for doc in cursor]
