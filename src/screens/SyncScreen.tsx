import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { RunPicker } from '../components/RunPicker';
import { AgentButton } from '../components/ui';
import { api, RunSummary, SyncResult, SyncSession, SyncStatus } from '../services/api';
import { MD3_COLORS, STATUS_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

const EXAMPLE = `[{"id":"evt-1","agent_id":"planner","agent_name":"Planner","type":"llm_call","timestamp":${Math.floor(Date.now() / 1000)},"payload":{"prompt":"plan"}}]`;

/** Phase 19: push recorded events to the server, which validates and stores them. */
export function SyncScreen({ route }: ScreenProps<'Sync'>) {
  useAppScheme();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [runId, setRunId] = useState(route.params?.runId ?? '');
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [sessions, setSessions] = useState<SyncSession[]>([]);
  const [last, setLast] = useState<SyncResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, list] = await Promise.all([api.getSyncStatus(), api.listSyncSessions()]);
      setStatus(s);
      setSessions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sync status');
    }
  }, []);

  useEffect(() => {
    api.getRuns().then(setRuns).catch(() => undefined);
    refresh();
  }, [refresh]);

  const sync = async () => {
    setError(null);
    let changes: Record<string, unknown>[] = [];
    if (raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        changes = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        setError('Events must be valid JSON (an object or an array of objects).');
        return;
      }
    }
    setBusy(true);
    try {
      setLast(await api.syncRun(runId, changes));
      setRaw('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setBusy(false);
    }
  };

  const nameOf = (id: string) => runs.find((r) => r.id === id)?.name ?? `${id.slice(0, 8)}…`;

  return (
    <FlatList
      testID="sync"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={sessions}
      keyExtractor={(s) => s.sync_id}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {status && (
            <View style={[ui.card, ui.row]}>
              <View style={ui.stat}>
                <Text style={[ui.statValue, { color: status.status === 'synced' ? STATUS_COLORS.completed : STATUS_COLORS.looping }]}>
                  {status.status}
                </Text>
                <Text style={ui.label}>Status</Text>
              </View>
              <View style={ui.stat}><Text style={ui.statValue}>{status.total_synced_runs}</Text><Text style={ui.label}>Runs synced</Text></View>
              <View style={ui.stat}><Text style={ui.statValue}>{status.pending_changes}</Text><Text style={ui.label}>With rejects</Text></View>
            </View>
          )}
          <View style={ui.card}>
            <RunPicker label="Run" runs={runs} selectedId={runId} onSelect={setRunId} />
            <Text style={ui.label}>Events to upload (JSON). Each is validated; an "id" makes re-uploads safe.</Text>
            <TextInput
              testID="sync-input"
              style={[ui.input, ui.mono, { minHeight: 90, textAlignVertical: 'top' }]}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={EXAMPLE}
              placeholderTextColor={MD3_COLORS.textSubtle}
              value={raw}
              onChangeText={setRaw}
            />
            <AgentButton title={busy ? 'Syncing…' : raw.trim() ? 'Validate & upload' : 'Sync run'} onPress={sync} disabled={busy || !runId} />
            {error && <Text style={ui.error}>{error}</Text>}
            {last && (
              <View testID="sync-result">
                <Text style={ui.body}>
                  Accepted {last.accepted_count} · duplicates {last.conflicts.length} · rejected {last.rejected.length} · server now has {last.server_events_count} events
                </Text>
                {last.rejected.map((r) => (
                  <Text key={r.index} style={ui.error}>#{r.index}: {r.errors.join('; ')}</Text>
                ))}
              </View>
            )}
          </View>
          <Text style={ui.sectionTitle}>History ({sessions.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={ui.muted}>No syncs yet.</Text>}
      renderItem={({ item }) => (
        <View style={ui.card}>
          <View style={ui.between}>
            <Text style={ui.value}>{nameOf(item.run_id)}</Text>
            <Text style={[ui.label, { color: item.status === 'synced' ? STATUS_COLORS.completed : STATUS_COLORS.looping }]}>{item.status}</Text>
          </View>
          <Text style={ui.muted}>
            +{item.accepted_count} events · {item.rejected.length} rejected · {item.server_events_count} on server
          </Text>
          <Text style={ui.mono}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      )}
    />
  );
}
