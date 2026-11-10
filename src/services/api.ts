import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { AgentEventType, RunStatus } from '../types';

// EXPO_PUBLIC_API_URL wins. Otherwise reuse the dev machine's LAN host that Metro
// is served from, so a physical phone reaches the backend too.
function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:8000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
}

export const API_BASE_URL = resolveBaseUrl();

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const token = useWorkflowStore.getState().authToken;
  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: json === undefined ? rest.body : JSON.stringify(json),
  });
  if (res.status === 401 && token) {
    // Token expired or server secret changed: send the user back to sign-in.
    useWorkflowStore.getState().clearAuth();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === 'string' ? body.detail : body.detail ? JSON.stringify(body.detail) : '';
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export interface RunSummary {
  id: string;
  name: string;
  status: RunStatus;
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
  type: AgentEventType;
  timestamp: number; // ms
  latencyMs?: number;
  payload: Record<string, unknown>;
  parentId?: string;
}

const mapRun = (run: any): RunSummary => ({
  id: run.id,
  name: run.name,
  status: run.status,
  totalEvents: run.total_events ?? 0,
  loopCount: run.loop_count ?? 0,
  deterministic: run.deterministic ?? true,
  createdAt: new Date(run.created_at).getTime(),
  updatedAt: new Date(run.updated_at).getTime(),
});

const mapEvent = (event: any): AgentEvent => ({
  id: event.id,
  runId: event.run_id,
  agentId: event.agent_id,
  agentName: event.agent_name,
  type: event.type,
  timestamp: event.timestamp * 1000,
  latencyMs: event.latency_ms ?? undefined,
  payload: event.payload ?? {},
  parentId: event.parent_id ?? undefined,
});

type AuthResponse = { access_token: string; user_id: string; email: string; name?: string; created_at: string };

export const api = {
  async getRuns(status?: RunStatus): Promise<RunSummary[]> {
    const data = await request<any[]>(`/runs/${status ? `?status=${status}` : ''}`);
    return data.map(mapRun);
  },

  async getRun(runId: string): Promise<RunSummary> {
    return mapRun(await request(`/runs/${runId}`));
  },

  async getStuckRuns(): Promise<RunSummary[]> {
    return (await request<any[]>('/runs/stuck')).map(mapRun);
  },

  async getEvents(runId: string): Promise<AgentEvent[]> {
    return (await request<any[]>(`/runs/${runId}/events`)).map(mapEvent);
  },

  async createRun(name: string): Promise<RunSummary> {
    return mapRun(await request('/runs/', { method: 'POST', json: { name, status: 'running' } }));
  },

  async updateRunStatus(runId: string, status: RunStatus): Promise<RunSummary> {
    return mapRun(await request(`/runs/${runId}`, { method: 'PATCH', json: { status } }));
  },

  async getStateDiffs(runId: string): Promise<StateDiffEntry[]> {
    const data = await request<any[]>(`/runs/${runId}/diffs`);
    return data.map((entry) => ({
      id: entry.id,
      runId: entry.run_id,
      createdAt: new Date(entry.created_at).getTime(),
      diffs: entry.diffs,
    }));
  },

  async getReplayEvents(runId: string): Promise<ReplayEvent[]> {
    const data = await request<any[]>(`/runs/${runId}/replay`);
    return data.map((e) => ({
      ...mapEvent(e),
      timestamp: e.timestamp,
      elapsedMs: e.elapsed_ms,
      createdAt: new Date(e.created_at).getTime(),
    }));
  },

  getLoops: (runId: string) => request<LoopReport>(`/runs/${runId}/loops`),
  compareRuns: (a: string, b: string) => request<DeterminismResult>(`/runs/${a}/compare/${b}`),
  runRegressionTest: (test: RegressionTestInput) =>
    request<RegressionTestResult>('/regression/test', { method: 'POST', json: test }),
  listRegressionTests: () => request<RegressionTestResult[]>('/regression/tests'),
  analyzeBloat: (runId: string) => request<BloatAnalysis>(`/runs/${runId}/bloat`),

  exportSession: (runId: string, includeEvents: boolean, includeDiffs: boolean, description?: string) =>
    request<ExportResult>('/export/session', {
      method: 'POST',
      json: { run_id: runId, include_events: includeEvents, include_diffs: includeDiffs, description },
    }),
  getExportedSession: (shareToken: string) => request<any>(`/export/session/${shareToken}`),
  listExportedSessions: () => request<ExportSummary[]>('/export/sessions'),

  register: (email: string, password: string, name?: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', json: { email, password, name } }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', json: { email, password } }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request<AuthUser>('/auth/me'),

  syncRun: (runId: string, clientChanges: Record<string, unknown>[] = []) =>
    request<SyncResult>('/sync/run', { method: 'POST', json: { run_id: runId, client_changes: clientChanges } }),
  getSyncStatus: () => request<SyncStatus>('/sync/status'),
  listSyncSessions: () => request<SyncSession[]>('/sync/sessions'),

  registerPushToken: (token: string) =>
    request<{ registered: boolean }>('/notifications/register', { method: 'POST', json: { token } }),
};

export const shareUrl = (path: string) => `${API_BASE_URL}${path}`;

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

export interface ReplayEvent extends Omit<AgentEvent, 'timestamp'> {
  timestamp: number; // seconds
  elapsedMs: number;
  createdAt: number;
}

export interface LoopReport {
  run_id: string;
  total_events: number;
  loops: Array<{
    start_index: number;
    period: number;
    repeats: number;
    cycle: Array<{ agent_name: string; type: string }>;
    event_ids: string[];
  }>;
  flagged_event_ids: string[];
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
  first_divergence_index: number | null;
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

export interface ExportResult {
  share_token: string;
  share_url: string;
  run_id: string;
  exported_at: string;
  total_events: number;
  total_diffs: number;
}

export interface ExportSummary {
  share_token: string;
  run_id: string;
  description?: string;
  exported_at: string;
  total_events: number;
  total_diffs: number;
}

export interface SyncResult {
  sync_id: string;
  run_id: string;
  server_timestamp: string;
  server_events_count: number;
  server_diffs_count: number;
  accepted_count: number;
  conflicts: Array<{ index: number; change_id: string; resolution: string }>;
  rejected: Array<{ index: number; change_id: string | null; errors: string[] }>;
  status: 'synced' | 'partial';
}

export type SyncSession = SyncResult & { created_at: string };

export interface SyncStatus {
  last_sync: string | null;
  pending_changes: number;
  total_synced_runs: number;
  status: 'synced' | 'pending';
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}
