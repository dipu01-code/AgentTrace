from app.api.v1.endpoints.determinism import compare_event_sequences
from app.api.v1.endpoints.loops import detect_loops


def ev(agent, type_, payload=None, ts=0.0):
    return {"id": f"{agent}-{type_}-{ts}", "agent_id": agent, "agent_name": agent, "type": type_,
            "payload": payload or {}, "timestamp": ts}


def test_detects_two_step_cycle():
    events = [ev("a", "agent_start")] + [ev("a", "tool_call", {"q": 1}), ev("b", "tool_result")] * 3 + [ev("a", "agent_end")]
    loops = detect_loops(events)
    assert len(loops) == 1
    assert loops[0]["start_index"] == 1 and loops[0]["period"] == 2 and loops[0]["repeats"] == 3


def test_no_loop_below_threshold():
    assert detect_loops([ev("a", "tool_call")] * 2) == []


def test_same_behaviour_different_timestamps_is_deterministic():
    a = [ev("a", "llm_call", {"p": "x"}, ts=100), ev("b", "tool_call", ts=101)]
    b = [ev("a", "llm_call", {"p": "x"}, ts=900), ev("b", "tool_call", ts=905)]
    assert compare_event_sequences(a, b)["deterministic"] is True


def test_divergence_and_extra_events_counted():
    a = [ev("a", "llm_call", {"p": "x"}), ev("b", "tool_call")]
    b = [ev("a", "llm_call", {"p": "y"}), ev("b", "tool_call"), ev("b", "error")]
    r = compare_event_sequences(a, b)
    assert r["deterministic"] is False
    assert r["first_divergence_index"] == 0
    assert r["difference_count"] == 2
