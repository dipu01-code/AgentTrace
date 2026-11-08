import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { RunSummary } from '../services/api';
import { AnimatedRunCard } from '../components/AnimatedRunCard';

type Props = {
  runs: RunSummary[];
  onRefresh: () => void;
  refreshing?: boolean;
  onRunPress: (runId: string) => void;
  onCreatePress: () => void;
};

export function TimelineList({ runs, onRefresh, refreshing, onRunPress, onCreatePress }: Props) {
  const renderItem = ({ item, index }: { item: RunSummary; index: number }) => (
    <AnimatedRunCard run={item} onPress={onRunPress} index={index} />
  );

  const keyExtractor = (item: RunSummary) => item.id;

  return (
    <View style={styles.container}>
      <FlatList
        data={runs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={refreshing ?? false}
        refreshControl={
          (refreshing ?? false) ? <ActivityIndicator style={styles.refreshIndicator} /> : undefined
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
      <View style={styles.fabWrapper}>
        <TouchableOpacityFab onPress={onCreatePress} />
      </View>
    </View>
  );
}

function TouchableOpacityFab({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.fabText}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { paddingBottom: 100 },
  fabWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },
  fab: {
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
  refreshIndicator: { marginVertical: 20 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 6 },
  fabText: { fontSize: 24, color: '#ffffff', fontWeight: '700' },
});
