import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedEventCard } from '../components/AnimatedEventCard';
import { AgentButton, Chip } from '../components/ui';
import { AgentEvent, api, RunSummary } from '../services/api';
import { MD3_COLORS, STATUS_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { RootStackParamList, ScreenProps } from '../navigation/types';

type Tool = { label: string; screen: 'GraphView' | 'ReplayView' | 'LoopDetector' | 'StateDiff' | 'Bloat' | 'Export' };
const TOOLS: Tool[] = [
  { label: 'Graph', screen: 'GraphView' },
  { label: 'Replay', screen: 'ReplayView' },
  { label: 'Loops', screen: 'LoopDetector' },
  { label: 'State diffs', screen: 'StateDiff' },
  { label: 'Bloat', screen: 'Bloat' },
  { label: 'Export', screen: 'Export' },
];

export function RunDetailScreen({ navigation, route }: ScreenProps<'RunDetail'>) {
  useAppScheme();
  const { runId } = route.params;
  const [run, setRun] = useState<RunSummary | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, e] = await Promise.all([api.getRun(runId), api.getEvents(runId)]);
      setRun(r);
      setEvents(e);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    }
  }, [runId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useLayoutEffect(() => {
    if (run) navigation.setOptions({ title: run.name });
  }, [navigation, run]);

  const toggle = useCallback((id: string) => setExpanded((cur) => (cur === id ? null : id)), []);
  const openEvent = useCallback(
    (eventId: string) => navigation.navigate('EventDetail', { runId, eventId }),
    [navigation, runId]
  );

  const setStatus = async (status: RunSummary['status']) => {
    try {
      setRun(await api.updateRunStatus(runId, status));
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (error && !run) {
    return (
      <View style={ui.center}>
        <Text style={ui.error}>{error}</Text>
        <AgentButton title="Retry" onPress={load} />
      </View>
    );
  }
  if (!run) {
    return (
      <View style={ui.center}>
        <ActivityIndicator color={MD3_COLORS.primary} />
      </View>
    );
  }

  const go = (screen: Tool['screen']) => navigation.navigate(screen, { runId } as RootStackParamList[typeof screen]);

  return (
    <FlatList
      testID="run-detail"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={events}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => (
        <AnimatedEventCard event={item} isExpanded={expanded === item.id} onToggle={toggle} onOpen={openEvent} />
      )}
      initialNumToRender={15}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={[ui.card, ui.row]}>
            <View style={ui.stat}>
              <Text style={[ui.statValue, { color: STATUS_COLORS[run.status] }]} testID="run-status">{run.status}</Text>
              <Text style={ui.label}>Status</Text>
            </View>
            <View style={ui.stat}>
              <Text style={ui.statValue}>{run.totalEvents}</Text>
              <Text style={ui.label}>Events</Text>
            </View>
            <View style={ui.stat}>
              <Text style={ui.statValue}>{run.loopCount}</Text>
              <Text style={ui.label}>Loops flagged</Text>
            </View>
          </View>

          <Text style={ui.sectionTitle}>Debug tools</Text>
          <View style={styles.tools}>
            {TOOLS.map((t) => (
              <Chip key={t.screen} testID={`tool-${t.screen}`} label={t.label} onPress={() => go(t.screen)} />
            ))}
            <Chip label="Compare…" onPress={() => navigation.navigate('Determinism', { runIdA: runId })} />
            <Chip label="Regression…" onPress={() => navigation.navigate('Regression', { baselineRunId: runId })} />
          </View>

          <Text style={ui.sectionTitle}>Mark run as</Text>
          <View style={styles.tools}>
            {(['running', 'completed', 'failed'] as const).map((s) => (
              <Chip key={s} label={s} selected={run.status === s} onPress={() => setStatus(s)} />
            ))}
          </View>

          <Text style={ui.sectionTitle}>Events ({events.length})</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={ui.muted}>No events yet. POST them to /api/v1/runs/{runId}/events.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, marginBottom: 4 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
