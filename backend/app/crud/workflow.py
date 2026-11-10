from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from app.db.database import get_database, to_object_id
from app.models.schemas import (
    WorkflowRunCreate, WorkflowRunOut,
    AgentEventCreate, AgentEventOut,
    StateDiff,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _run_out(doc: Dict[str, Any]) -> WorkflowRunOut:
    return WorkflowRunOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


def _event_out(doc: Dict[str, Any]) -> AgentEventOut:
    return AgentEventOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


async def create_workflow_run(run_in: WorkflowRunCreate) -> WorkflowRunOut:
    db = get_database()
    doc = run_in.model_dump()
    doc["created_at"] = doc["updated_at"] = _now()
    result = await db.workflow_runs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _run_out(doc)


async def get_workflow_run(run_id: str) -> Optional[WorkflowRunOut]:
    oid = to_object_id(run_id)
    if oid is None:
        return None
    doc = await get_database().workflow_runs.find_one({"_id": oid})
    return _run_out(doc) if doc else None


async def list_workflow_runs(skip: int = 0, limit: int = 50, status: Optional[str] = None) -> List[WorkflowRunOut]:
    query = {"status": status} if status else {}
    cursor = get_database().workflow_runs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return [_run_out(doc) async for doc in cursor]


async def count_workflow_runs() -> int:
    return await get_database().workflow_runs.count_documents({})


async def update_workflow_run(run_id: str, updates: Dict[str, Any]) -> Optional[WorkflowRunOut]:
    oid = to_object_id(run_id)
    if oid is None:
        return None
    updates = {k: v for k, v in updates.items() if v is not None}
    updates["updated_at"] = _now()
    result = await get_database().workflow_runs.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        return None
    return await get_workflow_run(run_id)


async def create_agent_events(run_id: str, events: List[AgentEventCreate], client_ids: Optional[List[Optional[str]]] = None) -> List[AgentEventOut]:
    """Insert events for a run and keep the run's counters and status in sync."""
    if not events:
        return []
    db = get_database()
    now = _now()
    docs = []
    for i, event in enumerate(events):
        doc = event.model_dump()
        doc["run_id"] = run_id
        doc["created_at"] = now
        if client_ids and client_ids[i]:
            doc["client_id"] = client_ids[i]
        docs.append(doc)
    result = await db.agent_events.insert_many(docs)
    for doc, oid in zip(docs, result.inserted_ids):
        doc["_id"] = oid
        doc.pop("client_id", None)

    types = [e.type for e in events]
    set_fields: Dict[str, Any] = {"updated_at": now}
    if "error" in types:
        set_fields["status"] = "failed"
    elif "loop_detected" in types:
        set_fields["status"] = "looping"
    await db.workflow_runs.update_one(
        {"_id": to_object_id(run_id)},
        {
            "$inc": {"total_events": len(events), "loop_count": types.count("loop_detected")},
            "$set": set_fields,
            # New activity means the run is no longer stuck; allow a fresh alert later
            "$unset": {"stuck_notified_at": ""},
        },
    )
    return [_event_out(doc) for doc in docs]


async def create_agent_event(run_id: str, event_in: AgentEventCreate) -> AgentEventOut:
    return (await create_agent_events(run_id, [event_in]))[0]


async def get_agent_events_for_run(run_id: str) -> List[AgentEventOut]:
    cursor = get_database().agent_events.find({"run_id": run_id}, {"client_id": 0}).sort("timestamp", 1)
    return [_event_out(doc) async for doc in cursor]


async def existing_client_ids(run_id: str, client_ids: List[str]) -> set[str]:
    cursor = get_database().agent_events.find(
        {"run_id": run_id, "client_id": {"$in": client_ids}}, {"client_id": 1}
    )
    return {doc["client_id"] async for doc in cursor}


async def save_state_diff(run_id: str, diffs: List[StateDiff]):
    await get_database().state_diffs.insert_one({
        "run_id": run_id,
        "diffs": [d.model_dump() for d in diffs],
        "created_at": _now(),
    })


async def get_state_diffs_for_run(run_id: str) -> List[Dict[str, Any]]:
    cursor = get_database().state_diffs.find({"run_id": run_id}).sort("created_at", -1)
    return [
        {
            "id": str(doc["_id"]),
            "run_id": doc["run_id"],
            "diffs": doc["diffs"],
            "created_at": doc["created_at"].isoformat(),
        }
        async for doc in cursor
    ]


async def find_stuck_runs(stuck_after_minutes: int, only_unnotified: bool = False) -> List[WorkflowRunOut]:
    """Runs that are looping, or still 'running' with no new events for a while."""
    cutoff = _now() - timedelta(minutes=stuck_after_minutes)
    query: Dict[str, Any] = {
        "$or": [
            {"status": "looping"},
            {"status": "running", "updated_at": {"$lt": cutoff}},
        ]
    }
    if only_unnotified:
        query["stuck_notified_at"] = {"$exists": False}
    cursor = get_database().workflow_runs.find(query).sort("updated_at", 1).limit(100)
    return [_run_out(doc) async for doc in cursor]


async def mark_runs_notified(run_ids: List[str]):
    oids = [to_object_id(r) for r in run_ids]
    await get_database().workflow_runs.update_many(
        {"_id": {"$in": [o for o in oids if o]}}, {"$set": {"stuck_notified_at": _now()}}
    )
