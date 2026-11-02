import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export function ReplayViewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReplayView'>>();
  const { runId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Replay</Text>
        <Text style={styles.subtitle}>Run: {runId}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline Position</Text>
        <Text style={styles.cardValue}>0:00</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Playback Speed</Text>
        <Text style={styles.cardValue}>1×</Text>
      </View>
      <View style={styles.controls}>
        <Text style={styles.controlsLabel}>Scrubber & playback controls in Phase 13</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 4 },
  controls: { marginHorizontal: 20, alignItems: 'center', justifyContent: 'center', padding: 16 },
  controlsLabel: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
