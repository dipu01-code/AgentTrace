import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import type { RunSummary } from '../services/api';

type Props = {
  run: RunSummary;
  onPress: (runId: string) => void;
  index: number;
};

/**
 * Animated run card: fades in and slides up on mount (staggered by index),
 * scales down slightly on press, pulses when loops are detected.
 */
export function AnimatedRunCard({ run, onPress, index }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // Entrance animation with staggered delay based on index
  opacity.value = withTiming(1, { duration: 400 });
  translateY.value = withDelay(
    index * 80,
    withTiming(0, { duration: 500 }),
  );

  // Pulse for looping runs
  if (run.loopCount > 0) {
    pulse.value = withRepeat(
      withTiming(1.15, { duration: 800 }),
      -1,
      true,
    );
  } else {
    pulse.value = withTiming(1, { duration: 0 });
  }

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value * pulse.value },
    ],
  }));

  const handlePress = () => {
    scale.value = withTiming(0.95, { duration: 100 }, () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
      runOnJS(onPress)(run.id);
    });
  };

  const statusColor = {
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
    looping: '#f59e0b',
  }[run.status] as string;

  return (
    <Animated.View style={[styles.card, containerStyle]}>
      <GestureDetector gesture={Gesture.Tap().onEnd(handlePress)}>
        <TouchableOpacity
          style={styles.touchable}
          activeOpacity={0.8}
          onPress={handlePress}
        >
          <View style={styles.cardContent}>
            <View style={styles.rowHeader}>
              <Text style={styles.title}>{run.name}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusColor },
                  ]}
                />
                <Text style={styles.statusText}>{run.status}</Text>
                {run.loopCount > 0 && (
                  <Animated.View style={[styles.loopBadge, { transform: [{ scale: pulse.value }] }]}>
                    <Text style={styles.loopBadgeText}>{run.loopCount} loops</Text>
                  </Animated.View>
                )}
              </View>
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.metaText}>{run.totalEvents} events</Text>
              <Text style={styles.metaText}>
                {run.deterministic ? 'deterministic' : 'non-deterministic'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  touchable: { flex: 1, padding: 16 },
  cardContent: {},
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  loopBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    transform: [{ scale: 1 }],
  },
  loopBadgeText: { fontSize: 10, fontWeight: '800', color: '#92400e' },
  rowMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaText: { fontSize: 12, color: '#9ca3af' },
});
