import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { api, RunSummary, RegressionTestInput, RegressionTestResult } from '../services/api';

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function RegressionScreen() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [tests, setTests] = useState<RegressionTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baselineRunId, _setBaselineRunId] = useState<string>('');
  const [comparisonRunId, _setComparisonRunId] = useState<string>('');
  const [testName, setTestName] = useState<string>('');

  useEffect(() => {
    api.getRuns()
      .then((data) => setRuns(data))
      .catch(() => setRuns([]));

    api.listRegressionTests()
      .then((data) => setTests(data))
      .catch(() => setTests([]));
  }, []);

  const handleRunTest = () => {
    if (!baselineRunId || !comparisonRunId) {
      Alert.alert('Missing runs', 'Please select both baseline and comparison runs.');
      return;
    }
    if (baselineRunId === comparisonRunId) {
      Alert.alert('Same run', 'Baseline and comparison runs must be different.');
      return;
    }

    setLoading(true);
    setError(null);

    const testInput: RegressionTestInput = {
      name: testName || `Regression ${new Date().toLocaleTimeString()}`,
      baseline_run_id: baselineRunId,
      comparison_run_id: comparisonRunId,
    };

    api.runRegressionTest(testInput)
      .then((result) => {
        setTests([result, ...tests]);
        setTestName('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Regression test failed'))
      .finally(() => setLoading(false));
  };

  const handleRefresh = () => {
    api.listRegressionTests()
      .then(setTests)
      .catch(() => setTests([]));
  };

  const baselineRun = runs.find((r) => r.id === baselineRunId);
  const comparisonRun = runs.find((r) => r.id === comparisonRunId);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Regression Tests</Text>
        <Text style={styles.subtitle}>Compare runs for regressions</Text>
      </View>

      {/* Test configuration */}
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>Run Regression Test</Text>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.selectButton} onPress={() => {}}>
            <Text style={styles.selectText}>
              Baseline: {baselineRun?.name ?? 'Select run'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.vsText}>vs</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => {}}>
            <Text style={styles.selectText}>
              Comparison: {comparisonRun?.name ?? 'Select run'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.nameInput}
          placeholder="Test name (optional)"
          value={testName}
          onChangeText={setTestName}
          maxLength={60}
        />
        <TouchableOpacity style={styles.runButton} onPress={handleRunTest}>
          <Text style={styles.runButtonText}>{loading ? 'Running…' : 'Run Test'}</Text>
        </TouchableOpacity>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Test results */}
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Test Results ({tests.length})</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        </View>
        {tests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No regression tests yet</Text>
            <Text style={styles.emptyHint}>Run a test to compare two workflow runs</Text>
          </View>
        ) : (
          <FlatList
            data={tests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.testCard}>
                <View style={styles.testHeader}>
                  <Text style={styles.testName}>{item.name}</Text>
                  <View style={[styles.statusBadge, item.passed ? styles.statusPassed : styles.statusFailed]}>
                    <Text style={styles.statusText}>{item.passed ? 'PASS' : 'FAIL'}</Text>
                  </View>
                </View>
                <View style={styles.testMeta}>
                  <Text style={styles.metaLine}>
                    Baseline: {item.baseline_run_id.slice(0, 8)}…
                  </Text>
                  <Text style={styles.metaLine}>
                    Comparison: {item.comparison_run_id.slice(0, 8)}…
                  </Text>
                  <Text style={styles.metaLine}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
                <View style={styles.testHashes}>
                  <View style={styles.hashPair}>
                    <Text style={styles.hashLabel}>Baseline</Text>
                    <Text style={styles.hashValue}>{item.baseline_hash.slice(0, 12)}…</Text>
                  </View>
                  <View style={styles.hashPair}>
                    <Text style={styles.hashLabel}>Comparison</Text>
                    <Text style={styles.hashValue}>{item.comparison_hash.slice(0, 12)}…</Text>
                  </View>
                </View>
                <Text style={styles.diffCount}>
                  {item.passed ? 'No differences' : `${item.difference_count} difference(s)`}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
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
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  configCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  configTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectText: { fontSize: 13, color: '#374151' },
  vsText: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginHorizontal: 8 },
  nameInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  runButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  runButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 10,
    marginTop: 10,
    borderRadius: 0,
  },
  errorText: { fontSize: 13, color: '#dc2626' },
  resultsSection: { marginHorizontal: 16, marginBottom: 16 },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  refreshButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 8,
  },
  refreshText: { fontSize: 16 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  listContent: { paddingBottom: 16 },
  testCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  testName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPassed: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  statusFailed: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  testMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  metaLine: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  testHashes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hashPair: {
    flex: 1,
    alignItems: 'center',
  },
  hashLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  hashValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#374151',
    marginTop: 2,
  },
  diffCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
});
