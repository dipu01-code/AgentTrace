import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { AgentEvent, api } from '../services/api';
import { EVENT_TYPE_COLORS, MD3_COLORS } from '../theme/colors';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';
import type { ScreenProps } from '../navigation/types';

export function EventDetailScreen({ navigation, route }: ScreenProps<'EventDetail'>) {
  useAppScheme();
  const { runId, eventId } = route.params;
  const [events, setEvents] = useState<AgentEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEvents(runId).then(setEvents).catch((e) => setError(e.message));
  }, [runId]);

  if (error) return <View style={ui.center}><Text style={ui.error}>{error}</Text></View>;
  if (!events) return <View style={ui.center}><ActivityIndicator color={MD3_COLORS.primary} /></View>;

  const event = events.find((e) => e.id === eventId);
  if (!event) return <View style={ui.center}><Text style={ui.muted}>Event not found</Text></View>;
  const parent = event.parentId ? events.find((e) => e.id === event.parentId) : undefined;
  const children = events.filter((e) => e.parentId === event.id);

  const Field = ({ label, value }: { label: string; value: string }) => (
    <View>
      <Text style={ui.label}>{label}</Text>
      <Text style={ui.body} selectable>{value}</Text>
    </View>
  );
  const link = (e: AgentEvent) => (
    <Text
      key={e.id}
      style={[ui.body, { color: MD3_COLORS.primary }]}
      onPress={() => navigation.push('EventDetail', { runId, eventId: e.id })}
    >
      {e.type} · {e.agentName} →
    </Text>
  );

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <View style={ui.card}>
        <Text style={[ui.title, { color: EVENT_TYPE_COLORS[event.type] ?? MD3_COLORS.onSurface }]}>{event.type}</Text>
        <Field label="Agent" value={`${event.agentName} (${event.agentId})`} />
        <Field label="Time" value={new Date(event.timestamp).toLocaleString()} />
        {event.latencyMs != null && <Field label="Latency" value={`${event.latencyMs} ms`} />}
        <Field label="Event ID" value={event.id} />
      </View>
      <Text style={ui.sectionTitle}>Payload</Text>
      <View style={ui.card}>
        <Text style={ui.mono} selectable>{JSON.stringify(event.payload, null, 2)}</Text>
      </View>
      {parent && (
        <>
          <Text style={ui.sectionTitle}>Parent</Text>
          <View style={ui.card}>{link(parent)}</View>
        </>
      )}
      {children.length > 0 && (
        <>
          <Text style={ui.sectionTitle}>Replies ({children.length})</Text>
          <View style={ui.card}>{children.map(link)}</View>
        </>
      )}
    </ScrollView>
  );
}
