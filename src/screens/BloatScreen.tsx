import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import SafeAreaView from '../components/SafeAreaView';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { api, BloatAnalysis } from '../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'Bloat'>;
};

function scoreColor(score: number): string {
  if (score <= 25) return '#10b981';
  if (score <= 50) return '#f59e0b';
  if (score <= 75) return '#ef4444';
  return '#7f1d1d';
}

export function BloatScreen({ route }: Props) {
  const { runId } = route.params;
  const [analysis, setAnalysis] = useState<BloatAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.analyzeBloat(runId)
      .then((data) => {
        setAnalysis(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to analyze bloat');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [runId]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    api.analyzeBloat(runId)
      .then(setAnalysis)
      .catch((err) => setError(err instanceof Error ? err.message : 'Analysis failed'))
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
        <Text style={styles.errorText}>Could not analyze bloat</Text>
        <Text style={styles.errorHint}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Code Bloat Analyzer</Text>
        <Text style={styles.subtitle}>Run: {analysis.run_id}</Text>
      </View>

      {/* Bloat score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Bloat Score</Text>
        <View style={[styles.scoreCircle, { borderColor: scoreColor(analysis.bloat_score) }]}>
          <Text style={[styles.scoreValue, { color: scoreColor(analysis.bloat_score) }]}>
            {analysis.bloat_score}
          </Text>
        </View>
        <Text style={styles.scoreVerdict}>
          {analysis.bloat_score <= 25 ? 'Clean'
            : analysis.bloat_score <= 50 ? 'Minor bloat'
            : analysis.bloat_score <= 75 ? 'Significant bloat' : 'Heavy bloat'}
        </Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.sectionTitle}>Bloat Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{analysis.repetitive_calls}</Text>
            <Text style={styles.breakdownLabel}>Repeated calls</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{analysis.redundant_state_changes}</Text>
            <Text style={styles.breakdownLabel}>Redundant state changes</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{analysis.rapid_llm_calls}</Text>
            <Text style={styles.breakdownLabel}>Rapid LLM calls</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{analysis.condensable_sequences}</Text>
            <Text style={styles.breakdownLabel}>Condensable sequences</Text>
          </View>
        </View>
      </View>

      {/* Total events */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total events</Text>
          <Text style={styles.statValue}>{analysis.total_events}</Text>
        </View>
      </View>

      {/* Patterns */}
      {analysis.patterns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patterns Detected ({analysis.patterns.length})</Text>
          <FlatList
            data={analysis.patterns}
            keyExtractor={(_, index) => String(index)}
            renderItem={({ item }) => (
              <View style={styles.patternCard}>
                <View style={styles.patternHeader}>
                  <Text style={styles.patternType}>{item.type}</Text>
                  <Text style={styles.patternCount}>×{item.count}</Text>
                </View>
                <Text style={styles.patternDescription}>{item.description}</Text>
                <View style={styles.patternMeta}>
                  <Text style={styles.patternMetaText}>Agent: {item.agent_id}</Text>
                  <Text style={styles.patternMetaText}>Event: {item.event_type}</Text>
                  <Text style={styles.patternMetaText}>Excess: {item.excess}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* Suggestions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggestions ({analysis.suggestions.length})</Text>
        <FlatList
          data={analysis.suggestions}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item }) => (
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionText}>{item}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshText}>🔄 Re-analyze</Text>
      </TouchableOpacity>
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
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scoreValue: { fontSize: 32, fontWeight: '900' },
  scoreVerdict: { fontSize: 15, fontWeight: '700', color: '#374151' },
  breakdownSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  breakdownItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: 85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  breakdownValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  breakdownLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  statsRow: { marginHorizontal: 16, marginBottom: 16 },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 6 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  listContent: { paddingBottom: 16 },
  patternCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patternType: { fontSize: 13, fontWeight: '700', color: '#374151' },
  patternCount: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  patternDescription: { fontSize: 13, color: '#111827', marginBottom: 6 },
  patternMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  patternMetaText: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  suggestionText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  refreshButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  refreshText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  retryText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  errorHint: { fontSize: 13, color: '#6b7280', marginTop: 6 },
});
