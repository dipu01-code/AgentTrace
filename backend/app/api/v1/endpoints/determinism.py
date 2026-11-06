import hashlib
import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.crud.workflow import get_agent_events_for_run

router = APIRouter()


def _hash_event_sequence(events: List[Dict[str, Any]]) -> str:
    """Compute a stable SHA-256 hash of an event sequence for determinism comparison.

    Only includes fields that affect behavior: agent, type, timestamp (rounded),
    and payload. Excludes IDs and created_at which vary per run.
    """
    normalized = []
    for event in events:
        normalized.append({
            "agent_id": event.get("agent_id"),
            "agent_name": event.get("agent_name"),
            "type": event.get("type"),
            "timestamp": round(event.get("timestamp", 0), 3),
            "payload": event.get("payload", {}),
        })
    canonical = json.dumps(normalized, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _event_fingerprint(event: Dict[str, Any]) -> str:
    """Stable fingerprint for a single event (for diff display)."""
    return hashlib.sha256(
        json.dumps({
            "agent_id": event.get("agent_id"),
            "agent_name": event.get("agent_name"),
            "type": event.get("type"),
            "timestamp": round(event.get("timestamp", 0), 3),
            "payload": event.get("payload", {}),
        }, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()[:12]


@router.get(
    "/runs/{run_id_a}/compare/{run_id_b}",
    response_model=Dict[str, Any],
    summary="Compare two runs for determinism",
)
async def compare_runs_determinism(run_id_a: str, run_id_b: str):
    """Compare two workflow runs for determinism using hash-based event sequence comparison.

    Returns whether the runs are deterministic (identical event sequences) or not,
    along with the first point of divergence and a list of differing events.
    """
    events_a = await get_agent_events_for_run(run_id_a)
    events_b = await get_agent_events_for_run(run_id_b)

    if not events_a:
        raise HTTPException(status_code=404, detail=f"Run {run_id_a} not found or has no events")
    if not events_b:
        raise HTTPException(status_code=404, detail=f"Run {run_id_b} not found or has no events")

    events_a_sorted = sorted(events_a, key=lambda e: e.timestamp)
    events_b_sorted = sorted(events_b, key=lambda e: e.timestamp)

    hash_a = _hash_event_sequence([e.model_dump() for e in events_a_sorted])
    hash_b = _hash_event_sequence([e.model_dump() for e in events_b_sorted])

    deterministic = hash_a == hash_b

    # Find first divergence
    first_divergence_index = None
    differing_events = []
    min_len = min(len(events_a_sorted), len(events_b_sorted))
    for i in range(min_len):
        fp_a = _event_fingerprint(events_a_sorted[i].model_dump())
        fp_b = _event_fingerprint(events_b_sorted[i].model_dump())
        if fp_a != fp_b:
            if first_divergence_index is None:
                first_divergence_index = i
            differing_events.append({
                "index": i,
                "run_a_event": {
                    "type": events_a_sorted[i].type,
                    "agent_name": events_a_sorted[i].agent_name,
                    "timestamp": events_a_sorted[i].timestamp,
                },
                "run_b_event": {
                    "type": events_b_sorted[i].type,
                    "agent_name": events_b_sorted[i].agent_name,
                    "timestamp": events_b_sorted[i].timestamp,
                },
            })

    # If one run has more events than the other, those are also differences
    if len(events_a_sorted) != len(events_b_sorted):
        longer = events_a_sorted if len(events_a_sorted) > len(events_b_sorted) else events_b_sorted
        longer_label = "run_a" if len(events_a_sorted) > len(events_b_sorted) else "run_b"
        for i in range(min_len, len(longer)):
            differing_events.append({
                "index": i,
                "extra_in": longer_label,
                "event": {
                    "type": longer[i].type,
                    "agent_name": longer[i].agent_name,
                    "timestamp": longer[i].timestamp,
                },
            })

    return {
        "run_id_a": run_id_a,
        "run_id_b": run_id_b,
        "deterministic": deterministic,
        "hash_a": hash_a,
        "hash_b": hash_b,
        "event_count_a": len(events_a_sorted),
        "event_count_b": len(events_b_sorted),
        "first_divergence_index": first_divergence_index,
        "difference_count": len(differing_events),
        "differing_events": differing_events[:20],  # cap for UI
    }
