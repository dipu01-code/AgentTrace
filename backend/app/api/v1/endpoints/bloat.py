from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from collections import Counter, defaultdict
import json
from app.api.v1.endpoints.auth import require_auth
from app.crud.workflow import get_agent_events_for_run

router = APIRouter()


def _event_key(event: Dict[str, Any]) -> str:
    """Stable key for identifying repetitive event patterns."""
    return f"{event.get('agent_id')}:{event.get('type')}:{json.dumps(event.get('payload', {}), sort_keys=True)}"


def _analyze_bloat(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze a run's events for code bloat patterns.

    Detects:
    - Repeated identical calls (same agent + type + payload)
    - Redundant state changes (same path, same value)
    - Rapid-fire LLM calls from same agent
    - Event sequences that could be condensed
    """
    total_events = len(events)
    if total_events == 0:
        return {
            "run_id": "",
            "bloat_score": 0,
            "total_events": 0,
            "repetitive_calls": 0,
            "redundant_state_changes": 0,
            "rapid_llm_calls": 0,
            "condensable_sequences": 0,
            "patterns": [],
            "suggestions": [],
            "component_breakdown": {},
        }

    # Count event keys for repetition detection
    key_counts: Counter[str] = Counter()
    for event in events:
        key_counts[_event_key(event)] += 1

    # Repetitive calls: events with the same key appearing > 1 time
    repetitive_keys = {k: c for k, c in key_counts.items() if c > 1}
    repetitive_calls = sum(c - 1 for c in repetitive_keys.values())  # excess beyond first

    # Redundant state changes: state_change events with same path + value
    state_changes = [e for e in events if e.get("type") == "state_change"]
    sc_keys: Counter[str] = Counter()
    for sc in state_changes:
        payload = sc.get("payload", {})
        path = payload.get("path", "")
        value = payload.get("value", "")
        sc_keys[f"{path}:{json.dumps(value, sort_keys=True)}"] += 1
    redundant_state_changes = sum(c - 1 for c in sc_keys.values() if c > 1)

    # Rapid-fire LLM calls: same agent making > 3 LLM calls in sequence
    llm_calls = [e for e in events if e.get("type") in ("llm_call", "llm_result")]
    agent_llm_counts: Counter[str] = Counter()
    for lc in llm_calls:
        agent_llm_counts[lc.get("agent_id", "")] += 1
    rapid_llm_calls = sum(c - 3 for c in agent_llm_counts.values() if c > 3)

    # Condensable sequences: 3+ consecutive events of same type from same agent
    condensable = 0
    i = 0
    while i < len(events) - 2:
        e1, e2, e3 = events[i], events[i + 1], events[i + 2]
        if (e1.get("agent_id") == e2.get("agent_id") == e3.get("agent_id")
                and e1.get("type") == e2.get("type") == e3.get("type")):
            condensable += 1
            i += 3  # skip past this run
        else:
            i += 1

    # Build pattern details
    patterns: List[Dict[str, Any]] = []
    for key, count in sorted(repetitive_keys.items(), key=lambda x: -x[1])[:10]:
        parts = key.split(":", 2)
        patterns.append({
            "type": "repetitive_call",
            "agent_id": parts[0] if len(parts) > 0 else "",
            "event_type": parts[1] if len(parts) > 1 else "",
            "count": count,
            "excess": count - 1,
            "description": f"{parts[1] if len(parts) > 1 else 'event'} called {count} times by {parts[0] if len(parts) > 0 else 'agent'}",
        })

    # Bloat score: 0-100, higher = more bloat
    bloat_components = {
        "repetitive": min(repetitive_calls * 10, 40),
        "state": min(redundant_state_changes * 15, 25),
        "llm": min(rapid_llm_calls * 20, 20),
        "sequence": min(condensable * 10, 15),
    }
    bloat_score = min(sum(bloat_components.values()), 100)

    # Suggestions
    suggestions: List[str] = []
    if repetitive_calls > 0:
        suggestions.append(
            f"Collapse {repetitive_calls} repeated agent calls — consider deduplicating tool invocations"
        )
    if redundant_state_changes > 0:
        suggestions.append(
            f"Remove {redundant_state_changes} redundant state changes — same path/value written multiple times"
        )
    if rapid_llm_calls > 0:
        suggestions.append(
            f"Batch {rapid_llm_calls} excess LLM calls — reduce round-trips to the model"
        )
    if condensable > 0:
        suggestions.append(
            f"Condense {condensable} consecutive same-type event sequences — merge into single operations"
        )
    if bloat_score == 0:
        suggestions.append("No significant bloat detected — run is clean")

    return {
        "run_id": events[0].get("run_id", "") if events else "",
        "bloat_score": bloat_score,
        "total_events": total_events,
        "repetitive_calls": repetitive_calls,
        "redundant_state_changes": redundant_state_changes,
        "rapid_llm_calls": rapid_llm_calls,
        "condensable_sequences": condensable,
        "patterns": patterns,
        "suggestions": suggestions,
        "component_breakdown": bloat_components,
    }


@router.get(
    "/runs/{run_id}/bloat",
    response_model=Dict[str, Any],
    dependencies=[Depends(require_auth)],
    summary="Analyze a run for code bloat",
)
async def analyze_run_bloat(run_id: str):
    """Analyze a workflow run for code bloat patterns.

    Returns a bloat score (0-100), counts of different bloat types,
    pattern details, and suggestions for remediation.
    """
    events = await get_agent_events_for_run(run_id)
    if not events:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found or has no events")

    event_dicts = [e.model_dump() for e in events]
    return _analyze_bloat(event_dicts)
