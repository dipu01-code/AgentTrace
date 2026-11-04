import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { AgentEvent } from '../services/api';

type Props = {
  route: { params: { runId: string } };
};

/**
 * Renders a simplified loop-cycle chain inline.
 */
function LoopChain({ events }: { events: AgentEvent[] }) {
  return (
    <View style={styles.chainContainer}>
      {events.map((event, i) => (
        <View key={event.id} style={styles.chainRow}>
          <Text style={styles.chainIndex}>{i + 1}</Text>
          <View style={[styles.chainDot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.chainLabel}>{event.agentName}</Text>
          <Text style={styles.chainType}>{event.type}</Text>
          {i < events.length - 1 && <Text style={styles.chainArrow}>↓</Text>}
        </View>
      ))}
    </View>
  );
}

export function LoopDetectorScreen({ route }: Props) {
  const { runId } = route.params;
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/api').then(({ api }) => {
      api.getEvents(runId)
        .then((data) => {
          const loops = data.filter((e) => e.type === 'loop_detected');
          setEvents(loops);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [runId]);

  const loopCount = events.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Detecting loops…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Loop Detector</Text>
          <Text style={styles.subtitle}>Run: {runId}</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Loops Detected</Text>
        <Text style={[styles.statValue, { color: loopCount > 0 ? '#dc2626' : '#10b981' }]}>
          {loopCount}
        </Text>
        <Text style={styles.statHint}>
          {loopCount === 0 ? 'No infinite loops found' : 'Review the loop cycles below'}
        </Text>
      </View>

      {loopCount === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>✓ Clean run</Text>
          <Text style={styles.emptyHint}>No loops were detected in this workflow trace.</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loop Cycles</Text>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.loopCard} accessibilityLabel={`Loop: ${item.agentName}`}>
                <Text style={styles.loopTitle}>{item.agentName}</Text>
                <Text style={styles.loopMeta}>
                  {item.type} • {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.loopPayload}>
                  {JSON.stringify(item.payload).slice(0, 80)}
                </Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.chainNote}>
            <Text style={styles.chainNoteTitle}>Loop chain:</Text>
            <LoopChain events={events} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { padding: 8 },
  backText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  headerContent: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280' },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  statValue: { fontSize: 32, fontWeight: '800', marginTop: 6 },
  statHint: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#10b981' },
  emptyHint: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  loopCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  loopTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  loopMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  loopPayload: { fontSize: 11, color: '#9ca3af', marginTop: 6, fontFamily: 'monospace' },
  chainContainer: { marginTop: 10, paddingHorizontal: 16 },
  chainNote: { marginHorizontal: 16, marginTop: 12 },
  chainNoteTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  chainIndex: { fontSize: 11, fontWeight: '700', color: '#9ca3af', width: 20 },
  chainDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  chainLabel: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
  chainType: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  chainArrow: { fontSize: 14, color: '#cbd5e1', marginHorizontal: 4 },
});
