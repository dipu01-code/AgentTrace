import hashlib
import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.api.v1.endpoints.auth import require_auth
from app.crud.workflow import get_agent_events_for_run

router = APIRouter()


def _behaviour(event: Dict[str, Any]) -> Dict[str, Any]:
    # Wall-clock timestamps differ between any two runs, so only order + behaviour count.
    return {
        "agent_id": event.get("agent_id"),
        "type": event.get("type"),
        "payload": event.get("payload") or {},
    }


def _sha(obj: Any) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


def _hash_event_sequence(events: List[Dict[str, Any]]) -> str:
    return _sha([_behaviour(e) for e in events])


def _summary(e: Dict[str, Any]) -> Dict[str, Any]:
    return {"type": e["type"], "agent_name": e["agent_name"], "timestamp": e["timestamp"]}


def compare_event_sequences(events_a: List[Dict[str, Any]], events_b: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compare two time-ordered event lists. Shared by determinism and regression."""
    differing: List[Dict[str, Any]] = []
    for i, (a, b) in enumerate(zip(events_a, events_b)):
        if _behaviour(a) != _behaviour(b):
            differing.append({"index": i, "run_a_event": _summary(a), "run_b_event": _summary(b)})
    longer, label = (events_a, "run_a") if len(events_a) > len(events_b) else (events_b, "run_b")
    for i in range(min(len(events_a), len(events_b)), len(longer)):
        differing.append({"index": i, "extra_in": label, "event": _summary(longer[i])})

    hash_a, hash_b = _hash_event_sequence(events_a), _hash_event_sequence(events_b)
    return {
        "deterministic": hash_a == hash_b,
        "hash_a": hash_a,
        "hash_b": hash_b,
        "event_count_a": len(events_a),
        "event_count_b": len(events_b),
        "first_divergence_index": differing[0]["index"] if differing else None,
        "difference_count": len(differing),
        "differing_events": differing[:20],  # cap for UI
    }


async def load_events_or_404(run_id: str) -> List[Dict[str, Any]]:
    events = await get_agent_events_for_run(run_id)
    if not events:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found or has no events")
    return [e.model_dump() for e in events]


@router.get("/runs/{run_id_a}/compare/{run_id_b}", response_model=Dict[str, Any],
            dependencies=[Depends(require_auth)], summary="Compare two runs for determinism")
async def compare_runs_determinism(run_id_a: str, run_id_b: str):
    result = compare_event_sequences(await load_events_or_404(run_id_a), await load_events_or_404(run_id_b))
    return {"run_id_a": run_id_a, "run_id_b": run_id_b, **result}
