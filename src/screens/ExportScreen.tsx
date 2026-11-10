import { useEffect, useState } from 'react';
import { Alert, FlatList, Share, Switch, Text, TextInput, View } from 'react-native';
import { RunPicker } from '../components/RunPicker';
import { AgentButton } from '../components/ui';
import { api, ExportResult, ExportSummary, RunSummary, shareUrl } from '../services/api';
import { MD3_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

export function ExportScreen({ route }: ScreenProps<'Export'>) {
  useAppScheme();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [runId, setRunId] = useState(route.params.runId);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeDiffs, setIncludeDiffs] = useState(true);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [sessions, setSessions] = useState<ExportSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRuns().then(setRuns).catch(() => undefined);
    api.listExportedSessions().then(setSessions).catch(() => undefined);
  }, []);

  const handleExport = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await api.exportSession(runId, includeEvents, includeDiffs, description.trim() || undefined));
      setSessions(await api.listExportedSessions());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const shareLink = (token: string) => Share.share({ message: shareUrl(`/api/v1/export/session/${token}`) });
  const shareJson = async (token: string) => {
    try {
      const session = await api.getExportedSession(token);
      await Share.share({ message: JSON.stringify(session, null, 2) });
    } catch (e) {
      Alert.alert('Share failed', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <FlatList
      testID="export"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={sessions}
      keyExtractor={(s) => s.share_token}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={ui.card}>
            <RunPicker label="Run" runs={runs} selectedId={runId} onSelect={setRunId} />
            <View style={ui.between}>
              <Text style={ui.body}>Include events</Text>
              <Switch value={includeEvents} onValueChange={setIncludeEvents} trackColor={{ true: MD3_COLORS.primary }} />
            </View>
            <View style={ui.between}>
              <Text style={ui.body}>Include state diffs</Text>
              <Switch value={includeDiffs} onValueChange={setIncludeDiffs} trackColor={{ true: MD3_COLORS.primary }} />
            </View>
            <TextInput
              style={ui.input}
              placeholder="Description (optional)"
              placeholderTextColor={MD3_COLORS.textSubtle}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />
            <AgentButton title={busy ? 'Exporting…' : 'Export session'} onPress={handleExport} disabled={busy || !runId} />
            {error && <Text style={ui.error}>{error}</Text>}
          </View>

          {result && (
            <View style={[ui.card, { borderColor: MD3_COLORS.primary }]} testID="export-result">
              <Text style={ui.value}>Exported {result.total_events} events, {result.total_diffs} diff batches</Text>
              <Text style={ui.mono} selectable>{shareUrl(result.share_url)}</Text>
              <View style={ui.row}>
                <AgentButton title="Share link" variant="tonal" onPress={() => shareLink(result.share_token)} />
                <AgentButton title="Share JSON" variant="tonal" onPress={() => shareJson(result.share_token)} />
              </View>
            </View>
          )}
          <Text style={ui.sectionTitle}>Previous exports ({sessions.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={ui.muted}>Nothing exported yet.</Text>}
      renderItem={({ item }) => (
        <View style={ui.card}>
          <View style={ui.between}>
            <Text style={ui.value}>{item.description || runs.find((r) => r.id === item.run_id)?.name || item.run_id}</Text>
            <AgentButton title="Share" variant="ghost" onPress={() => shareLink(item.share_token)} />
          </View>
          <Text style={ui.muted}>{item.total_events} events · {item.total_diffs} diff batches</Text>
          <Text style={ui.mono}>{new Date(item.exported_at).toLocaleString()}</Text>
        </View>
      )}
    />
  );
}
