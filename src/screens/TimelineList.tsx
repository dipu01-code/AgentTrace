import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { RunSummary } from '../services/api';

type Props = {
  runs: RunSummary[];
  onRefresh: () => void;
  refreshing: boolean;
  onRunPress: (runId: string) => void;
  onCreatePress: () => void;
};

const STATUS_STYLES: Record<string, any> = {
  running: { backgroundColor: '#3b82f6' },
  completed: { backgroundColor: '#10b981' },
  failed: { backgroundColor: '#ef4444' },
  looping: { backgroundColor: '#f59e0b' },
};

export function TimelineList({ runs, onRefresh, refreshing, onRunPress, onCreatePress }: Props) {
  const renderItem = ({ item }: { item: RunSummary }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onRunPress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <View style={styles.rowMeta}>
          <View style={[styles.statusDot, STATUS_STYLES[item.status] || { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.rowMetaText}>{item.status}</Text>
          <Text style={styles.rowMetaText}>{item.totalEvents} events</Text>
          {item.loopCount > 0 && (
            <Text style={[styles.rowMetaText, styles.loopText]}>{item.loopCount} loops</Text>
          )}
        </View>
        <Text style={styles.rowTime}>{formatTime(item.updatedAt)}</Text>
      </View>
      <View style={styles.rowChevron} />
    </TouchableOpacity>
  );

  const keyExtractor = (item: RunSummary) => item.id;

  return (
    <View style={styles.container}>
      <FlatList
        data={runs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          refreshing ? <ActivityIndicator style={styles.refreshIndicator} /> : undefined
        }
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No workflow runs yet</Text>
            <Text style={styles.emptyHint}>Create a run to start tracing agent events</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity style={styles.fab} onPress={onCreatePress} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { paddingBottom: 80 },
  row: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowInfo: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  rowMetaText: { fontSize: 12, color: '#6b7280' },
  loopText: { color: '#dc2626', fontWeight: '600' },
  rowTime: { fontSize: 12, color: '#9ca3af', marginLeft: 8 },
  rowChevron: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 6 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: { fontSize: 24, color: '#ffffff', fontWeight: '700' },
  refreshIndicator: { marginVertical: 20 },
});
