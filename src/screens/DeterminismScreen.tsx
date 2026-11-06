import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { api, RunSummary, DeterminismResult } from '../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'Determinism'>;
};

const DETERMINISTIC_COLOR = '#10b981';
const NON_DETERMINISTIC_COLOR = '#dc2626';

export function DeterminismScreen({ route }: Props) {
  const { runIdA, runIdB } = route.params;
  const [result, setResult] = useState<DeterminismResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.compareRuns(runIdA, runIdB)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Comparison failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [runIdA, runIdB]);

  useEffect(() => {
    api.getRuns()
      .then((data) => setRuns(data))
      .catch(() => setRuns([]));
  }, []);

  const handleCompareAgain = () => {
    setLoading(true);
    setError(null);
    api.compareRuns(runIdA, runIdB)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Comparison failed'))
      .finally(() => setLoading(false));
  };

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
        <Text style={styles.errorText}>Could not compare runs</Text>
        <Text style={styles.errorHint}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleCompareAgain}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!result) {
    return null;
  }

  const isDeterministic = result.deterministic;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Determinism Check</Text>
          <Text style={[styles.subtitle, { color: isDeterministic ? DETERMINISTIC_COLOR : NON_DETERMINISTIC_COLOR }]}>
            {isDeterministic ? 'Deterministic' : 'Non-deterministic'}
          </Text>
        </View>
      </View>

      {/* Result banner */}
      <View style={[styles.resultBanner, isDeterministic ? styles.bannerDeterministic : styles.bannerNonDeterministic]}>
        <Text style={styles.bannerIcon}>{isDeterministic ? '✓' : '⚠'}</Text>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>
            {isDeterministic ? 'Runs are deterministic' : 'Runs diverge'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {isDeterministic
              ? 'Both runs produced identical event sequences.'
              : `Found ${result.difference_count} difference(s). First divergence at event #${result.first_divergence_index ?? '?'}.`}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Run A events</Text>
          <Text style={styles.statValue}>{result.event_count_a}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Run B events</Text>
          <Text style={styles.statValue}>{result.event_count_b}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Differences</Text>
          <Text style={styles.statValue}>{result.difference_count}</Text>
        </View>
      </View>

      {/* Hashes */}
      <View style={styles.hashSection}>
        <Text style={styles.sectionTitle}>Run Hashes</Text>
        <View style={styles.hashCard}>
          <Text style={styles.hashLabel}>Run A</Text>
          <Text style={styles.hashValue}>{result.hash_a}</Text>
        </View>
        <View style={styles.hashCard}>
          <Text style={styles.hashLabel}>Run B</Text>
          <Text style={styles.hashValue}>{result.hash_b}</Text>
        </View>
        <View style={styles.hashMatch}>
          {isDeterministic ? 'Hashes match' : 'Hashes differ'}
        </View>
      </View>

      {/* Differences */}
      {result.difference_count > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Differing Events (first 20)</Text>
          <FlatList
            data={result.differing_events}
            keyExtractor={(item) => String(item.index)}
            renderItem={({ item }) => (
              <View style={styles.diffCard}>
                <Text style={styles.diffIndex}>Event #{item.index}</Text>
                <View style={styles.diffRow}>
                  <View style={styles.diffSide}>
                    <Text style={styles.sideLabel}>Run A</Text>
                    {item.run_a_event ? (
                      <>
                        <Text style={styles.sideValue}>{item.run_a_event.type}</Text>
                        <Text style={styles.sideMeta}>{item.run_a_event.agent_name}</Text>
                      </>
                    ) : (
                      <Text style={styles.sideValueEmpty}>—</Text>
                    )}
                  </View>
                  <View style={styles.arrow}>
                    <Text style={styles.arrowText}>↔</Text>
                  </View>
                  <View style={styles.diffSide}>
                    <Text style={styles.sideLabel}>Run B</Text>
                    {item.run_b_event ? (
                      <>
                        <Text style={styles.sideValue}>{item.run_b_event.type}</Text>
                        <Text style={styles.sideMeta}>{item.run_b_event.agent_name}</Text>
                      </>
                    ) : (
                      <Text style={styles.sideValueEmpty}>—</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* Run selector (for comparing different runs) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compare Different Runs</Text>
        <View style={styles.runSelector}>
          <TouchableOpacity style={styles.selectButton} onPress={() => {}}>
            <Text style={styles.selectText}>Run A: {runs.find((r) => r.id === runIdA)?.name ?? runIdA}</Text>
          </TouchableOpacity>
          <Text style={styles.vsText}>vs</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => {}}>
            <Text style={styles.selectText}>Run B: {runs.find((r) => r.id === runIdB)?.name ?? runIdB}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleCompareAgain}>
          <Text style={styles.refreshText}>🔄 Re-run comparison</Text>
        </TouchableOpacity>
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
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  bannerDeterministic: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  bannerNonDeterministic: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  bannerIcon: { fontSize: 24, marginRight: 12 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  bannerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 6 },
  hashSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  hashCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
    marginHorizontal: 4,
  },
  hashLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  hashValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    marginTop: 6,
    lineHeight: 18,
  },
  hashMatch: {
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  section: { marginHorizontal: 16, marginBottom: 16 },
  listContent: { paddingBottom: 16 },
  diffCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  diffIndex: { fontSize: 12, fontWeight: '800', color: '#dc2626', marginBottom: 8 },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diffSide: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sideLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sideValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  sideMeta: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  sideValueEmpty: { fontSize: 13, color: '#9ca3af' },
  arrow: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  arrowText: { fontSize: 18, color: '#9ca3af' },
  runSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 110,
  },
  selectText: { fontSize: 13, color: '#374151', textAlign: 'center' },
  vsText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  refreshButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  retryText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  errorHint: { fontSize: 13, color: '#6b7280', marginTop: 6 },
});
