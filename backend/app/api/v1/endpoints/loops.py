import json
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.endpoints.auth import require_auth
from app.crud.workflow import get_agent_events_for_run

router = APIRouter()


def _key(event: Dict[str, Any]) -> str:
    return json.dumps([event.get("agent_id"), event.get("type"), event.get("payload") or {}], sort_keys=True, default=str)


def detect_loops(events: List[Dict[str, Any]], min_repeats: int = 3, max_period: int = 10) -> List[Dict[str, Any]]:
    """Find back-to-back repeats of the same event cycle (A→B→A→B→A→B ...).

    An event's identity is agent + type + payload, so the same call made with
    the same input is treated as the same step. Shortest cycle wins.
    """
    keys = [_key(e) for e in events]
    loops: List[Dict[str, Any]] = []
    i = 0
    while i < len(keys):
        found = None
        for period in range(1, max_period + 1):
            cycle = keys[i:i + period]
            if len(cycle) < period:
                break
            repeats = 1
            while keys[i + repeats * period:i + (repeats + 1) * period] == cycle:
                repeats += 1
            if repeats >= min_repeats:
                found = (period, repeats)
                break
        if not found:
            i += 1
            continue
        period, repeats = found
        span = events[i:i + period * repeats]
        loops.append({
            "start_index": i,
            "period": period,
            "repeats": repeats,
            "cycle": [{"agent_name": e.get("agent_name"), "type": e.get("type")} for e in span[:period]],
            "event_ids": [e.get("id") for e in span],
        })
        i += period * repeats
    return loops


@router.get("/runs/{run_id}/loops", response_model=Dict[str, Any], dependencies=[Depends(require_auth)],
            summary="Detect repeating event cycles in a run")
async def get_run_loops(run_id: str):
    events = await get_agent_events_for_run(run_id)
    if not events:
        raise HTTPException(status_code=404, detail="Run not found or has no events")
    dicts = [e.model_dump() for e in events]
    return {
        "run_id": run_id,
        "total_events": len(dicts),
        "loops": detect_loops(dicts),
        # Events the agent framework itself flagged as loops
        "flagged_event_ids": [e["id"] for e in dicts if e["type"] == "loop_detected"],
    }
