import { Svg, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import SafeAreaView from '../components/SafeAreaView';
import { useEffect, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { api, AgentEvent } from '../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'GraphView'>;
};

type GraphNode = {
  id: string;
  x: number;
  y: number;
  label: string;
  type: string;
  color: string;
  event: AgentEvent;
};

type GraphEdge = {
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const TYPE_COLORS: Record<string, string> = {
  agent_start: '#3b82f6',
  agent_end: '#10b981',
  tool_call: '#8b5cf6',
  tool_result: '#06b6d4',
  llm_call: '#f59e0b',
  llm_result: '#ef4444',
  state_change: '#14b8a6',
  loop_detected: '#dc2626',
  error: '#dc2626',
};

const NODE_RADIUS = 28;
const NODE_GAP = 70;

const TYPE_LABELS: Record<string, string> = {
  agent_start: 'Agent Start',
  agent_end: 'Agent End',
  tool_call: 'Tool Call',
  tool_result: 'Tool Result',
  llm_call: 'LLM Call',
  llm_result: 'LLM Result',
  state_change: 'State Change',
  loop_detected: 'Loop',
  error: 'Error',
};

/**
 * Simple deterministic layout: events are laid out in vertical layers by
 * timestamp order, wrapped into columns for mobile width.
 */
function layoutGraph(events: AgentEvent[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  sorted.forEach((event, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 60 + col * 140;
    const y = 80 + row * NODE_GAP;

    const color = TYPE_COLORS[event.type] || '#6b7280';

    nodeMap.set(event.id, {
      id: event.id,
      x,
      y,
      label: event.agentName,
      type: event.type,
      color,
      event,
    });
  });

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const n1 = nodeMap.get(prev.id)!;
    const n2 = nodeMap.get(curr.id)!;
    edges.push({
      from: prev.id,
      to: curr.id,
      x1: n1.x,
      y1: n1.y + NODE_RADIUS,
      x2: n2.x,
      y2: n2.y - NODE_RADIUS,
    });

    if (curr.parentId && nodeMap.has(curr.parentId)) {
      const parent = nodeMap.get(curr.parentId)!;
      edges.push({
        from: parent.id,
        to: curr.id,
        x1: parent.x,
        y1: parent.y + NODE_RADIUS,
        x2: n2.x,
        y2: n2.y - NODE_RADIUS,
      });
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

export function GraphViewScreen({ route }: Props) {
  const { runId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);

  useEffect(() => {
    api.getEvents(runId)
      .then((data) => {
        setGraph(layoutGraph(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setLoading(false);
      });
  }, [runId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Could not load workflow graph</Text>
        <Text style={styles.errorHint}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyText}>No events in this run</Text>
        <Text style={styles.emptyHint}>Ingest agent events to see the graph</Text>
      </SafeAreaView>
    );
  }

  const svgHeight = Math.max(400, graph.nodes.length * NODE_GAP / 2 + 160);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workflow Graph</Text>
        <Text style={styles.subtitle}>{graph.nodes.length} events</Text>
      </View>
      <View style={styles.graphContainer}>
        <Svg style={styles.svg} width="100%" height={svgHeight}>
          {graph.edges.map((edge, i) => (
            <Line
              key={`edge-${i}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="4,4"
              opacity={0.6}
            />
          ))}
          {graph.nodes.map((node) => (
            <G key={`node-${node.id}`}>
              <TouchableOpacity
                style={[styles.nodeTouch, { backgroundColor: node.color }]}
              >
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  fill={node.color}
                  stroke="#ffffff"
                  strokeWidth={3}
                />
                <SvgText
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={10}
                  fontWeight="700"
                  letterSpacing={0.4}
                >
                  {node.label.length > 8 ? node.label.slice(0, 7) + '…' : node.label}
                </SvgText>
                <SvgText
                  x={node.x}
                  y={node.y + NODE_RADIUS + 14}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize={9}
                >
                  {TYPE_LABELS[node.type] || node.type}
                </SvgText>
              </TouchableOpacity>
            </G>
          ))}
        </Svg>
      </View>
      <View style={styles.legend}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{TYPE_LABELS[type]}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280' },
  graphContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  svg: { backgroundColor: '#ffffff', borderRadius: 12 },
  nodeTouch: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  errorHint: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 13, color: '#9ca3af', marginTop: 6 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 4,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendLabel: { fontSize: 11, color: '#6b7280' },
});
