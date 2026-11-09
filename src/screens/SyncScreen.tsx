import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
  Switch,
} from 'react-native';
import { api } from '../services/api';
import { MD3_COLORS, MD3_TYPOGRAPHY, MD3_RADIUS } from '../theme/colors';

export function SyncScreen() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    loadStatus();
    loadSessions();
    loadRuns();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sync status');
    }
  };

  const loadSessions = async () => {
    try {
      const sessions = await api.listSyncSessions();
      setSessions(sessions);
    } catch (err) {
      // Silently fail - sessions list is optional
    }
  };

  const loadRuns = async () => {
    try {
      const runs = await api.getRuns();
      setRuns(runs);
    } catch (err) {
      // Silently fail
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedRunId) {
        const result = await api.syncRun(selectedRunId, true, true, []);
        if (result.status === 'conflict') {
          Alert.alert(
            'Sync Conflict',
            `Detected ${result.conflicts.length} conflict(s). Server data takes precedence.`,
          );
        } else {
          Alert.alert(
            'Sync Complete',
            `Synced ${result.server_events_count} events and ${result.server_diffs_count} diffs.`,
          );
        }
        await loadSessions();
      } else {
        Alert.alert('Select a Run', 'Please select a run to sync from the list below.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoSync = (value: boolean) => {
    setAutoSync(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={MD3_COLORS.primary} />
        </View>
      )}
      {!loading && (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Cloud Sync</Text>
            <Text style={styles.subtitle}>Synchronize workflow runs across devices</Text>
          </View>

          {/* Sync Status Card */}
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Sync Status</Text>
            <View style={styles.syncStatusRow}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Status</Text>
                <View style={[styles.statusBadge, syncStatus?.status === 'synced' && styles.statusSynced]}>
                  <Text style={styles.statusText}>{syncStatus?.status || 'Unknown'}</Text>
                </View>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Pending Changes</Text>
                <Text style={styles.statusValue}>{syncStatus?.pending_changes ?? 0}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Synced Runs</Text>
                <Text style={styles.statusValue}>{syncStatus?.total_synced_runs ?? 0}</Text>
              </View>
            </View>
            <View style={styles.lastSyncRow}>
              <Text style={styles.lastSyncLabel}>Last Sync</Text>
              <Text style={styles.lastSyncValue}>
                {syncStatus?.last_sync ? new Date(syncStatus.last_sync).toLocaleString() : 'Never'}
              </Text>
            </View>
          </View>

          {/* Auto Sync Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleItem}>
              <Switch
                value={autoSync}
                onValueChange={handleToggleAutoSync}
                trackColor={{ false: '#cccccc', true: MD3_COLORS.primary }}
              />
              <Text style={styles.toggleLabel}>Auto-sync on app launch</Text>
            </View>
          </View>

          {/* Run Selection */}
          <View style={styles.selectSection}>
            <Text style={styles.sectionTitle}>Select Run to Sync</Text>
            <FlatList
              data={runs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.runItem, selectedRunId === item.id && styles.runItemSelected]}
                  onPress={() => setSelectedRunId(item.id)}
                >
                  <Text style={styles.runItemName}>{item.name}</Text>
                  <Text style={styles.runItemMeta}>
                    {item.totalEvents} events • {item.status}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          </View>

          {/* Sync Action */}
          <TouchableOpacity style={styles.syncButton} onPress={handleSync} activeOpacity={0.8}>
            <Text style={styles.syncButtonText}>{loading ? 'Syncing…' : 'Sync Now'}</Text>
          </TouchableOpacity>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.errorText, { color: MD3_COLORS.error }]}>{error}</Text>
            </View>
          )}

          {/* Recent Sync Sessions */}
          <View style={styles.sessionsSection}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sectionTitle}>Recent Sync Sessions ({sessions.length})</Text>
            </View>
            {sessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No sync sessions yet</Text>
                <Text style={styles.emptyHint}>Sync a run to create a session record</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item.share_token || item.sync_id || item.id}
                renderItem={({ item }) => (
                  <View style={styles.sessionCard}>
                    <Text style={styles.sessionToken}>{item.sync_id?.slice(0, 8) ?? item.id?.slice(0, 8)}</Text>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionMetaText}>Run: {item.run_id}</Text>
                      <Text style={styles.sessionMetaText}>
                        Events: {item.server_events_count ?? item.total_events ?? 0}
                      </Text>
                      <Text style={styles.sessionMetaText}>
                        Diffs: {item.server_diffs_count ?? item.total_diffs ?? 0}
                      </Text>
                      <Text style={styles.sessionMetaText}>
                        {new Date(item.created_at ?? item.exported_at).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.sessionStatus}>
                      <Text style={[styles.sessionStatusText, item.status === 'synced' && styles.statusSyncedText]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </>
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
  configCard: {
    backgroundColor: MD3_COLORS.surfaceContainer,
    borderRadius: MD3_RADIUS.xl,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  configTitle: {
    fontSize: MD3_TYPOGRAPHY.labelMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelMd.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: MD3_TYPOGRAPHY.labelMd.letterSpacing,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: MD3_TYPOGRAPHY.labelSm.letterSpacing,
  },
  statusValue: {
    fontSize: MD3_TYPOGRAPHY.headlineMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.headlineMd.fontWeight,
    color: MD3_COLORS.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusSynced: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  statusText: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
  },
  statusSyncedText: {
    color: '#10b981',
  },
  lastSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  lastSyncLabel: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
  },
  lastSyncValue: {
    fontSize: MD3_TYPOGRAPHY.bodySm.fontSize,
    color: MD3_COLORS.onSurface,
  },
  toggleRow: {
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: MD3_TYPOGRAPHY.bodyMd.fontSize,
    color: MD3_COLORS.onSurface,
  },
  selectSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: MD3_TYPOGRAPHY.labelMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelMd.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: MD3_TYPOGRAPHY.labelMd.letterSpacing,
  },
  runItem: {
    backgroundColor: MD3_COLORS.surfaceContainer,
    borderRadius: MD3_RADIUS.xl,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
  },
  runItemSelected: {
    borderColor: MD3_COLORS.primary,
    backgroundColor: `${MD3_COLORS.primary}10`,
  },
  runItemName: {
    fontSize: MD3_TYPOGRAPHY.bodyMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.bodyMd.fontWeight,
    color: MD3_COLORS.onSurface,
  },
  runItemMeta: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: MD3_COLORS.primary,
    borderRadius: MD3_RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  syncButtonText: {
    color: MD3_COLORS.onPrimary,
    fontWeight: '700',
    fontSize: MD3_TYPOGRAPHY.bodyMd.fontSize,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: MD3_COLORS.error,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: MD3_TYPOGRAPHY.bodySm.fontSize,
    color: MD3_COLORS.error,
  },
  sessionsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionCard: {
    backgroundColor: MD3_COLORS.surfaceContainer,
    borderRadius: MD3_RADIUS.xl,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionToken: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sessionMetaText: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionStatus: {
    alignItems: 'center',
    marginTop: 8,
  },
  sessionStatusText: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
  },
  listContent: {
    paddingBottom: 16,
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
});
