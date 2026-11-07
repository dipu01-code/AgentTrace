import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import SafeAreaView from '../components/SafeAreaView';
import { api, RunSummary } from '../services/api';
import { TimelineList } from '../screens/TimelineList';

export function TimelineScreen() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await api.getRuns();
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
      // Fallback to empty state so the screen still works offline
      setRuns([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleRefresh = useCallback(() => {
    loadRuns();
  }, [loadRuns]);

  const handleCreatePress = async () => {
    const name = `Run ${Date.now().toString().slice(-6)}`;
    try {
      const run = await api.createRun(name);
      setRuns([run, ...runs]);
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleRunPress = (_runId: string) => {
    // Navigation to run detail handled by parent navigator
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.subtitle}>{runs.length} workflow runs</Text>
      </View>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Could not connect to backend</Text>
        </View>
      )}
      <TimelineList
        runs={runs}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onRunPress={handleRunPress}
        onCreatePress={handleCreatePress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  errorText: { fontSize: 13, color: '#dc2626' },
});
