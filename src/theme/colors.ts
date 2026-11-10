import { Platform } from 'react-native';

// iOS has no font called "monospace"
export const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });


const MD3_DARK = {
  // Surface
  surface: '#111318',
  surfaceContainer: '#1e1f25',
  surfaceContainerHighest: '#33353a',
  surfaceContainerLowest: '#0c0e13',
  surfaceContainerLow: '#1a1b21',
  surfaceContainerHigh: '#282a2f',
  surfaceVariant: '#33353a',
  surfaceBright: '#37393f',

  // On Surface
  onSurface: '#e2e2e9',
  onSurfaceVariant: '#bbc9cd',

  // Primary
  primary: '#8aebff',
  onPrimary: '#00363e',
  primaryContainer: '#22d3ee',
  onPrimaryContainer: '#005763',
  primaryFixed: '#a2eeff',
  primaryFixedDim: '#2fd9f4',
  onPrimaryFixed: '#001f25',
  onPrimaryFixedVariant: '#004e5a',
  inversePrimary: '#006877',
  surfaceTint: '#2fd9f4',

  // Secondary
  secondary: '#d0bcff',
  onSecondary: '#3c0091',
  secondaryContainer: '#571bc1',
  onSecondaryContainer: '#c4abff',
  secondaryFixed: '#e9ddff',
  secondaryFixedDim: '#d0bcff',
  onSecondaryFixed: '#23005c',
  onSecondaryFixedVariant: '#5516be',

  // Tertiary
  tertiary: '#68f5b8',
  onTertiary: '#003824',
  tertiaryContainer: '#46d89d',
  onTertiaryContainer: '#005a3d',
  tertiaryFixed: '#6ffbbe',
  tertiaryFixedDim: '#4edea3',
  onTertiaryFixed: '#002113',
  onTertiaryFixedVariant: '#005236',

  // Error
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // Outline
  outline: '#859397',
  outlineVariant: '#3c494c',

  // Inverse
  inverseSurface: '#e2e2e9',
  inverseOnSurface: '#2e3036',

  // Background
  background: '#111318',
  onBackground: '#e2e2e9',

  // App-specific tokens (used by the older light-styled screens)
  textMuted: '#9aa3ad',
  textSubtle: '#7c858f',
  strong: '#2563eb',
  dangerContainer: '#3b1113',
  onDangerContainer: '#fecaca',
  successContainer: '#0f2e22',
  warningContainer: '#3a2a07',
  onWarningContainer: '#fcd34d',
  infoContainer: '#13233f',
};

type Palette = typeof MD3_DARK;

const MD3_LIGHT: Palette = {
  surface: '#f6f8fb',
  surfaceContainer: '#eef1f5',
  surfaceContainerHighest: '#e1e5ea',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#ffffff',
  surfaceContainerHigh: '#e7eaef',
  surfaceVariant: '#dbe4e6',
  surfaceBright: '#f6f8fb',

  onSurface: '#111827',
  onSurfaceVariant: '#3f484a',

  primary: '#006877',
  onPrimary: '#ffffff',
  primaryContainer: '#a2eeff',
  onPrimaryContainer: '#001f25',
  primaryFixed: '#a2eeff',
  primaryFixedDim: '#2fd9f4',
  onPrimaryFixed: '#001f25',
  onPrimaryFixedVariant: '#004e5a',
  inversePrimary: '#8aebff',
  surfaceTint: '#006877',

  secondary: '#6d3fd6',
  onSecondary: '#ffffff',
  secondaryContainer: '#e9ddff',
  onSecondaryContainer: '#23005c',
  secondaryFixed: '#e9ddff',
  secondaryFixedDim: '#d0bcff',
  onSecondaryFixed: '#23005c',
  onSecondaryFixedVariant: '#5516be',

  tertiary: '#006c49',
  onTertiary: '#ffffff',
  tertiaryContainer: '#6ffbbe',
  onTertiaryContainer: '#002113',
  tertiaryFixed: '#6ffbbe',
  tertiaryFixedDim: '#4edea3',
  onTertiaryFixed: '#002113',
  onTertiaryFixedVariant: '#005236',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',

  outline: '#9ca3af',
  outlineVariant: '#e5e7eb',

  inverseSurface: '#2e3036',
  inverseOnSurface: '#f0f0f7',

  background: '#f6f8fb',
  onBackground: '#111827',

  textMuted: '#6b7280',
  textSubtle: '#9ca3af',
  strong: '#111827',
  dangerContainer: '#fef2f2',
  onDangerContainer: '#7f1d1d',
  successContainer: '#ecfdf5',
  warningContainer: '#fef3c7',
  onWarningContainer: '#92400e',
  infoContainer: '#eff6ff',
};

export type ColorScheme = 'light' | 'dark';
let activeScheme: ColorScheme = 'dark';

/** Called by useAppScheme() during render so colors and styles below follow the theme. */
export function setActiveScheme(scheme: ColorScheme) {
  activeScheme = scheme;
}

export function getActiveScheme(): ColorScheme {
  return activeScheme;
}

const palettes: Record<ColorScheme, Palette> = { light: MD3_LIGHT, dark: MD3_DARK };

// Reads go to whichever palette is active at render time, so module-level
// code can keep writing MD3_COLORS.primary.
export const MD3_COLORS: Palette = new Proxy({} as Palette, {
  get: (_, key) => palettes[activeScheme][key as keyof Palette],
});

/** Lazily build a StyleSheet per scheme; property reads return the active one. */
export function themed<T extends object>(build: () => T): T {
  const cache: Partial<Record<ColorScheme, T>> = {};
  return new Proxy({} as T, {
    get: (_, key) => (cache[activeScheme] ??= build())[key as keyof T],
  });
}


export const MD3_TYPOGRAPHY = {
  display: { fontSize: 2.25 * 16, lineHeight: 2.75 * 16, letterSpacing: -0.03, fontWeight: '700' as const },
  headlineLg: { fontSize: 1.75 * 16, lineHeight: 2.25 * 16, letterSpacing: -0.025, fontWeight: '600' as const },
  headlineLgMobile: { fontSize: 1.375 * 16, lineHeight: 1.875 * 16, letterSpacing: -0.02, fontWeight: '600' as const },
  headlineMd: { fontSize: 1.25 * 16, lineHeight: 1.75 * 16, letterSpacing: -0.02, fontWeight: '600' as const },
  headlineSm: { fontSize: 1 * 16, lineHeight: 1.5 * 16, letterSpacing: -0.015, fontWeight: '600' as const },
  bodyLg: { fontSize: 1 * 16, lineHeight: 1.5 * 16, letterSpacing: -0.01, fontWeight: '400' as const },
  bodyMd: { fontSize: 0.875 * 16, lineHeight: 1.375 * 16, letterSpacing: -0.005, fontWeight: '400' as const },
  bodySm: { fontSize: 0.75 * 16, lineHeight: 1.125 * 16, letterSpacing: 0, fontWeight: '400' as const },
  labelLg: { fontSize: 0.75 * 16, lineHeight: 1 * 16, letterSpacing: 0.04, fontWeight: '500' as const },
  labelMd: { fontSize: 0.75 * 16, lineHeight: 1 * 16, letterSpacing: 0.02, fontWeight: '500' as const },
  labelSm: { fontSize: 0.6875 * 16, lineHeight: 0.875 * 16, letterSpacing: 0.04, fontWeight: '500' as const },
  codeMd: { fontSize: 0.8125 * 16, lineHeight: 1.25 * 16, letterSpacing: 0, fontWeight: '400' as const, fontFamily: MONO_FONT },
  codeSm: { fontSize: 0.6875 * 16, lineHeight: 1 * 16, letterSpacing: 0, fontWeight: '400' as const, fontFamily: MONO_FONT },
} as const;

export const MD3_SPACING = {
  gutterMobile: 12,
  margin: 16,
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 12,
  spaceLg: 20,
};

export const MD3_RADIUS = {
  default: 4,
  lg: 8,
  xl: 12,
  full: 24,
};

export default { colors: MD3_COLORS, typography: MD3_TYPOGRAPHY, spacing: MD3_SPACING, radius: MD3_RADIUS };


export const EVENT_TYPE_COLORS: Record<string, string> = {
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

export const STATUS_COLORS: Record<string, string> = {
  running: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
  looping: '#f59e0b',
};
