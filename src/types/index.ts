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

export type RunStatus = 'running' | 'completed' | 'failed' | 'looping';
