import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { api, ReplayEvent } from '../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'ReplayView'>;
};

const TYPE_COLORS: Record<string, string> = {
  agent_start: '#3b82f6',
  agent_end: '#10b981',
  tool_call: '#8b5cf6',
  tool_result: '#06b6d4',
  llm_call: '#f59e0b',
  llm_result: '#ef4444',
  state_change: '#14b8a6',
  loop_detected: '#dc2626',
  error: '#dc2626',
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ReplayViewScreen({ route }: Props) {
  const { runId } = route.params;
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const duration = useSharedValue(0);
  const position = useSharedValue(0);
  const scrubberWidth = useSharedValue(0);

  useEffect(() => {
    api.getReplayEvents(runId)
      .then((data) => {
        setEvents(data);
        if (data.length > 0) {
          duration.value = Math.max(...data.map((e) => e.elapsedMs));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load replay');
        setLoading(false);
      });
  }, [runId]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || events.length === 0) return;

    const interval = setInterval(() => {
      position.value = withTiming(
        Math.min(position.value + 100 * speed, duration.value),
        { duration: 100 / speed },
        () => {
          if (position.value >= duration.value) {
            setIsPlaying(false);
          }
        },
      );
    }, 100 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, events.length, duration.value]);

  const handleScrubberGesture = Gesture.Pan()
    .onUpdate((e) => {
      const progress = Math.max(0, Math.min(1, e.translationX / scrubberWidth.value));
      position.value = progress * duration.value;
      setIsPlaying(false);
    })
    .onEnd(() => {
      setIsPlaying(true);
    });

  const scrubberStyle = useAnimatedStyle(() => ({
    width: (position.value / Math.max(duration.value, 1)) * scrubberWidth.value,
  }));

  const currentEventIndex = events.findIndex(
    (e) => e.elapsedMs > position.value,
  ) - 1;
  const currentEvent = currentEventIndex >= 0 ? events[currentEventIndex] : null;

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    position.value = clamped * duration.value;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Could not load replay</Text>
        <Text style={styles.errorHint}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No events to replay</Text>
        <Text style={styles.emptyHint}>Ingest agent events for this run first.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Replay</Text>
          <Text style={styles.subtitle}>Run: {runId}</Text>
        </View>
      </View>

      {/* Timeline scrubber */}
      <View style={styles.scrubberContainer}>
        <GestureDetector gesture={handleScrubberGesture}>
          <Animated.View style={[styles.scrubberTrack, scrubberStyle]} />
        </GestureDetector>
        <View style={styles.scrubberLabels}>
          <Text style={styles.timeLabel}>0:00</Text>
          <Text style={[styles.timeLabel, { textAlign: 'center' }]}>
            {formatTime(duration.value / 2)}
          </Text>
          <Text style={[styles.timeLabel, { textAlign: 'right' }]}>
            {formatTime(duration.value)}
          </Text>
        </View>
      </View>

      {/* Playback controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isPlaying ? styles.controlButtonActive : null]}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <Text style={styles.controlIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
          activeOpacity={0.8}
        >
          <Text style={styles.controlIcon}>{speed}×</Text>
        </TouchableOpacity>
        <Text style={styles.controlsLabel}>
          {formatTime(position.value)} / {formatTime(duration.value)}
        </Text>
      </View>

      {/* Current event highlight */}
      <View style={styles.eventCardContainer}>
        {currentEvent ? (
          <View style={[styles.eventCard, { borderLeftColor: TYPE_COLORS[currentEvent.type] || '#6b7280' }]}>
            <Text style={styles.eventType}>{currentEvent.type}</Text>
            <Text style={styles.eventAgent}>{currentEvent.agentName}</Text>
            <Text style={styles.eventTime}>
              {formatTime(currentEvent.elapsedMs)}
            </Text>
            <Text style={styles.eventPayload}>
              {typeof currentEvent.payload === 'string'
                ? currentEvent.payload
                : JSON.stringify(currentEvent.payload).slice(0, 100)}
            </Text>
          </View>
        ) : (
          <View style={styles.eventCard}>
            <Text style={styles.eventType}>Waiting…</Text>
            <Text style={styles.eventAgent}>Playback at start</Text>
          </View>
        )}
      </View>

      {/* Full event timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Timeline ({events.length})</Text>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isCurrent = index === currentEventIndex;
            const progress = item.elapsedMs / duration.value;
            return (
              <TouchableOpacity
                style={[styles.timelineItem, isCurrent && styles.timelineItemActive]}
                onPress={() => {
                  handleSeek(progress);
                  setIsPlaying(true);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.eventDot, { backgroundColor: TYPE_COLORS[item.type] || '#6b7280' }]} />
                <View style={styles.timelineItemContent}>
                  <Text style={[styles.timelineItemType, isCurrent && styles.timelineItemTypeActive]}>
                    {item.type}
                  </Text>
                  <Text style={[styles.timelineItemAgent, isCurrent && styles.timelineItemAgentActive]}>
                    {item.agentName}
                  </Text>
                  <Text style={styles.timelineItemTime}>
                    {formatTime(item.elapsedMs)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { padding: 8 },
  backText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  headerContent: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280' },
  scrubberContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrubberLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  timeLabel: { fontSize: 11, color: '#9ca3af' },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  controlButtonActive: {
    backgroundColor: '#3b82f6',
  },
  controlIcon: { fontSize: 20 },
  controlsLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 12 },
  eventCardContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  eventType: { fontSize: 13, fontWeight: '700', color: '#374151' },
  eventAgent: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  eventTime: { fontSize: 12, fontFamily: 'monospace', color: '#6b7280', marginTop: 4 },
  eventPayload: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
    fontFamily: 'monospace',
  },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  listContent: { paddingBottom: 16 },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  timelineItemActive: {
    backgroundColor: '#f0f7ff',
  },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 8 },
  timelineItemContent: { flex: 1 },
  timelineItemType: { fontSize: 12, fontWeight: '600', color: '#374151' },
  timelineItemTypeActive: { color: '#3b82f6' },
  timelineItemAgent: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  timelineItemAgentActive: { color: '#3b82f6', fontWeight: '600' },
  timelineItemTime: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },
  errorText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  errorHint: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#6b7280', marginTop: 8 },
});
