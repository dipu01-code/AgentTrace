from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.api.v1.endpoints.auth import require_auth
from app.crud.workflow import get_agent_events_for_run

router = APIRouter()


@router.get("/runs/{run_id}/replay", response_model=List[Dict[str, Any]], dependencies=[Depends(require_auth)],
            summary="Get events ordered for replay")
async def get_replay_events(run_id: str):
    """Events sorted by timestamp with elapsed_ms measured from the first event."""
    events = await get_agent_events_for_run(run_id)  # already sorted by timestamp
    if not events:
        raise HTTPException(status_code=404, detail="Run not found or has no events")
    base_ts = events[0].timestamp
    return [
        {**e.model_dump(), "elapsed_ms": (e.timestamp - base_ts) * 1000, "created_at": e.created_at.isoformat()}
        for e in events
    ]
