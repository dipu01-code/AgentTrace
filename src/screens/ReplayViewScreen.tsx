import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { api, ReplayEvent } from '../services/api';
import { EVENT_TYPE_COLORS, MD3_COLORS, MONO_FONT, themed } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

const TICK_MS = 50;
const ROW_HEIGHT = 56;
const SPEEDS = [1, 2, 4, 10];

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`;
}

/** Index of the last event at or before `position` (events are sorted by elapsedMs). */
function eventIndexAt(events: ReplayEvent[], position: number): number {
  let lo = 0;
  let hi = events.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].elapsedMs <= position) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

export function ReplayViewScreen({ route }: ScreenProps<'ReplayView'>) {
  useAppScheme();
  const { runId } = route.params;
  const [events, setEvents] = useState<ReplayEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [trackWidth, setTrackWidth] = useState(1);
  const listRef = useRef<FlatList<ReplayEvent>>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    api.getReplayEvents(runId).then(setEvents).catch((e) => setError(e.message));
  }, [runId]);

  const duration = Math.max(events?.[events.length - 1]?.elapsedMs ?? 0, 1);
  const current = events ? eventIndexAt(events, position) : -1;

  // Advance the playhead while playing.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setPosition((p) => Math.min(p + TICK_MS * speed, duration)), TICK_MS);
    return () => clearInterval(timer);
  }, [playing, speed, duration]);

  useEffect(() => {
    if (position >= duration) setPlaying(false);
  }, [position, duration]);

  useEffect(() => {
    progress.value = withTiming(position / duration, { duration: TICK_MS, easing: Easing.linear });
  }, [position, duration, progress]);

  useEffect(() => {
    if (playing && current >= 0) listRef.current?.scrollToIndex({ index: current, viewPosition: 0.5, animated: true });
  }, [current, playing]);

  const seek = useCallback((fraction: number) => {
    setPosition(Math.max(0, Math.min(1, fraction)) * duration);
  }, [duration]);

  // runOnJS(true): callbacks run on the JS thread so they can set React state.
  const scrub = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => {
          setPlaying(false);
          seek(e.x / trackWidth);
        })
        .onUpdate((e) => seek(e.x / trackWidth)),
    [seek, trackWidth]
  );

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (error) return <View style={ui.center}><Text style={ui.error}>{error}</Text></View>;
  if (!events) return <View style={ui.center}><ActivityIndicator color={MD3_COLORS.primary} /></View>;

  const event = current >= 0 ? events[current] : null;
  const togglePlay = () => {
    if (!playing && position >= duration) setPosition(0);
    setPlaying(!playing);
  };

  return (
    <View style={ui.screen} testID="replay">
      <View style={styles.top}>
        <GestureDetector gesture={scrub}>
          <View
            style={styles.track}
            onLayout={(e) => setTrackWidth(Math.max(e.nativeEvent.layout.width, 1))}
            testID="replay-scrubber"
            accessibilityRole="adjustable"
            accessibilityLabel="Replay position"
          >
            <Animated.View style={[styles.fill, fillStyle]} />
            {events.map((e) => (
              <View
                key={e.id}
                style={[styles.tick, { left: `${(e.elapsedMs / duration) * 100}%`, backgroundColor: EVENT_TYPE_COLORS[e.type] ?? MD3_COLORS.outline }]}
              />
            ))}
          </View>
        </GestureDetector>
        <View style={ui.between}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.button} onPress={() => setPosition(events[Math.max(current - 1, 0)].elapsedMs)} accessibilityLabel="Previous event">
            <Text style={styles.buttonText}>⏮</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.play]} onPress={togglePlay} testID="replay-play" accessibilityLabel={playing ? 'Pause' : 'Play'}>
            <Text style={[styles.buttonText, { color: MD3_COLORS.onPrimary }]}>{playing ? '❚❚' : '▶'}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setPosition(events[Math.min(current + 1, events.length - 1)].elapsedMs)} accessibilityLabel="Next event">
            <Text style={styles.buttonText}>⏭</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} accessibilityLabel="Playback speed">
            <Text style={styles.buttonText}>{speed}×</Text>
          </Pressable>
        </View>

        <View style={[ui.card, { borderLeftWidth: 4, borderLeftColor: event ? EVENT_TYPE_COLORS[event.type] : MD3_COLORS.outline }]}>
          {event ? (
            <>
              <View style={ui.between}>
                <Text style={ui.value}>{event.type}</Text>
                <Text style={styles.time}>#{current + 1} of {events.length}</Text>
              </View>
              <Text style={ui.body}>{event.agentName}</Text>
              <Text style={ui.mono} numberOfLines={3}>{JSON.stringify(event.payload)}</Text>
            </>
          ) : (
            <Text style={ui.muted}>Press play or drag the bar to step through {events.length} events.</Text>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={events}
        keyExtractor={(e) => e.id}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        onScrollToIndexFailed={() => undefined}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Pressable
            style={[styles.row, index === current && styles.rowActive]}
            onPress={() => {
              setPlaying(false);
              setPosition(item.elapsedMs);
            }}
          >
            <View style={[styles.dot, { backgroundColor: EVENT_TYPE_COLORS[item.type] ?? MD3_COLORS.outline }]} />
            <View style={{ flex: 1 }}>
              <Text style={ui.body} numberOfLines={1}>{item.type} · {item.agentName}</Text>
              <Text style={styles.time}>{formatTime(item.elapsedMs)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    top: { padding: 16, gap: 10 },
    track: {
      height: 28,
      borderRadius: 8,
      backgroundColor: MD3_COLORS.surfaceContainerHigh,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: MD3_COLORS.primary, opacity: 0.35 },
    tick: { position: 'absolute', width: 2, height: 14, marginLeft: -1 },
    time: { fontFamily: MONO_FONT, fontSize: 12, color: MD3_COLORS.textMuted },
    controls: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
    button: {
      minWidth: 48,
      height: 44,
      borderRadius: 22,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: MD3_COLORS.surfaceContainerHigh,
    },
    play: { backgroundColor: MD3_COLORS.primary, minWidth: 64 },
    buttonText: { fontSize: 16, fontWeight: '700', color: MD3_COLORS.onSurface },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    row: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, borderRadius: 8 },
    rowActive: { backgroundColor: MD3_COLORS.surfaceContainerHigh },
    dot: { width: 10, height: 10, borderRadius: 5 },
  })
);
