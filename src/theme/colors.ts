export const MD3_COLORS = {
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
};

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
  codeMd: { fontSize: 0.8125 * 16, lineHeight: 1.25 * 16, letterSpacing: 0, fontWeight: '400' as const, fontFamily: 'monospace' },
  codeSm: { fontSize: 0.6875 * 16, lineHeight: 1 * 16, letterSpacing: 0, fontWeight: '400' as const, fontFamily: 'monospace' },
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
