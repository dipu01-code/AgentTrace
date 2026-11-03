from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.database import get_database
from app.models.schemas import (
    WorkflowRunCreate, WorkflowRunInDB, WorkflowRunOut,
    AgentEventCreate, AgentEventInDB, AgentEventOut,
    StateDiff,
)
from bson import ObjectId
from datetime import datetime


async def create_workflow_run(run_in: WorkflowRunCreate) -> WorkflowRunOut:
    db = get_database()
    doc = run_in.model_dump()
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    result = await db.workflow_runs.insert_one(doc)
    created = await db.workflow_runs.find_one({"_id": result.inserted_id})
    return WorkflowRunOut(
        id=str(created["_id"]),
        name=created["name"],
        status=created["status"],
        total_events=created["total_events"],
        loop_count=created["loop_count"],
        deterministic=created["deterministic"],
        created_at=created["created_at"],
        updated_at=created["updated_at"],
    )


async def get_workflow_run(run_id: str) -> Optional[WorkflowRunOut]:
    db = get_database()
    doc = await db.workflow_runs.find_one({"_id": ObjectId(run_id)})
    if not doc:
        return None
    return WorkflowRunOut(
        id=str(doc["_id"]),
        name=doc["name"],
        status=doc["status"],
        total_events=doc["total_events"],
        loop_count=doc["loop_count"],
        deterministic=doc["deterministic"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def list_workflow_runs(skip: int = 0, limit: int = 50) -> List[WorkflowRunOut]:
    db = get_database()
    cursor = db.workflow_runs.find().sort("created_at", -1).skip(skip).limit(limit)
    runs = []
    async for doc in cursor:
        runs.append(WorkflowRunOut(
            id=str(doc["_id"]),
            name=doc["name"],
            status=doc["status"],
            total_events=doc["total_events"],
            loop_count=doc["loop_count"],
            deterministic=doc["deterministic"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        ))
    return runs


async def update_workflow_run(run_id: str, updates: Dict[str, Any]) -> Optional[WorkflowRunOut]:
    db = get_database()
    updates["updated_at"] = datetime.utcnow()
    result = await db.workflow_runs.update_one(
        {"_id": ObjectId(run_id)}, {"$set": updates}
    )
    if result.matched_count == 0:
        return None
    return await get_workflow_run(run_id)


async def create_agent_event(event_in: AgentEventCreate) -> AgentEventOut:
    db = get_database()
    doc = event_in.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await db.agent_events.insert_one(doc)
    created = await db.agent_events.find_one({"_id": result.inserted_id})
    return AgentEventOut(
        id=str(created["_id"]),
        run_id=created["run_id"],
        agent_id=created["agent_id"],
        agent_name=created["agent_name"],
        type=created["type"],
        timestamp=created["timestamp"],
        latency_ms=created.get("latency_ms"),
        payload=created["payload"],
        parent_id=created.get("parent_id"),
        created_at=created["created_at"],
    )


async def get_agent_events_for_run(run_id: str) -> List[AgentEventOut]:
    db = get_database()
    cursor = db.agent_events.find({"run_id": run_id}).sort("timestamp", 1)
    events = []
    async for doc in cursor:
        events.append(AgentEventOut(
            id=str(doc["_id"]),
            run_id=doc["run_id"],
            agent_id=doc["agent_id"],
            agent_name=doc["agent_name"],
            type=doc["type"],
            timestamp=doc["timestamp"],
            latency_ms=doc.get("latency_ms"),
            payload=doc["payload"],
            parent_id=doc.get("parent_id"),
            created_at=doc["created_at"],
        ))
    return events


async def save_state_diff(run_id: str, diffs: List[StateDiff]):
    db = get_database()
    await db.state_diffs.insert_one({
        "run_id": run_id,
        "diffs": [d.model_dump() for d in diffs],
        "created_at": datetime.utcnow(),
    })
