import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export function GraphViewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'GraphView'>>();
  const { runId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workflow Graph</Text>
        <Text style={styles.subtitle}>Run: {runId}</Text>
      </View>
      <View style={styles.graphPlaceholder}>
        <Text style={styles.graphText}>Agent interaction graph</Text>
        <Text style={styles.graphHint}>Node/edge rendering in Phase 9</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  graphPlaceholder: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  graphHint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
