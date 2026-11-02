export type AgentEventType =
  | 'agent_start'
  | 'agent_end'
  | 'tool_call'
  | 'tool_result'
  | 'llm_call'
  | 'llm_result'
  | 'state_change'
  | 'loop_detected'
  | 'error';

export interface AgentEvent {
  id: string;
  runId: string;
  agentId: string;
  agentName: string;
  type: AgentEventType;
  timestamp: number;
  latencyMs?: number;
  payload: Record<string, unknown>;
  parentId?: string;
}

export interface WorkflowRun {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'looping';
  createdAt: number;
  updatedAt: number;
  totalEvents: number;
  loopCount: number;
  deterministic: boolean;
}

export interface StateDiff {
  path: string;
  before: unknown;
  after: unknown;
}
