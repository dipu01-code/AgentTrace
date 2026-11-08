import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import SafeAreaView from '../components/SafeAreaView';
import { AgentButton, MetricCard, StateChip, TabBar } from '../components/ui';
import { MD3_COLORS, MD3_TYPOGRAPHY, MD3_RADIUS } from '../theme/colors';
import { api, RunSummary } from '../services/api';

export function TimelineScreen() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed' | 'looping'>('all');

  const loadRuns = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await api.getRuns();
      const filtered = filter === 'all' ? data : data.filter((r) => r.status === filter);
      setRuns(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
      setRuns([]);
    } finally {
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleRefresh = useCallback(() => {
    loadRuns();
  }, [loadRuns]);

  const handleCreatePress = async () => {
    try {
      const run = await api.createRun(`Run ${Date.now().toString().slice(-6)}`);
      setRuns((prev) => [run, ...prev]);
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleFilterPress = (f: typeof filter) => {
    setFilter(f);
    loadRuns();
  };

  const stats = {
    total: runs.length,
    running: runs.filter((r) => r.status === 'running').length,
    completed: runs.filter((r) => r.status === 'completed').length,
    failed: runs.filter((r) => r.status === 'failed').length,
    looping: runs.filter((r) => r.status === 'looping').length,
  };

  if (refreshing && runs.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={MD3_COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Timeline</Text>
          <Text style={styles.subtitle}>{stats.total} workflow runs</Text>
        </View>
        <AgentButton
          onPress={handleCreatePress}
          title="+ Run"
          variant="filled"
        />
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: MD3_COLORS.errorContainer }]}>
          <Text style={[styles.errorText, { color: MD3_COLORS.error }]}>{error}</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <MetricCard
          title="Total Runs"
          value={stats.total}
          accentColor={MD3_COLORS.primary}
        />
        <MetricCard
          title="Running"
          value={stats.running}
          accentColor={MD3_COLORS.tertiary}
        />
        <MetricCard
          title="Completed"
          value={stats.completed}
          accentColor={MD3_COLORS.secondary}
        />
        <MetricCard
          title="Failed"
          value={stats.failed}
          accentColor={MD3_COLORS.error}
        />
        <MetricCard
          title="Looping"
          value={stats.looping}
          accentColor={MD3_COLORS.error}
        />
      </View>

      <View style={styles.filterSection}>
        <TabBar
          activeTab={filter}
          onTabPress={(tab: string) => handleFilterPress(tab as typeof filter)}
          tabs={[
            { id: 'all', label: 'All', icon: <Text style={styles.tabIcon}>📋</Text> },
            { id: 'running', label: 'Running', icon: <Text style={styles.tabIcon}>🔄</Text> },
            { id: 'completed', label: 'Completed', icon: <Text style={styles.tabIcon}>✓</Text> },
            { id: 'failed', label: 'Failed', icon: <Text style={styles.tabIcon}>✕</Text> },
            { id: 'looping', label: 'Looping', icon: <Text style={styles.tabIcon}>🔁</Text> },
          ]}
        />
      </View>

      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        refreshing={refreshing ?? false}
        refreshControl={
          refreshing ? <ActivityIndicator size="small" color={MD3_COLORS.primary} /> : undefined
        }
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.runCard}
            onPress={() => {}}
            activeOpacity={0.95}
          >
            <View style={styles.runCardHeader}>
              <View style={styles.runCardInfo}>
                <Text style={styles.runCardName}>{item.name}</Text>
                <View style={styles.runCardMeta}>
                  <StateChip label={item.status} status={item.status as any} />
                  <Text style={styles.runCardEvents}>{item.totalEvents} events</Text>
                </View>
              </View>
              <View style={styles.runCardTime}>
                <Text style={styles.runCardTimeText}>
                  {new Date(item.updatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.runCardDivider} />
            <View style={styles.runCardFooter}>
              <Text style={styles.runCardFooterText}>
                {new Date(item.updatedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workflow runs yet</Text>
            <Text style={styles.emptyHint}>Create a run to start tracing agent events</Text>
            <AgentButton
              onPress={handleCreatePress}
              title="Create Run"
              variant="filled"
              style={styles.emptyFab}
            />
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePress}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3_COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: MD3_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: MD3_COLORS.surface,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: MD3_TYPOGRAPHY.headlineMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.headlineMd.fontWeight,
    color: MD3_COLORS.onSurface,
  },
  subtitle: {
    fontSize: MD3_TYPOGRAPHY.bodyMd.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: MD3_COLORS.errorContainer,
    borderLeftWidth: 4,
    borderLeftColor: MD3_COLORS.error,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: MD3_RADIUS.lg,
  },
  errorText: {
    fontSize: MD3_TYPOGRAPHY.bodySm.fontSize,
    color: MD3_COLORS.onError,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabIcon: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 100,
  },
  runCard: {
    backgroundColor: MD3_COLORS.surfaceContainer,
    borderRadius: MD3_RADIUS.xl,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
  },
  runCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  runCardInfo: {
    flex: 1,
  },
  runCardName: {
    fontSize: MD3_TYPOGRAPHY.bodyLg.fontSize,
    fontWeight: MD3_TYPOGRAPHY.bodyLg.fontWeight,
    color: MD3_COLORS.onSurface,
  },
  runCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  runCardEvents: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
  },
  runCardTime: {
    alignSelf: 'flex-end',
  },
  runCardTimeText: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
    fontFamily: 'monospace',
  },
  runCardDivider: {
    height: 1,
    backgroundColor: MD3_COLORS.outlineVariant,
    marginVertical: 8,
  },
  runCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runCardFooterText: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: MD3_TYPOGRAPHY.bodyLg.fontSize,
    fontWeight: MD3_TYPOGRAPHY.bodyLg.fontWeight,
    color: MD3_COLORS.onSurface,
  },
  emptyHint: {
    fontSize: MD3_TYPOGRAPHY.bodySm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
    marginTop: 8,
  },
  emptyFab: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: MD3_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    fontSize: 24,
    color: MD3_COLORS.onPrimary,
    fontWeight: '700',
  },
});
