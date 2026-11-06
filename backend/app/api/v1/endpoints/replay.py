from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.crud.workflow import get_agent_events_for_run

router = APIRouter()


@router.get(
    "/runs/{run_id}/replay",
    response_model=List[Dict[str, Any]],
    summary="Get events ordered for replay",
)
async def get_replay_events(run_id: str):
    """Return all events for a run sorted by timestamp, normalized to start at 0.
    Used by the replay scrubber to position events on a timeline.
    """
    events = await get_agent_events_for_run(run_id)
    if not events:
        raise HTTPException(status_code=404, detail="Run not found or has no events")

    # Normalize timestamps so the first event starts at 0
    base_ts = min(e.timestamp for e in events)
    replay = []
    for event in events:
        replay.append({
            "id": event.id,
            "run_id": event.run_id,
            "agent_id": event.agent_id,
            "agent_name": event.agent_name,
            "type": event.type,
            "timestamp": event.timestamp,
            "elapsed_ms": (event.timestamp - base_ts) * 1000,
            "latency_ms": event.latency_ms,
            "payload": event.payload,
            "parent_id": event.parent_id,
            "created_at": event.created_at.isoformat(),
        })
    replay.sort(key=lambda e: e["elapsed_ms"])
    return replay
