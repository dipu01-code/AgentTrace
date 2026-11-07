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
  TextInput,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { api, RunSummary } from '../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'Export'>;
};

export function ExportScreen({ route }: Props) {
  const { runId } = route.params;
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRunId, _setSelectedRunId] = useState<string>(runId);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeDiffs, setIncludeDiffs] = useState(true);
  const [description, setDescription] = useState<string>('');
  const [exportResult, setExportResult] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRuns()
      .then((data) => setRuns(data))
      .catch(() => setRuns([]));

    api.listExportedSessions()
      .then((data) => setSessions(data))
      .catch(() => setSessions([]));
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.exportSession(
        selectedRunId,
        includeEvents,
        includeDiffs,
        description || undefined,
      );
      setExportResult(result);
      const updated = await api.listExportedSessions();
      setSessions(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareUrl = () => {
    if (exportResult?.share_url) {
      Alert.alert('Share URL', exportResult.share_url);
    }
  };

  const handleDownload = () => {
    if (exportResult) {
      Alert.alert(
        'Download',
        'Share token: ' + exportResult.share_token,
      );
    }
  };

  const selectedRun = runs.find((r) => r.id === selectedRunId);

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
        <Text style={styles.errorText}>Could not export session</Text>
        <Text style={styles.errorHint}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleExport}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Export / Share</Text>
        <Text style={styles.subtitle}>Export debug sessions for sharing</Text>
      </View>

      {/* Export config */}
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>Export Debug Session</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Run</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => {}}>
            <Text style={styles.selectText}>
              {selectedRun?.name ?? 'Select run'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Switch
              value={includeEvents}
              onValueChange={setIncludeEvents}
              trackColor={{ false: '#cccccc', true: '#3b82f6' }}
            />
            <Text style={styles.toggleLabel}>Include events</Text>
          </View>
          <View style={styles.toggleItem}>
            <Switch
              value={includeDiffs}
              onValueChange={setIncludeDiffs}
              trackColor={{ false: '#cccccc', true: '#3b82f6' }}
            />
            <Text style={styles.toggleLabel}>Include state diffs</Text>
          </View>
        </View>

        <TextInput
          style={styles.descInput}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          maxLength={100}
        />

        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>{loading ? 'Exporting…' : 'Export Session'}</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Export result */}
      {exportResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Exported Successfully</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Share token</Text>
            <Text style={styles.resultValue}>{exportResult.share_token}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Share URL</Text>
            <Text style={styles.resultValue}>{exportResult.share_url}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Run ID</Text>
            <Text style={styles.resultValue}>{exportResult.run_id}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Events</Text>
            <Text style={styles.resultValue}>{exportResult.total_events}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Diffs</Text>
            <Text style={styles.resultValue}>{exportResult.total_diffs}</Text>
          </View>
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopyShareUrl}>
              <Text style={styles.actionButtonText}>Copy URL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
              <Text style={styles.actionButtonText}>Download JSON</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Previous sessions */}
      <View style={styles.sessionsSection}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sectionTitle}>Previous Sessions ({sessions.length})</Text>
        </View>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No exported sessions yet</Text>
            <Text style={styles.emptyHint}>Export a run to share it with your team</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.share_token}
            renderItem={({ item }) => (
              <View style={styles.sessionCard}>
                <Text style={styles.sessionToken}>{item.share_token}</Text>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionMetaText}>Run: {item.run_id}</Text>
                  <Text style={styles.sessionMetaText}>Events: {item.total_events}</Text>
                  <Text style={styles.sessionMetaText}>Diffs: {item.total_diffs}</Text>
                  <Text style={styles.sessionMetaText}>
                    {new Date(item.exported_at).toLocaleString()}
                  </Text>
                </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: { fontSize: 13, color: '#374151', fontWeight: '600' },
  selectButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
  },
  selectText: { fontSize: 13, color: '#374151' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: { fontSize: 13, color: '#374151' },
  descInput: {
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
  exportButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exportButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 10,
    marginTop: 10,
    borderRadius: 0,
  },
  errorText: { fontSize: 13, color: '#dc2626' },
  errorHint: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  retryText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultLabel: { fontSize: 13, color: '#6b7280' },
  resultValue: { fontSize: 13, fontWeight: '600', color: '#111827', fontFamily: 'monospace' },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  sessionsSection: { marginHorizontal: 16, marginBottom: 16 },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  listContent: { paddingBottom: 16 },
  sessionCard: {
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
  sessionToken: { fontSize: 12, fontFamily: 'monospace', color: '#3b82f6', fontWeight: '600', marginBottom: 6 },
  sessionMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sessionMetaText: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
