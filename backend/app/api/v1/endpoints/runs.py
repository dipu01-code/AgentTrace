from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from app.api.v1.endpoints.auth import require_auth
from app.core.config import settings
from app.crud.workflow import (
    create_agent_event,
    create_agent_events,
    create_workflow_run,
    find_stuck_runs,
    get_agent_events_for_run,
    get_workflow_run,
    list_workflow_runs,
    update_workflow_run,
)
from app.models.schemas import (
    AgentEventCreate,
    AgentEventOut,
    RunStatus,
    WorkflowRunCreate,
    WorkflowRunOut,
    WorkflowRunUpdate,
)

router = APIRouter()
# Reads need a logged-in user. Ingestion stays open so agents can post without a JWT.
# shortcut: ingestion has no auth; add an API key header before exposing the server publicly.
AUTH = [Depends(require_auth)]


async def _require_run(run_id: str) -> WorkflowRunOut:
    run = await get_workflow_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/", response_model=WorkflowRunOut, status_code=status.HTTP_201_CREATED,
             summary="Ingest a new workflow run")
async def ingest_run(run_in: WorkflowRunCreate):
    return await create_workflow_run(run_in)


@router.get("/", response_model=List[WorkflowRunOut], dependencies=AUTH, summary="List workflow runs")
async def list_runs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[RunStatus] = Query(None, alias="status"),
):
    return await list_workflow_runs(skip, limit, status_filter)


@router.get("/stuck", response_model=List[WorkflowRunOut], dependencies=AUTH,
            summary="Runs that are looping or have had no events for a while")
async def list_stuck_runs(minutes: int = Query(settings.STUCK_AFTER_MINUTES, ge=1)):
    return await find_stuck_runs(minutes)


@router.get("/{run_id}", response_model=WorkflowRunOut, dependencies=AUTH, summary="Get a workflow run by ID")
async def get_run(run_id: str):
    return await _require_run(run_id)


@router.patch("/{run_id}", response_model=WorkflowRunOut, summary="Update a run's name or status")
async def patch_run(run_id: str, update: WorkflowRunUpdate):
    run = await update_workflow_run(run_id, update.model_dump())
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/{run_id}/events", response_model=AgentEventOut, status_code=status.HTTP_201_CREATED,
             summary="Ingest an agent event for a run")
async def ingest_event(run_id: str, event_in: AgentEventCreate):
    await _require_run(run_id)
    return await create_agent_event(run_id, event_in)


@router.post("/{run_id}/events/batch", response_model=List[AgentEventOut], status_code=status.HTTP_201_CREATED,
             summary="Batch ingest agent events")
async def ingest_events_batch(run_id: str, events: List[AgentEventCreate] = Body(..., max_length=5000)):
    await _require_run(run_id)
    return await create_agent_events(run_id, events)


@router.get("/{run_id}/events", response_model=List[AgentEventOut], dependencies=AUTH,
            summary="List all events for a run")
async def list_events(run_id: str):
    await _require_run(run_id)
    return await get_agent_events_for_run(run_id)
