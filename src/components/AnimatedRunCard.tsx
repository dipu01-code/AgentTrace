import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import type { RunSummary } from '../services/api';
import { usePulse } from '../hooks/usePulse';
import { MD3_COLORS, MONO_FONT, STATUS_COLORS, themed } from '../theme/colors';
import { useAppScheme } from '../theme/useAppScheme';

type Props = {
  run: RunSummary;
  onPress: (runId: string) => void;
  index: number;
};

/** Run row: staggered fade/slide in, press-scale, pulsing dot while looping. */
export const AnimatedRunCard = memo(function AnimatedRunCard({ run, onPress, index }: Props) {
  useAppScheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(1);
  const pulse = usePulse(1000, 1.6, run.status === 'looping');

  useEffect(() => {
    const delay = Math.min(index, 10) * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 350 }));
  }, [index, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const color = STATUS_COLORS[run.status] ?? MD3_COLORS.outline;

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <Pressable
        testID={`run-card-${run.name}`}
        accessibilityRole="button"
        accessibilityLabel={`Open run ${run.name}`}
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 80 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 200 }))}
        onPress={() => onPress(run.id)}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{run.name}</Text>
          <Text style={styles.time}>
            {new Date(run.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.meta}>
          <Animated.View style={[styles.dot, { backgroundColor: color }, dotStyle]} />
          <Text style={[styles.status, { color }]}>{run.status}</Text>
          <Text style={styles.count}>{run.totalEvents} events</Text>
          {run.loopCount > 0 && <Text style={styles.loops}>{run.loopCount} loops</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = themed(() =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: MD3_COLORS.outlineVariant,
      backgroundColor: MD3_COLORS.surfaceContainerLow,
    },
    inner: { padding: 14, gap: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    name: { flex: 1, fontSize: 16, fontWeight: '600', color: MD3_COLORS.onSurface },
    time: { fontSize: 12, color: MD3_COLORS.textMuted, fontFamily: MONO_FONT },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    status: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    count: { fontSize: 12, color: MD3_COLORS.textMuted, fontFamily: MONO_FONT },
    loops: { fontSize: 12, color: STATUS_COLORS.looping, fontWeight: '600' },
  })
);
