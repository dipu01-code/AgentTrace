// Seeds the backend directly (the agent side of AgentTrace) so the app has data to show.
const API = process.env.E2E_API_URL || 'http://localhost:8000/api/v1';

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

/** A run where a planner and a searcher bounce the same call back and forth (a loop). */
async function seedLoopingRun(name) {
  const run = await post('/runs/', { name });
  const t0 = Date.now() / 1000 - 30;
  const ev = (i, agent, type, payload = {}) => ({
    agent_id: agent.toLowerCase(),
    agent_name: agent,
    type,
    timestamp: t0 + i,
    latency_ms: 120 + i,
    payload,
  });
  const events = [ev(0, 'Planner', 'agent_start')];
  for (let i = 0; i < 3; i++) {
    events.push(ev(1 + i * 2, 'Planner', 'tool_call', { tool: 'search', q: 'weather' }));
    events.push(ev(2 + i * 2, 'Searcher', 'tool_result', { ok: false }));
  }
  events.push(ev(9, 'Planner', 'state_change', { path: 'plan.step', value: 2 }));
  await post(`/runs/${run.id}/events/batch`, events);
  await post(`/runs/${run.id}/diffs`, [{ path: 'plan.step', before: 1, after: 2 }]);
  return run;
}

module.exports = { seedLoopingRun };
