import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { api, StateDiffEntry } from '../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'StateDiff'>;
};

function formatValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return '[object]';
    }
  }
  return String(val);
}

function diffItemStyle(added: boolean, removed: boolean) {
  return {
    color: added ? '#10b981' : removed ? '#dc2626' : '#374151',
  } as any;
}

export function StateDiffScreen({ route }: Props) {
  const { runId } = route.params;
  const [entries, setEntries] = useState<StateDiffEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getStateDiffs(runId)
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load state diffs');
        setLoading(false);
      });
  }, [runId]);

  const allDiffs = entries.flatMap((e) => e.diffs);

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
        <Text style={styles.errorText}>Could not load state diffs</Text>
        <Text style={styles.errorHint}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (allDiffs.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No state changes</Text>
        <Text style={styles.emptyHint}>No diffs recorded for this run yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>State Diff Viewer</Text>
          <Text style={styles.subtitle}>Run: {runId}</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Changed Fields</Text>
        <Text style={styles.statValue}>{allDiffs.length}</Text>
        <Text style={styles.statHint}>
          {entries.length} diff snapshot(s) recorded
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Field Changes</Text>
        <FlatList
          data={allDiffs}
          keyExtractor={(item, index) => `${index}-${item.path}`}
          renderItem={({ item }) => (
            <View style={styles.diffCard}>
              <View style={styles.diffRow}>
                <Text style={styles.diffPath}>{item.path}</Text>
              </View>
              <View style={styles.diffValues}>
                <View style={styles.diffSide}>
                  <Text style={styles.sideLabel}>Before</Text>
                  <Text style={[styles.sideValue, diffItemStyle(false, true)]}>
                    {formatValue(item.before)}
                  </Text>
                </View>
                <View style={styles.arrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.diffSide}>
                  <Text style={styles.sideLabel}>After</Text>
                  <Text style={[styles.sideValue, diffItemStyle(true, false)]}>
                    {formatValue(item.after)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { padding: 8 },
  backText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  headerContent: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280' },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  statValue: { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 6 },
  statHint: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  listContent: { paddingBottom: 16 },
  diffCard: {
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
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diffPath: { fontSize: 13, fontWeight: '700', color: '#111827' },
  diffValues: {
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
  arrow: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  arrowText: { fontSize: 18, color: '#9ca3af', fontWeight: '700' },
  sideLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sideValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  errorText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  errorHint: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#6b7280', marginTop: 8 },
});
