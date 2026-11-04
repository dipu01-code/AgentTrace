from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.schemas.event_validation import validate_agent_event, validate_event_batch
from app.crud.workflow import create_agent_event
from app.models.schemas import AgentEventOut

router = APIRouter()


@router.post(
    "/",
    response_model=Dict[str, Any],
    summary="Validate a single agent event without saving",
)
async def validate_single_event(raw: Dict[str, Any]):
    """Check whether a raw event dict conforms to the agent event schema.
    Does not persist anything to the database.
    """
    result = validate_agent_event(raw)
    if result.valid:
        return {"valid": True, "event": result.event.model_dump()}
    return {"valid": False, "errors": result.errors}


@router.post(
    "/batch",
    response_model=Dict[str, Any],
    summary="Validate a batch of agent events without saving",
)
async def validate_batch_events(raw_events: List[Dict[str, Any]]):
    """Validate multiple events at once. Returns counts and per-event errors."""
    return validate_event_batch(raw_events)


@router.post(
    "/runs/{run_id}/events/validated",
    response_model=AgentEventOut,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest an agent event with schema validation",
)
async def ingest_validated_event(run_id: str, raw: Dict[str, Any]):
    """Validate then persist an agent event. Rejects with 422 on schema failure."""
    from app.models.schemas import AgentEventCreate

    result = validate_agent_event(raw)
    if not result.valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": result.errors},
        )
    event = result.event
    event_in = AgentEventCreate(
        run_id=run_id,
        agent_id=event.agent_id,
        agent_name=event.agent_name,
        type=event.type,
        timestamp=event.timestamp,
        latency_ms=event.latency_ms,
        payload=event.payload,
        parent_id=event.parent_id,
    )
    return await create_agent_event(event_in)
