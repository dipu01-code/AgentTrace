import type { AgentEvent } from '../services/api';

export const NODE_R = 26;
const PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#14b8a6', '#ec4899'];

type AgentNode = { id: string; name: string; count: number; types: Record<string, number>; x: number; y: number; color: string };
type Edge = { from: string; to: string; count: number };

/** Agents become nodes; a hand-off (reply to another agent's event, or the next event by a different agent) is an edge. */
export function buildAgentGraph(events: AgentEvent[], size: number) {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const byId = new Map(sorted.map((e) => [e.id, e]));
  const agents = new Map<string, Omit<AgentNode, 'x' | 'y' | 'color'>>();
  const edges = new Map<string, Edge>();

  sorted.forEach((e, i) => {
    const agent = agents.get(e.agentId) ?? { id: e.agentId, name: e.agentName, count: 0, types: {} };
    agent.count += 1;
    agent.types[e.type] = (agent.types[e.type] ?? 0) + 1;
    agents.set(e.agentId, agent);

    const source = (e.parentId && byId.get(e.parentId)) || sorted[i - 1];
    if (source && source.agentId !== e.agentId) {
      const key = `${source.agentId}→${e.agentId}`;
      const edge = edges.get(key) ?? { from: source.agentId, to: e.agentId, count: 0 };
      edge.count += 1;
      edges.set(key, edge);
    }
  });

  const list = [...agents.values()];
  const radius = list.length > 1 ? size / 2 - NODE_R - 24 : 0;
  const nodes: AgentNode[] = list.map((a, i) => {
    const angle = (2 * Math.PI * i) / list.length - Math.PI / 2;
    return { ...a, x: size / 2 + radius * Math.cos(angle), y: size / 2 + radius * Math.sin(angle), color: PALETTE[i % PALETTE.length] };
  });
  return { nodes, edges: [...edges.values()] };
}

