import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SafeAreaView from '../components/SafeAreaView';
import { AnimatedRunCard } from '../components/AnimatedRunCard';
import { AgentButton, MetricCard, TabBar } from '../components/ui';
import { MD3_COLORS, STATUS_COLORS, themed } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import { api, RunSummary } from '../services/api';
import type { ScreenProps } from '../navigation/types';

type Filter = 'all' | RunSummary['status'];
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'completed', label: 'Done' },
  { id: 'failed', label: 'Failed' },
  { id: 'looping', label: 'Looping' },
];

export function TimelineScreen({ navigation }: ScreenProps<'Timeline'>) {
  useAppScheme();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <HeaderLink label="Tests" testID="nav-regression" onPress={() => navigation.navigate('Regression')} />
          <HeaderLink label="Sync" testID="nav-sync" onPress={() => navigation.navigate('Sync')} />
          <HeaderLink label="⚙︎" testID="nav-settings" onPress={() => navigation.navigate('Settings')} />
        </View>
      ),
    });
  }, [navigation]);

  const loadRuns = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      setRuns(await api.getRuns());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  }, []);

  // Reload whenever we come back to this screen (e.g. after changing a run's status).
  useFocusEffect(useCallback(() => { loadRuns(); }, [loadRuns]));

  const handleCreate = async () => {
    try {
      const run = await api.createRun(`Run ${Date.now().toString().slice(-6)}`);
      setRuns((prev) => [run, ...prev]);
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const openRun = useCallback((runId: string) => navigation.navigate('RunDetail', { runId }), [navigation]);
  const visible = useMemo(() => (filter === 'all' ? runs : runs.filter((r) => r.status === filter)), [runs, filter]);
  const count = (s: RunSummary['status']) => runs.filter((r) => r.status === s).length;

  return (
    <SafeAreaView style={ui.screen} edges={['bottom', 'left', 'right']}>
      <FlatList
        testID="timeline-list"
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <AnimatedRunCard run={item} index={index} onPress={openRun} />}
        refreshing={refreshing}
        onRefresh={loadRuns}
        initialNumToRender={10}
        windowSize={7}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {error && (
              <View style={ui.errorBanner}>
                <Text style={ui.error}>{error}</Text>
              </View>
            )}
            <View style={styles.stats}>
              <MetricCard title="Runs" value={runs.length} accentColor={MD3_COLORS.primary} />
              <MetricCard title="Running" value={count('running')} accentColor={STATUS_COLORS.running} />
              <MetricCard title="Looping" value={count('looping')} accentColor={STATUS_COLORS.looping} />
              <MetricCard title="Failed" value={count('failed')} accentColor={STATUS_COLORS.failed} />
            </View>
            <TabBar
              activeTab={filter}
              onTabPress={(tab) => setFilter(tab as Filter)}
              tabs={FILTERS.map((f) => ({ ...f, icon: null }))}
            />
          </View>
        }
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Text style={ui.value}>{filter === 'all' ? 'No workflow runs yet' : `No ${filter} runs`}</Text>
              <Text style={ui.muted}>Create a run, or post one from your agent to /api/v1/runs/</Text>
              {filter === 'all' && <AgentButton onPress={handleCreate} title="Create run" />}
            </View>
          ) : undefined
        }
      />
      <Pressable testID="create-run" accessibilityLabel="Create run" style={styles.fab} onPress={handleCreate}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function HeaderLink({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} testID={testID} accessibilityRole="button">
      <Text style={styles.headerLink}>{label}</Text>
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    list: { paddingBottom: 100 },
    header: { padding: 16, gap: 12 },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    empty: { alignItems: 'center', padding: 32, gap: 10 },
    headerActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    headerLink: { color: MD3_COLORS.primary, fontSize: 15, fontWeight: '600' },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 32,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: MD3_COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    fabText: { fontSize: 28, lineHeight: 30, color: MD3_COLORS.onPrimary, fontWeight: '600' },
  })
);
