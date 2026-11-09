from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from uuid import uuid4
from datetime import datetime, timezone
from app.crud.workflow import (
    get_agent_events_for_run,
    get_workflow_run,
    get_state_diffs_for_run,
    list_workflow_runs,
)

router = APIRouter()

# In-memory sync store (Phase 19 — replaced by proper DB in production)
_sync_sessions: Dict[str, Dict[str, Any]] = {}


class SyncRequest(BaseModel):
    run_id: str
    client_timestamp: Optional[str] = None
    include_events: bool = True
    include_diffs: bool = True
    client_changes: Optional[List[Dict[str, Any]]] = None


class SyncResponse(BaseModel):
    sync_id: str
    run_id: str
    server_timestamp: str
    server_events_count: int
    server_diffs_count: int
    conflicts: List[Dict[str, Any]]
    merged_changes: List[Dict[str, Any]]
    status: str  # 'synced' | 'conflict' | 'error'


class SyncStatus(BaseModel):
    last_sync: Optional[str]
    pending_changes: int
    total_synced_runs: int
    status: str  # 'synced' | 'pending' | 'error'


@router.post(
    "/sync/run",
    response_model=SyncResponse,
    summary="Sync a workflow run between client and server",
)
async def sync_run(sync_in: SyncRequest):
    """Synchronize a workflow run's events and diffs between client and server.
    
    Handles conflict detection when client and server have diverged.
    """
    run = await get_workflow_run(sync_in.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {sync_in.run_id} not found")

    server_events = await get_agent_events_for_run(sync_in.run_id)
    server_diffs = await get_state_diffs_for_run(sync_in.run_id)

    server_event_count = len(server_events)
    server_diff_count = len(server_diffs)

    conflicts = []
    merged_changes = []

    # Detect conflicts: if client has changes and server timestamp is newer
    if sync_in.client_changes:
        for change in sync_in.client_changes:
            change_ts = change.get("timestamp", "")
            if sync_in.client_timestamp and change_ts > sync_in.client_timestamp:
                conflicts.append({
                    "run_id": sync_in.run_id,
                    "change_id": change.get("id", "unknown"),
                    "client_timestamp": change_ts,
                    "server_timestamp": sync_in.client_timestamp,
                    "resolution": "server_wins",
                })
            else:
                merged_changes.append(change)

    sync_id = str(uuid4())
    server_timestamp = datetime.now(timezone.utc).isoformat()

    _sync_sessions[sync_id] = {
        "sync_id": sync_id,
        "run_id": sync_in.run_id,
        "server_timestamp": server_timestamp,
        "server_events_count": server_event_count,
        "server_diffs_count": server_diff_count,
        "conflicts": conflicts,
        "merged_changes": merged_changes,
        "status": "conflict" if conflicts else "synced",
        "created_at": server_timestamp,
    }

    return SyncResponse(
        sync_id=sync_id,
        run_id=sync_in.run_id,
        server_timestamp=server_timestamp,
        server_events_count=server_event_count,
        server_diffs_count=server_diff_count,
        conflicts=conflicts,
        merged_changes=merged_changes,
        status="conflict" if conflicts else "synced",
    )


@router.get(
    "/sync/status",
    response_model=SyncStatus,
    summary="Get sync status for all runs",
)
async def get_sync_status():
    """Return the overall sync status across all workflow runs."""
    total_runs = len(await list_workflow_runs())
    total_synced = len(_sync_sessions)
    pending = sum(1 for s in _sync_sessions.values() if s["status"] == "conflict")

    last_sync = None
    if _sync_sessions:
        last_sync = max(s["created_at"] for s in _sync_sessions.values())

    return SyncStatus(
        last_sync=last_sync,
        pending_changes=pending,
        total_synced_runs=total_synced,
        status="synced" if pending == 0 else "pending",
    )


@router.get(
    "/sync/sessions",
    response_model=List[Dict[str, Any]],
    summary="List all sync sessions",
)
async def list_sync_sessions():
    """List all sync sessions, newest first."""
    sessions = sorted(
        _sync_sessions.values(),
        key=lambda s: s["created_at"],
        reverse=True,
    )
    return sessions
