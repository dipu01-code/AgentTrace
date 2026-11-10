import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { RunPicker } from '../components/RunPicker';
import { AgentButton } from '../components/ui';
import { api, RegressionTestResult, RunSummary } from '../services/api';
import { MD3_COLORS, STATUS_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

export function RegressionScreen({ route }: ScreenProps<'Regression'>) {
  useAppScheme();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [tests, setTests] = useState<RegressionTestResult[]>([]);
  const [baselineId, setBaselineId] = useState(route.params?.baselineRunId ?? '');
  const [comparisonId, setComparisonId] = useState('');
  const [name, setName] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTests = useCallback(() => api.listRegressionTests().then(setTests).catch(() => undefined), []);
  useEffect(() => {
    api.getRuns().then(setRuns).catch((e) => setError(e.message));
    loadTests();
  }, [loadTests]);

  const runTest = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await api.runRegressionTest({
        name: name.trim() || `Regression ${new Date().toLocaleTimeString()}`,
        baseline_run_id: baselineId,
        comparison_run_id: comparisonId,
      });
      setTests((prev) => [result, ...prev]);
      setName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regression test failed');
    } finally {
      setRunning(false);
    }
  };

  const nameOf = (id: string) => runs.find((r) => r.id === id)?.name ?? `${id.slice(0, 8)}…`;

  return (
    <FlatList
      testID="regression"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={tests}
      keyExtractor={(t) => t.id}
      onRefresh={loadTests}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={ui.card}>
            <Text style={ui.value}>New test</Text>
            <Text style={ui.muted}>Passes when the comparison run repeats the baseline's agent calls exactly.</Text>
            <RunPicker label="Baseline" runs={runs} selectedId={baselineId} onSelect={setBaselineId} />
            <RunPicker label="Comparison" runs={runs} selectedId={comparisonId} onSelect={setComparisonId} excludeId={baselineId} />
            <TextInput
              style={ui.input}
              placeholder="Test name (optional)"
              placeholderTextColor={MD3_COLORS.textSubtle}
              value={name}
              onChangeText={setName}
              maxLength={60}
            />
            <AgentButton
              title={running ? 'Running…' : 'Run test'}
              onPress={runTest}
              disabled={running || !baselineId || !comparisonId}
            />
            {error && <Text style={ui.error}>{error}</Text>}
          </View>
          <Text style={ui.sectionTitle}>Results ({tests.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={ui.muted}>No regression tests yet.</Text>}
      renderItem={({ item }) => (
        <View style={ui.card}>
          <View style={ui.between}>
            <Text style={ui.value}>{item.name}</Text>
            <Text style={[ui.value, { color: item.passed ? STATUS_COLORS.completed : STATUS_COLORS.failed }]}>
              {item.passed ? 'PASS' : 'FAIL'}
            </Text>
          </View>
          <Text style={ui.muted}>{nameOf(item.baseline_run_id)} → {nameOf(item.comparison_run_id)}</Text>
          <Text style={ui.muted}>
            {item.passed
              ? 'No differences'
              : `${item.difference_count} difference(s), first at event #${item.first_divergence_index ?? '?'}`}
          </Text>
          <Text style={ui.mono}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      )}
    />
  );
}
