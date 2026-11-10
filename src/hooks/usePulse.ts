import { useEffect } from 'react';
import { cancelAnimation, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** Shared value that pulses between 1 and `scale` while `enabled`. */
export function usePulse(durationMs = 1200, scale = 1.15, enabled = true) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = enabled ? withRepeat(withTiming(scale, { duration: durationMs / 2 }), -1, true) : 1;
    return () => cancelAnimation(pulse);
  }, [durationMs, scale, enabled, pulse]);
  return pulse;
}
