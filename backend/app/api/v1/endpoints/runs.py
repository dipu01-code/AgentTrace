from fastapi import APIRouter, HTTPException, status, Body
from typing import List, Dict, Any
from app.crud.workflow import (
    create_workflow_run,
    get_workflow_run,
    create_agent_event,
    get_agent_events_for_run,
)
from app.models.schemas import (
    WorkflowRunCreate, WorkflowRunOut,
    AgentEventCreate, AgentEventOut,
)

router = APIRouter()


@router.post(
    "/",
    response_model=WorkflowRunOut,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a new workflow run",
)
async def ingest_run(run_in: WorkflowRunCreate):
    """Create a new multi-agent workflow run record."""
    return await create_workflow_run(run_in)


@router.get(
    "/{run_id}",
    response_model=WorkflowRunOut,
    summary="Get a workflow run by ID",
)
async def get_run(run_id: str):
    run = await get_workflow_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post(
    "/{run_id}/events",
    response_model=AgentEventOut,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest an agent event for a run",
)
async def ingest_event(run_id: str, event_in: AgentEventCreate):
    """Append a single agent event (tool call, LLM call, state change, etc.) to a run."""
    event_in.run_id = run_id
    return await create_agent_event(event_in)


@router.post(
    "/{run_id}/events/batch",
    response_model=List[AgentEventOut],
    status_code=status.HTTP_201_CREATED,
    summary="Batch ingest agent events",
)
async def ingest_events_batch(run_id: str, events: List[AgentEventCreate] = Body(...)):
    """Bulk-ingest agent events for a run (useful for replaying a full trace)."""
    created = []
    for event_in in events:
        event_in.run_id = run_id
        created.append(await create_agent_event(event_in))
    return created


@router.get(
    "/{run_id}/events",
    response_model=List[AgentEventOut],
    summary="List all events for a run",
)
async def list_events(run_id: str):
    return await get_agent_events_for_run(run_id)
