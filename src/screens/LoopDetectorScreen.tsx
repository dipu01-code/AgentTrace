import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { api, LoopReport } from '../services/api';
import { EVENT_TYPE_COLORS, MD3_COLORS, STATUS_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

export function LoopDetectorScreen({ route }: ScreenProps<'LoopDetector'>) {
  useAppScheme();
  const { runId } = route.params;
  const [report, setReport] = useState<LoopReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLoops(runId).then(setReport).catch((e) => setError(e.message));
  }, [runId]);

  if (error) return <View style={ui.center}><Text style={ui.error}>{error}</Text></View>;
  if (!report) return <View style={ui.center}><ActivityIndicator color={MD3_COLORS.primary} /></View>;

  const clean = report.loops.length === 0 && report.flagged_event_ids.length === 0;
  return (
    <FlatList
      testID="loop-detector"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={report.loops}
      keyExtractor={(l) => String(l.start_index)}
      ListHeaderComponent={
        <View style={[ui.card, { borderColor: clean ? STATUS_COLORS.completed : STATUS_COLORS.looping }]}>
          <Text style={ui.title}>{clean ? 'No loops found' : `${report.loops.length} repeating cycle(s)`}</Text>
          <Text style={ui.muted}>
            Scanned {report.total_events} events for back-to-back repeats of the same agent call (same agent, type and
            payload, 3+ times).
          </Text>
          {report.flagged_event_ids.length > 0 && (
            <Text style={[ui.body, { color: STATUS_COLORS.looping }]}>
              {report.flagged_event_ids.length} event(s) were flagged as loop_detected by the agent.
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={ui.card}>
          <View style={ui.between}>
            <Text style={ui.value}>Cycle at event #{item.start_index}</Text>
            <Text style={[ui.value, { color: STATUS_COLORS.looping }]}>×{item.repeats}</Text>
          </View>
          {item.cycle.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.dot, { backgroundColor: EVENT_TYPE_COLORS[step.type] ?? MD3_COLORS.outline }]} />
              <Text style={ui.body}>{step.agent_name}</Text>
              <Text style={ui.mono}>{step.type}</Text>
            </View>
          ))}
          <Text style={ui.muted}>
            {item.period}-step cycle repeated {item.repeats} times ({item.event_ids.length} events)
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
