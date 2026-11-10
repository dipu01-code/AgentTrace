import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RunSummary } from '../services/api';
import { Chip } from './ui';
import { ui } from '../theme/common';

type Props = {
  label: string;
  runs: RunSummary[];
  selectedId: string;
  onSelect: (runId: string) => void;
  excludeId?: string;
  testID?: string;
};

/** Horizontal chip list for choosing a run. */
export function RunPicker({ label, runs, selectedId, onSelect, excludeId, testID }: Props) {
  const options = runs.filter((r) => r.id !== excludeId);
  return (
    <View style={styles.wrap} testID={testID}>
      <Text style={ui.label}>{label}</Text>
      {options.length === 0 ? (
        <Text style={ui.muted}>No other runs yet</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {options.map((r) => (
            <Chip key={r.id} label={`${r.name} · ${r.totalEvents}`} selected={r.id === selectedId} onPress={() => onSelect(r.id)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  chips: { gap: 8, paddingRight: 8 },
});
