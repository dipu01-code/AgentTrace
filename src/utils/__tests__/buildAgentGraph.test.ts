import { expect, test } from '@jest/globals';
import { buildAgentGraph } from '../agentGraph';
import type { AgentEvent } from '../../services/api';

const ev = (id: string, agentId: string, timestamp: number, parentId?: string): AgentEvent => ({
  id,
  runId: 'r',
  agentId,
  agentName: agentId,
  type: 'tool_call',
  timestamp,
  payload: {},
  parentId,
});

test('agents become nodes and hand-offs become counted edges', () => {
  const graph = buildAgentGraph([ev('1', 'a', 1), ev('2', 'b', 2), ev('3', 'a', 3), ev('4', 'b', 4), ev('5', 'b', 5)], 300);
  expect(graph.nodes.map((n) => [n.id, n.count])).toEqual([['a', 2], ['b', 3]]);
  expect(graph.edges).toEqual([
    { from: 'a', to: 'b', count: 2 },
    { from: 'b', to: 'a', count: 1 },
  ]);
});

test('parent_id wins over time order when choosing the source agent', () => {
  const graph = buildAgentGraph([ev('1', 'a', 1), ev('2', 'b', 2), ev('3', 'c', 3, '1')], 300);
  expect(graph.edges).toContainEqual({ from: 'a', to: 'c', count: 1 });
  expect(graph.edges).not.toContainEqual({ from: 'b', to: 'c', count: 1 });
});
