import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export function EventDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EventDetail'>>();
  const { runId, eventId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Detail</Text>
        <Text style={styles.subtitle}>Run: {runId} • Event: {eventId}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Type</Text>
        <Text style={styles.cardValue}>—</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Agent</Text>
        <Text style={styles.cardValue}>—</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payload</Text>
        <Text style={styles.cardValue}>{JSON.stringify({})}</Text>
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
  cardValue: { fontSize: 16, color: '#374151', marginTop: 4 },
});
