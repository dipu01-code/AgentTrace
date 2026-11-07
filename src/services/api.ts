import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = (): string | null => authToken;

const headers = (extra: Record<string, string> = {}): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return { ...h, ...extra };
};

export interface RunSummary {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'looping';
  totalEvents: number;
  loopCount: number;
  deterministic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AgentEvent {
  id: string;
  runId: string;
  agentId: string;
  agentName: string;
  type: string;
  timestamp: number;
  latencyMs?: number;
  payload: Record<string, unknown>;
  parentId?: string;
}

const mapRunFromApi = (run: any): RunSummary => ({
  id: run.id,
  name: run.name,
  status: run.status,
  totalEvents: run.total_events ?? 0,
  loopCount: run.loop_count ?? 0,
  deterministic: run.deterministic ?? true,
  createdAt: new Date(run.created_at).getTime(),
  updatedAt: new Date(run.updated_at).getTime(),
});

const mapEventFromApi = (event: any): AgentEvent => ({
  id: event.id,
  runId: event.run_id,
  agentId: event.agent_id,
  agentName: event.agent_name,
  type: event.type,
  timestamp: event.timestamp * 1000,
  latencyMs: event.latency_ms,
  payload: event.payload ?? {},
  parentId: event.parent_id,
});

export const api = {
  async getRuns(): Promise<RunSummary[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
    const data = await res.json();
    return data.map(mapRunFromApi);
  },

  async getRun(runId: string): Promise<RunSummary> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to fetch run: ${res.status}`);
    const data = await res.json();
    return mapRunFromApi(data);
  },

  async getEvents(runId: string): Promise<AgentEvent[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/events`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
    const data = await res.json();
    return data.map(mapEventFromApi);
  },

  async createRun(name: string): Promise<RunSummary> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name, status: 'running' }),
    });
    if (!res.ok) throw new Error(`Failed to create run: ${res.status}`);
    const data = await res.json();
    return mapRunFromApi(data);
  },

  async createEvent(runId: string, event: Omit<AgentEvent, 'id'>): Promise<AgentEvent> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/events`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        run_id: runId,
        agent_id: event.agentId,
        agent_name: event.agentName,
        type: event.type,
        timestamp: event.timestamp / 1000,
        latency_ms: event.latencyMs,
        payload: event.payload,
        parent_id: event.parentId,
      }),
    });
    if (!res.ok) throw new Error(`Failed to create event: ${res.status}`);
    const data = await res.json();
    return mapEventFromApi(data);
  },

  async getStateDiffs(runId: string): Promise<StateDiffEntry[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/diffs`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to fetch state diffs: ${res.status}`);
    const data = await res.json();
    return data.map((entry: any) => ({
      id: entry.id,
      runId: entry.run_id,
      createdAt: new Date(entry.created_at).getTime(),
      diffs: entry.diffs.map((d: any) => ({
        path: d.path,
        before: d.before,
        after: d.after,
      })),
    }));
  },

  async saveStateDiffs(runId: string, diffs: StateDiffInput[]): Promise<{ saved: number; run_id: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/diffs`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(diffs.map(d => ({
        path: d.path,
        before: d.before,
        after: d.after,
      }))),
    });
    if (!res.ok) throw new Error(`Failed to save state diffs: ${res.status}`);
    return res.json();
  },

  async getReplayEvents(runId: string): Promise<ReplayEvent[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/replay`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to fetch replay events: ${res.status}`);
    const data = await res.json();
    return data.map((e: any) => ({
      id: e.id,
      runId: e.run_id,
      agentId: e.agent_id,
      agentName: e.agent_name,
      type: e.type,
      timestamp: e.timestamp,
      elapsedMs: e.elapsed_ms,
      latencyMs: e.latency_ms,
      payload: e.payload ?? {},
      parentId: e.parent_id,
      createdAt: new Date(e.created_at).getTime(),
    }));
  },

  async compareRuns(runIdA: string, runIdB: string): Promise<DeterminismResult> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runIdA}/compare/${runIdB}`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to compare runs: ${res.status}`);
    return res.json();
  },

  async runRegressionTest(test: RegressionTestInput): Promise<RegressionTestResult> {
    const res = await fetch(`${API_BASE_URL}/api/v1/regression/test`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(test),
    });
    if (!res.ok) throw new Error(`Failed to run regression test: ${res.status}`);
    return res.json();
  },

  async listRegressionTests(): Promise<RegressionTestResult[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/regression/tests`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to list regression tests: ${res.status}`);
    return res.json();
  },

  async analyzeBloat(runId: string): Promise<BloatAnalysis> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/bloat`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to analyze bloat: ${res.status}`);
    return res.json();
  },

  async exportSession(runId: string, includeEvents: boolean, includeDiffs: boolean, description?: string): Promise<{ share_token: string; share_url: string; run_id: string; exported_at: string; total_events: number; total_diffs: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/export/session`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ run_id: runId, include_events: includeEvents, include_diffs: includeDiffs, description }),
    });
    if (!res.ok) throw new Error(`Failed to export session: ${res.status}`);
    return res.json();
  },

  async getExportedSession(shareToken: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/export/session/${shareToken}`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to get exported session: ${res.status}`);
    return res.json();
  },

  async listExportedSessions(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/export/sessions`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to list exported sessions: ${res.status}`);
    return res.json();
  },

  // Auth endpoints
  async register(email: string, password: string, name?: string): Promise<{ access_token: string; user_id: string; email: string; name?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Registration failed: ${res.status}`);
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<{ access_token: string; user_id: string; email: string; name?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Login failed: ${res.status}`);
    }
    return res.json();
  },

  async logout(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: headers(),
    });
    if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
    return res.json();
  },

  async getCurrentUser(): Promise<{ id: string; email: string; name?: string; created_at: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to get user: ${res.status}`);
    return res.json();
  },
};

export interface StateDiffInput {
  path: string;
  before: unknown;
  after: unknown;
}

export interface StateDiffEntry {
  id: string;
  runId: string;
  createdAt: number;
  diffs: StateDiffInput[];
}

export interface ReplayEvent {
  id: string;
  runId: string;
  agentId: string;
  agentName: string;
  type: string;
  timestamp: number;
  elapsedMs: number;
  latencyMs?: number;
  payload: Record<string, unknown>;
  parentId?: string;
  createdAt: number;
}

export interface DeterminismResult {
  run_id_a: string;
  run_id_b: string;
  deterministic: boolean;
  hash_a: string;
  hash_b: string;
  event_count_a: number;
  event_count_b: number;
  first_divergence_index: number | null;
  difference_count: number;
  differing_events: Array<{
    index: number;
    run_a_event?: { type: string; agent_name: string; timestamp: number };
    run_b_event?: { type: string; agent_name: string; timestamp: number };
    extra_in?: string;
    event?: { type: string; agent_name: string; timestamp: number };
  }>;
}

export interface RegressionTestInput {
  name: string;
  baseline_run_id: string;
  comparison_run_id: string;
  description?: string;
}

export interface RegressionTestResult {
  id: string;
  name: string;
  baseline_run_id: string;
  comparison_run_id: string;
  description?: string;
  passed: boolean;
  baseline_hash: string;
  comparison_hash: string;
  difference_count: number;
  created_at: string;
}

export interface BloatPattern {
  type: string;
  agent_id: string;
  event_type: string;
  count: number;
  excess: number;
  description: string;
}

export interface BloatAnalysis {
  run_id: string;
  bloat_score: number;
  total_events: number;
  repetitive_calls: number;
  redundant_state_changes: number;
  rapid_llm_calls: number;
  condensable_sequences: number;
  patterns: BloatPattern[];
  suggestions: string[];
  component_breakdown: Record<string, number>;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}
