import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

type Props = {
  event: any;
  isExpanded: boolean;
  onToggle: () => void;
};

/**
 * Expandable event card with animated height.
 * Tapping toggles between collapsed (summary only) and expanded (full payload).
 */
export function AnimatedEventCard({
  event,
  isExpanded,
  onToggle,
}: Props) {
  const height = useSharedValue(isExpanded ? 220 : 96);

  const animatedHeight = useAnimatedStyle(() => ({
    height: withSpring(height.value, { damping: 20, stiffness: 150 }),
    opacity: withTiming(1, { duration: 300 }),
  }));

  const containerStyle: any = {
    ...styles.container,
    borderColor: '#e5e7eb',
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onToggle}
      activeOpacity={0.95}
    >
      <Animated.View style={[styles.inner, animatedHeight]}>
        <View style={styles.header}>
          <Text style={styles.type}>{event.type}</Text>
          <Text style={styles.agent}>{event.agentName}</Text>
        </View>
        {isExpanded && (
          <View style={styles.details}>
            <Text style={styles.label}>Timestamp</Text>
            <Text style={styles.value}>
              {new Date(event.timestamp).toLocaleString()}
            </Text>
            {event.latencyMs != null && (
              <>
                <Text style={styles.label}>Latency</Text>
                <Text style={styles.value}>{event.latencyMs} ms</Text>
              </>
            )}
            <Text style={styles.label}>Payload</Text>
            <Text style={styles.payload}>
              {typeof event.payload === 'string'
                ? event.payload
                : JSON.stringify(event.payload, null, 2)}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: '#fafbfc',
  },
  header: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: { fontSize: 13, fontWeight: '700', color: '#374151' },
  agent: { fontSize: 12, color: '#6b7280' },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  value: { fontSize: 13, color: '#111827', marginBottom: 4 },
  payload: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'monospace',
  } as any,
});
