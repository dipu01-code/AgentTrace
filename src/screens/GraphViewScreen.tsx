import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { AgentEvent, api } from '../services/api';
import { buildAgentGraph, NODE_R } from '../utils/agentGraph';
import { EVENT_TYPE_COLORS, MD3_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

export function GraphViewScreen({ route }: ScreenProps<'GraphView'>) {
  useAppScheme();
  const { runId } = route.params;
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 480);
  const [events, setEvents] = useState<AgentEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api.getEvents(runId).then(setEvents).catch((e) => setError(e.message));
  }, [runId]);

  const graph = useMemo(() => (events ? buildAgentGraph(events, size) : null), [events, size]);

  if (error) return <View style={ui.center}><Text style={ui.error}>{error}</Text></View>;
  if (!graph) return <View style={ui.center}><ActivityIndicator color={MD3_COLORS.primary} /></View>;
  if (graph.nodes.length === 0) {
    return <View style={ui.center}><Text style={ui.muted}>No events in this run yet.</Text></View>;
  }

  const node = (id: string) => graph.nodes.find((n) => n.id === id)!;
  const maxCount = Math.max(...graph.edges.map((e) => e.count), 1);
  const picked = selected ? node(selected) : null;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} testID="graph">
      <Text style={ui.muted}>
        {graph.nodes.length} agents · {graph.edges.length} hand-off paths · {events!.length} events. Tap an agent.
      </Text>
      <View style={[ui.card, { alignItems: 'center', padding: 0 }]}>
        <Svg width={size} height={size}>
          {graph.edges.map((e) => {
            const a = node(e.from);
            const b = node(e.to);
            // Offset each direction slightly so A→B and B→A don't overlap.
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ox = (-dy / len) * 4;
            const oy = (dx / len) * 4;
            const dim = selected && e.from !== selected && e.to !== selected;
            return (
              <G key={`${e.from}-${e.to}`} opacity={dim ? 0.15 : 0.9}>
                <Line
                  x1={a.x + ox}
                  y1={a.y + oy}
                  x2={b.x + ox}
                  y2={b.y + oy}
                  stroke={a.color}
                  strokeWidth={1.5 + (4 * e.count) / maxCount}
                />
                <Circle cx={b.x + ox - (dx / len) * (NODE_R + 4)} cy={b.y + oy - (dy / len) * (NODE_R + 4)} r={4} fill={a.color} />
                <SvgText x={(a.x + b.x) / 2 + ox * 3} y={(a.y + b.y) / 2 + oy * 3} fill={MD3_COLORS.onSurfaceVariant} fontSize={11} textAnchor="middle">
                  {e.count}
                </SvgText>
              </G>
            );
          })}
          {graph.nodes.map((n) => (
            <G key={n.id} onPress={() => setSelected(selected === n.id ? null : n.id)}>
              <Circle cx={n.x} cy={n.y} r={NODE_R} fill={n.color} stroke={selected === n.id ? MD3_COLORS.onSurface : MD3_COLORS.surface} strokeWidth={3} />
              <SvgText x={n.x} y={n.y + 5} fill="#ffffff" fontSize={14} fontWeight="700" textAnchor="middle">
                {n.count}
              </SvgText>
              <SvgText x={n.x} y={n.y + NODE_R + 14} fill={MD3_COLORS.onSurface} fontSize={12} textAnchor="middle">
                {n.name.length > 14 ? `${n.name.slice(0, 13)}…` : n.name}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>

      {picked && (
        <View style={[ui.card, { borderColor: picked.color }]}>
          <Text style={ui.value}>{picked.name}</Text>
          <Text style={ui.muted}>{picked.count} events</Text>
          {Object.entries(picked.types).map(([type, count]) => (
            <View key={type} style={ui.between}>
              <Text style={[ui.body, { color: EVENT_TYPE_COLORS[type] ?? MD3_COLORS.onSurface }]}>{type}</Text>
              <Text style={ui.mono}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={ui.sectionTitle}>Hand-offs</Text>
      {graph.edges.length === 0 && <Text style={ui.muted}>Only one agent took part.</Text>}
      {[...graph.edges].sort((x, y) => y.count - x.count).map((e) => (
        <View key={`${e.from}-${e.to}`} style={[ui.card, ui.between]}>
          <Text style={ui.body}>{node(e.from).name} → {node(e.to).name}</Text>
          <Text style={ui.mono}>×{e.count}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
