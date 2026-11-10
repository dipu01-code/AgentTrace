import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import type { AgentEvent } from '../services/api';
import { EVENT_TYPE_COLORS, MD3_COLORS, MONO_FONT, themed } from '../theme/colors';
import { useAppScheme } from '../theme/useAppScheme';

type Props = {
  event: AgentEvent;
  isExpanded: boolean;
  onToggle: (eventId: string) => void;
  onOpen: (eventId: string) => void;
};

/** Event row that animates open to show timing and payload. */
export const AnimatedEventCard = memo(function AnimatedEventCard({ event, isExpanded, onToggle, onOpen }: Props) {
  useAppScheme();
  const color = EVENT_TYPE_COLORS[event.type] ?? MD3_COLORS.outline;
  return (
    <Animated.View layout={LinearTransition.duration(200)} style={[styles.card, { borderLeftColor: color }]}>
      <Pressable onPress={() => onToggle(event.id)} accessibilityRole="button" testID={`event-${event.id}`}>
        <View style={styles.header}>
          <Text style={[styles.type, { color }]}>{event.type}</Text>
          <Text style={styles.agent} numberOfLines={1}>{event.agentName}</Text>
          {event.latencyMs != null && <Text style={styles.mono}>{Math.round(event.latencyMs)}ms</Text>}
        </View>
        {isExpanded && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.details}>
            <Text style={styles.mono}>{new Date(event.timestamp).toLocaleString()}</Text>
            <Text style={styles.mono} numberOfLines={8}>{JSON.stringify(event.payload, null, 2)}</Text>
            <Text style={styles.link} onPress={() => onOpen(event.id)}>Open event →</Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = themed(() =>
  StyleSheet.create({
    card: {
      borderRadius: 10,
      borderLeftWidth: 4,
      padding: 12,
      marginBottom: 8,
      backgroundColor: MD3_COLORS.surfaceContainerLow,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    type: { fontSize: 13, fontWeight: '700' },
    agent: { flex: 1, fontSize: 13, color: MD3_COLORS.onSurface },
    mono: { fontFamily: MONO_FONT, fontSize: 12, color: MD3_COLORS.onSurfaceVariant },
    details: { marginTop: 8, gap: 6 },
    link: { color: MD3_COLORS.primary, fontWeight: '600', fontSize: 13 },
  })
);
