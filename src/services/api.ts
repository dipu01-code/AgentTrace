import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';

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
  timestamp: event.timestamp * 1000, // convert seconds to ms
  latencyMs: event.latency_ms,
  payload: event.payload ?? {},
  parentId: event.parent_id,
});

export const api = {
  async getRuns(): Promise<RunSummary[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/`);
    if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
    const data = await res.json();
    return data.map(mapRunFromApi);
  },

  async getRun(runId: string): Promise<RunSummary> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}`);
    if (!res.ok) throw new Error(`Failed to fetch run: ${res.status}`);
    const data = await res.json();
    return mapRunFromApi(data);
  },

  async getEvents(runId: string): Promise<AgentEvent[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/events`);
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
    const data = await res.json();
    return data.map(mapEventFromApi);
  },

  async createRun(name: string): Promise<RunSummary> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status: 'running' }),
    });
    if (!res.ok) throw new Error(`Failed to create run: ${res.status}`);
    const data = await res.json();
    return mapRunFromApi(data);
  },

  async createEvent(runId: string, event: Omit<AgentEvent, 'id'>): Promise<AgentEvent> {
    const res = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
};
