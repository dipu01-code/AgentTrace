from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.v1.endpoints.auth import require_auth
from app.crud.workflow import (
    create_agent_events,
    existing_client_ids,
    get_state_diffs_for_run,
    get_workflow_run,
)
from app.db.database import get_database
from app.models.schemas import AgentEventCreate
from app.schemas.event_validation import validate_agent_event

router = APIRouter(dependencies=[Depends(require_auth)])


class SyncRequest(BaseModel):
    run_id: str
    # Raw events recorded on the client. An optional "id" makes re-sending idempotent.
    client_changes: List[Dict[str, Any]] = Field(default_factory=list, max_length=5000)


class SyncResponse(BaseModel):
    sync_id: str
    run_id: str
    server_timestamp: str
    server_events_count: int
    server_diffs_count: int
    accepted_count: int
    conflicts: List[Dict[str, Any]]   # already on the server (same client id): server copy kept
    rejected: List[Dict[str, Any]]    # failed schema validation
    status: str                       # 'synced' | 'partial'


class SyncStatus(BaseModel):
    last_sync: Optional[str]
    pending_changes: int
    total_synced_runs: int
    status: str


@router.post("/sync/run", response_model=SyncResponse, summary="Push client events for a run and get server totals")
async def sync_run(sync_in: SyncRequest):
    run = await get_workflow_run(sync_in.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {sync_in.run_id} not found")

    ids = [str(c["id"]) for c in sync_in.client_changes if c.get("id")]
    already = await existing_client_ids(sync_in.run_id, ids) if ids else set()

    conflicts, rejected, accepted, accepted_ids = [], [], [], []
    for index, change in enumerate(sync_in.client_changes):
        client_id = str(change["id"]) if change.get("id") else None
        if client_id and (client_id in already or client_id in accepted_ids):
            conflicts.append({"index": index, "change_id": client_id, "resolution": "server_wins"})
            continue
        result = validate_agent_event({**change, "run_id": sync_in.run_id})
        if not result.valid:
            rejected.append({"index": index, "change_id": client_id, "errors": result.errors})
            continue
        accepted.append(AgentEventCreate(**result.event.model_dump()))
        accepted_ids.append(client_id)

    await create_agent_events(sync_in.run_id, accepted, accepted_ids)
    now = datetime.now(timezone.utc)
    refreshed = await get_workflow_run(sync_in.run_id)
    diffs_count = len(await get_state_diffs_for_run(sync_in.run_id))
    status = "partial" if rejected else "synced"
    session = {
        "run_id": sync_in.run_id,
        "created_at": now,
        "server_events_count": refreshed.total_events,
        "server_diffs_count": diffs_count,
        "accepted_count": len(accepted),
        "conflicts": conflicts,
        "rejected": rejected,
        "status": status,
    }
    result = await get_database().sync_sessions.insert_one(session)
    return SyncResponse(sync_id=str(result.inserted_id), server_timestamp=now.isoformat(),
                        **{k: v for k, v in session.items() if k != "created_at"})


@router.get("/sync/status", response_model=SyncStatus, summary="Overall sync status")
async def get_sync_status():
    db = get_database()
    last = await db.sync_sessions.find_one(sort=[("created_at", -1)])
    synced_runs = len(await db.sync_sessions.distinct("run_id"))
    pending = await db.sync_sessions.count_documents({"status": "partial"})
    return SyncStatus(
        last_sync=last["created_at"].isoformat() if last else None,
        pending_changes=pending,
        total_synced_runs=synced_runs,
        status="synced" if pending == 0 else "pending",
    )


@router.get("/sync/sessions", response_model=List[Dict[str, Any]], summary="List sync sessions, newest first")
async def list_sync_sessions():
    cursor = get_database().sync_sessions.find().sort("created_at", -1).limit(100)
    return [
        {**{k: v for k, v in doc.items() if k != "_id"}, "sync_id": str(doc["_id"]),
         "server_timestamp": doc["created_at"].isoformat(), "created_at": doc["created_at"].isoformat()}
        async for doc in cursor
    ]
