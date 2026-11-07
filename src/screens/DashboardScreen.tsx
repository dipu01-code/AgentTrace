import { StyleSheet, Text, View } from 'react-native';
import SafeAreaView from '../components/SafeAreaView';
import { DashboardScreenProps } from '../navigation/types';

export function DashboardScreen({ }: DashboardScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workflows</Text>
        <Text style={styles.subtitle}>Multi-agent run history</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No runs yet</Text>
        <Text style={styles.emptyHint}>
          Ingest a workflow run to begin debugging
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 6 },
});
