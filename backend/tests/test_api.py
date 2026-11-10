import time


def make_run(client, name="run"):
    r = client.post("/api/v1/runs/", json={"name": name})
    assert r.status_code == 201
    return r.json()["id"]


def event(type_="tool_call", agent="a1", payload=None):
    return {"agent_id": agent, "agent_name": agent, "type": type_, "timestamp": time.time(), "payload": payload or {}}


def test_reads_require_auth(client):
    anon = client.get("/api/v1/runs/", headers={"Authorization": ""})
    assert anon.status_code == 401


def test_list_runs_and_bad_id(client):
    run_id = make_run(client, "listed")
    assert run_id in [r["id"] for r in client.get("/api/v1/runs/").json()]
    assert client.get("/api/v1/runs/not-an-id").status_code == 404


def test_ingest_validates_and_updates_counters(client):
    run_id = make_run(client)
    assert client.post(f"/api/v1/runs/{run_id}/events", json=event("bogus")).status_code == 422
    assert client.post(f"/api/v1/runs/{run_id}/events", json=event()).status_code == 201
    batch = client.post(f"/api/v1/runs/{run_id}/events/batch", json=[event(), event("loop_detected")])
    assert batch.status_code == 201
    run = client.get(f"/api/v1/runs/{run_id}").json()
    assert run["total_events"] == 3 and run["loop_count"] == 1 and run["status"] == "looping"


def test_feature_routes_respond(client):
    run_id = make_run(client)
    client.post(f"/api/v1/runs/{run_id}/events/batch", json=[event("tool_call", payload={"q": 1})] * 3)
    client.post(f"/api/v1/runs/{run_id}/diffs", json=[{"path": "a", "before": 1, "after": 2}])
    other = make_run(client)
    client.post(f"/api/v1/runs/{other}/events/batch", json=[event("tool_call", payload={"q": 1})] * 3)

    assert client.get(f"/api/v1/runs/{run_id}/diffs").json()[0]["diffs"][0]["after"] == 2
    assert len(client.get(f"/api/v1/runs/{run_id}/replay").json()) == 3
    assert client.get(f"/api/v1/runs/{run_id}/loops").json()["loops"][0]["repeats"] == 3
    assert client.get(f"/api/v1/runs/{run_id}/bloat").json()["repetitive_calls"] == 2
    assert client.get(f"/api/v1/runs/{run_id}/compare/{other}").json()["deterministic"] is True
    test = client.post("/api/v1/regression/test", json={"name": "t", "baseline_run_id": run_id, "comparison_run_id": other})
    assert test.json()["passed"] is True
    assert client.get("/api/v1/regression/tests").json()[0]["id"] == test.json()["id"]


def test_export_roundtrip_and_list(client):
    run_id = make_run(client)
    exported = client.post("/api/v1/export/session", json={"run_id": run_id}).json()
    assert client.get(f"/api/v1/export/session/{exported['share_token']}").json()["run_id"] == run_id
    assert client.get("/api/v1/export/sessions").json()[0]["share_token"] == exported["share_token"]


def test_sync_ingests_valid_rejects_invalid_and_dedupes(client):
    run_id = make_run(client)
    changes = [{**event(), "id": "c1"}, {**event("nope"), "id": "c2"}]
    first = client.post("/api/v1/sync/run", json={"run_id": run_id, "client_changes": changes}).json()
    assert first["accepted_count"] == 1 and len(first["rejected"]) == 1 and first["status"] == "partial"
    again = client.post("/api/v1/sync/run", json={"run_id": run_id, "client_changes": changes[:1]}).json()
    assert again["accepted_count"] == 0 and again["conflicts"][0]["change_id"] == "c1"
    assert again["server_events_count"] == 1
    assert client.get("/api/v1/sync/status").json()["total_synced_runs"] >= 1


def test_stuck_runs_and_push_registration(client):
    run_id = make_run(client, "stuck")
    client.post(f"/api/v1/runs/{run_id}/events", json=event("loop_detected"))
    assert run_id in [r["id"] for r in client.get("/api/v1/runs/stuck").json()]
    ok = client.post("/api/v1/notifications/register", json={"token": "ExponentPushToken[abc]"})
    assert ok.json() == {"registered": True}
    assert client.post("/api/v1/notifications/register", json={"token": "junk"}).status_code == 422


def test_login(client):
    good = client.post("/api/v1/auth/login", json={"email": "t@example.com", "password": "secret1"})
    assert good.status_code == 200
    assert client.post("/api/v1/auth/login", json={"email": "t@example.com", "password": "wrong!"}).status_code == 401


def test_stuck_watcher_pushes_once_per_run(client, monkeypatch):
    from app.api.v1.endpoints import notifications
    sent = []
    monkeypatch.setattr(notifications, "_send_expo_push", lambda msgs: sent.extend(msgs))
    run_id = make_run(client, "watch")
    client.post(f"/api/v1/runs/{run_id}/events", json=event("loop_detected"))
    client.post("/api/v1/notifications/register", json={"token": "ExponentPushToken[w]"})

    alerted = client.portal.call(notifications.notify_stuck_runs_once)
    assert alerted >= 1 and any(m["to"] == "ExponentPushToken[w]" for m in sent)
    sent.clear()
    assert client.portal.call(notifications.notify_stuck_runs_once) == 0 and sent == []
