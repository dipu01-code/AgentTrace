import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { RunPicker } from '../components/RunPicker';
import { api, DeterminismResult, RunSummary } from '../services/api';
import { MD3_COLORS, STATUS_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

export function DeterminismScreen({ route }: ScreenProps<'Determinism'>) {
  useAppScheme();
  const { runIdA } = route.params;
  const [runIdB, setRunIdB] = useState(route.params.runIdB ?? '');
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [result, setResult] = useState<DeterminismResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRuns().then(setRuns).catch(() => setRuns([]));
  }, []);

  useEffect(() => {
    if (!runIdB) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .compareRuns(runIdA, runIdB)
      .then((r) => !cancelled && setResult(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [runIdA, runIdB]);

  const nameOf = (id: string) => runs.find((r) => r.id === id)?.name ?? id.slice(0, 8);
  const ok = result?.deterministic;
  const color = ok ? STATUS_COLORS.completed : STATUS_COLORS.failed;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} testID="determinism">
      <View style={ui.card}>
        <Text style={ui.label}>Run A</Text>
        <Text style={ui.value}>{nameOf(runIdA)}</Text>
        <RunPicker label="Compare with" runs={runs} selectedId={runIdB} onSelect={setRunIdB} excludeId={runIdA} />
      </View>

      {!runIdB && <Text style={ui.muted}>Pick a second run to compare event sequences.</Text>}
      {loading && <ActivityIndicator color={MD3_COLORS.primary} />}
      {error && <View style={ui.errorBanner}><Text style={ui.error}>{error}</Text></View>}

      {result && !loading && (
        <>
          <View style={[ui.card, { borderColor: color }]}>
            <Text style={[ui.title, { color }]}>{ok ? '✓ Deterministic' : '⚠ Runs diverge'}</Text>
            <Text style={ui.muted}>
              {ok
                ? 'Both runs made the same agent calls with the same payloads, in the same order.'
                : `${result.difference_count} difference(s). First divergence at event #${result.first_divergence_index}.`}
            </Text>
            <Text style={ui.muted}>Timestamps are ignored: only order, agent, type and payload count.</Text>
          </View>

          <View style={[ui.card, ui.row]}>
            <View style={ui.stat}><Text style={ui.statValue}>{result.event_count_a}</Text><Text style={ui.label}>Run A events</Text></View>
            <View style={ui.stat}><Text style={ui.statValue}>{result.event_count_b}</Text><Text style={ui.label}>Run B events</Text></View>
            <View style={ui.stat}><Text style={ui.statValue}>{result.difference_count}</Text><Text style={ui.label}>Differences</Text></View>
          </View>

          <Text style={ui.sectionTitle}>Hashes ({ok ? 'match' : 'differ'})</Text>
          <View style={ui.card}>
            <Text style={ui.label}>Run A</Text>
            <Text style={ui.mono} selectable>{result.hash_a}</Text>
            <Text style={ui.label}>Run B</Text>
            <Text style={ui.mono} selectable>{result.hash_b}</Text>
          </View>

          {result.differing_events.length > 0 && <Text style={ui.sectionTitle}>Differing events (first 20)</Text>}
          {result.differing_events.map((d) => (
            <View key={d.index} style={ui.card}>
              <Text style={ui.value}>Event #{d.index}</Text>
              {d.extra_in ? (
                <Text style={ui.body}>
                  Only in {d.extra_in === 'run_a' ? 'Run A' : 'Run B'}: {d.event?.type} · {d.event?.agent_name}
                </Text>
              ) : (
                <>
                  <Text style={ui.body}>A: {d.run_a_event?.type} · {d.run_a_event?.agent_name}</Text>
                  <Text style={ui.body}>B: {d.run_b_event?.type} · {d.run_b_event?.agent_name}</Text>
                </>
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
