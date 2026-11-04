import { useSharedValue, withTiming, withRepeat } from 'react-native-reanimated';

/**
 * Returns a shared value that pulses between 1 and a target scale,
 * useful for highlighting loop-detected or error events.
 *
 * @param durationMs - Length of one pulse cycle in ms
 * @param scale - Peak scale factor (default 1.15)
 * @param enabled - Whether the pulse is active
 */
export function usePulse(
  durationMs: number = 1200,
  scale: number = 1.15,
  enabled: boolean = true,
) {
  const pulse = useSharedValue(1);

  if (enabled) {
    pulse.value = withRepeat(
      withTiming(scale, { duration: durationMs / 2 }),
      -1,
      true,
    );
  } else {
    pulse.value = withTiming(1, { duration: 0 });
  }

  return pulse;
}
