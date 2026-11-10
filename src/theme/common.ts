import { StyleSheet } from 'react-native';
import { MD3_COLORS, MONO_FONT, themed } from './colors';

/** Shared screen styles; follows the active light/dark theme. */
export const ui = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: MD3_COLORS.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 8,
      backgroundColor: MD3_COLORS.background,
    },
    content: { padding: 16, paddingBottom: 48, gap: 12 },
    title: { fontSize: 22, fontWeight: '700', color: MD3_COLORS.onSurface },
    subtitle: { fontSize: 14, color: MD3_COLORS.textMuted, marginTop: 2 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: MD3_COLORS.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 8,
    },
    card: {
      backgroundColor: MD3_COLORS.surfaceContainerLow,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: MD3_COLORS.outlineVariant,
      gap: 6,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    label: { fontSize: 12, color: MD3_COLORS.textMuted },
    value: { fontSize: 15, fontWeight: '600', color: MD3_COLORS.onSurface },
    body: { fontSize: 14, color: MD3_COLORS.onSurface },
    muted: { fontSize: 13, color: MD3_COLORS.textMuted },
    mono: { fontFamily: MONO_FONT, fontSize: 12, color: MD3_COLORS.onSurfaceVariant },
    input: {
      borderWidth: 1,
      borderColor: MD3_COLORS.outlineVariant,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: MD3_COLORS.onSurface,
      backgroundColor: MD3_COLORS.surfaceContainerLow,
    },
    error: { fontSize: 14, color: MD3_COLORS.error },
    errorBanner: {
      backgroundColor: MD3_COLORS.dangerContainer,
      borderRadius: 8,
      padding: 12,
    },
    stat: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { fontSize: 22, fontWeight: '700', color: MD3_COLORS.onSurface },
  })
);
