import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MD3_COLORS, MD3_TYPOGRAPHY, MD3_RADIUS } from '../../theme/colors';

type AgentButtonProps = {
  onPress: () => void;
  title: string;
  variant?: 'filled' | 'outlined' | 'tonal' | 'ghost';
  disabled?: boolean;
  style?: any;
};

export function AgentButton({
  onPress,
  title,
  variant = 'filled',
  disabled,
  style,
}: AgentButtonProps) {
  const variants: Record<string, any> = {
    filled: {
      container: { backgroundColor: MD3_COLORS.primary },
      text: { color: MD3_COLORS.onPrimary },
    },
    outlined: {
      container: { borderColor: MD3_COLORS.outline, borderWidth: 1 },
      text: { color: MD3_COLORS.onSurface },
    },
    tonal: {
      container: { backgroundColor: '#37393f' },
      text: { color: MD3_COLORS.onSurface },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: MD3_COLORS.primary },
    },
  };

  const v = variants[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        agentButtonStyles.container,
        v.container,
        disabled && { opacity: 0.5, backgroundColor: MD3_COLORS.surfaceVariant },
        style,
      ]}
    >
      <Text style={[agentButtonStyles.text, v.text, disabled && { color: '#bbc9cd' }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leadingIcon?: React.ReactNode;
};

export function Chip({ label, selected = false, onPress, leadingIcon }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[chipStyles.container, selected ? chipStyles.selected : chipStyles.unselected]}
    >
      {leadingIcon && <View style={chipStyles.iconContainer}>{leadingIcon}</View>}
      <Text style={[chipStyles.label, selected ? chipStyles.labelSelected : chipStyles.labelUnselected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  trend?: string;
};

export function MetricCard({ title, value, subtitle, icon, accentColor = MD3_COLORS.primary, trend }: MetricCardProps) {
  return (
    <View style={metricCardStyles.container}>
      <View style={metricCardStyles.topRow}>
        <View style={[metricCardStyles.leftCol, accentColor && { backgroundColor: accentColor }]}>
          <Text style={metricCardStyles.title}>{title}</Text>
        </View>
        {icon && <View style={metricCardStyles.iconWrap}>{icon}</View>}
      </View>
      <View style={metricCardStyles.bottomRow}>
        <Text style={[metricCardStyles.value, accentColor && { color: accentColor }]}>{value}</Text>
        {subtitle && <Text style={metricCardStyles.subtitle}>{subtitle}</Text>}
      </View>
      {trend && (
        <View style={metricCardStyles.trendRow}>
          <Text style={metricCardStyles.trendText}>{trend}</Text>
        </View>
      )}
    </View>
  );
}

export type StateChipProps = {
  label: string;
  status: 'running' | 'completed' | 'failed' | 'looping' | 'waiting';
};

export function StateChip({ label, status }: StateChipProps) {
  const statusStyles: Record<string, any> = {
    running: { bg: '#e7f0ff', border: '#2fd9f4', text: '#2fd9f4' },
    completed: { bg: '#ecfdf5', border: '#10b981', text: '#10b981' },
    failed: { bg: '#fef2f2', border: '#dc2626', text: '#dc2626' },
    looping: { bg: '#fef3c7', border: '#f59e0b', text: '#f59e0b' },
    waiting: { bg: '#e9ddff', border: '#8a5cf6', text: '#8a5cf6' },
  };

  const s = statusStyles[status] || statusStyles.waiting;

  return (
    <View style={[stateChipStyles.container]}>
      <View style={[stateChipStyles.dot, { backgroundColor: s.text }]} />
      <Text style={[stateChipStyles.label, { color: s.text }]}>{label}</Text>
    </View>
  );
}

export type PayloadBoxProps = {
  children: React.ReactNode;
  title?: string;
};

export function PayloadBox({ children, title }: PayloadBoxProps) {
  return (
    <View style={payloadBoxStyles.container}>
      {title && <Text style={payloadBoxStyles.title}>{title}</Text>}
      <View style={payloadBoxStyles.content}>{children}</View>
    </View>
  );
}

export type StatusBarProps = {
  label: string;
  status: 'online' | 'error' | 'warning';
  value?: string;
};

export function StatusBar({ label, status, value }: StatusBarProps) {
  const statusColors: Record<string, string> = {
    online: MD3_COLORS.primary,
    error: MD3_COLORS.error,
    warning: MD3_COLORS.tertiary,
  };

  return (
    <View style={statusBarStyles.container}>
      <View style={[statusBarStyles.dot, { backgroundColor: statusColors[status] }]} />
      <Text style={statusBarStyles.label}>{label}</Text>
      {value && <Text style={statusBarStyles.value}>{value}</Text>}
    </View>
  );
}

export type ProgressBarProps = {
  value: number; // 0-100
  color?: string;
};

export function ProgressBar({ value, color = MD3_COLORS.primary }: ProgressBarProps) {
  return (
    <View style={progressBarStyles.container}>
      <View
        style={[progressBarStyles.bar, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]}
      />
    </View>
  );
}

export type SkeletonCardProps = {
  height?: number;
};

export function SkeletonCard({ height = 120 }: SkeletonCardProps) {
  return <View style={[skeletonCardStyles.container, { height }]} />;
}

export type TabBarProps = {
  activeTab: string;
  onTabPress: (tab: string) => void;
  tabs: { id: string; label: string; icon: React.ReactNode }[];
};

export function TabBar({ activeTab, onTabPress, tabs }: TabBarProps) {
  return (
    <View style={tabBarStyles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.8}
          style={[tabBarStyles.tab, tab.id === activeTab && tabBarStyles.active]}
        >
          <View style={[tabBarStyles.icon, tab.id === activeTab && tabBarStyles.activeIcon]}>
            {tab.icon}
          </View>
          <Text style={[tabBarStyles.label, tab.id === activeTab && tabBarStyles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export type LoadingCardProps = {
  title?: string;
};

export function LoadingCard({ title }: LoadingCardProps) {
  return (
    <View style={loadingCardStyles.container}>
      <ActivityIndicator size="large" color={MD3_COLORS.primary} />
      {title && <Text style={loadingCardStyles.title}>{title}</Text>}
    </View>
  );
}

// Unique StyleSheet objects per component
const agentButtonStyles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: MD3_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontSize: MD3_TYPOGRAPHY.labelMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelMd.fontWeight,
    letterSpacing: MD3_TYPOGRAPHY.labelMd.letterSpacing,
  },
});

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: MD3_RADIUS.full,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: MD3_COLORS.primaryContainer,
    borderColor: MD3_COLORS.primary,
  },
  unselected: {
    backgroundColor: MD3_COLORS.surfaceContainerLow,
    borderColor: MD3_COLORS.outlineVariant,
  },
  iconContainer: {
    marginRight: 6,
  },
  label: {
    fontSize: MD3_TYPOGRAPHY.labelMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelMd.fontWeight,
  },
  labelSelected: {
    color: MD3_COLORS.onPrimaryContainer,
    fontWeight: '700',
  },
  labelUnselected: {
    color: MD3_COLORS.onSurfaceVariant,
  },
});

const metricCardStyles = StyleSheet.create({
  container: {
    backgroundColor: MD3_COLORS.surfaceContainerLow,
    borderRadius: MD3_RADIUS.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 104,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: MD3_TYPOGRAPHY.labelSm.letterSpacing,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${MD3_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    marginBottom: 4,
  },
  value: {
    fontSize: MD3_TYPOGRAPHY.headlineMd.fontSize,
    fontWeight: MD3_TYPOGRAPHY.headlineMd.fontWeight,
    color: MD3_COLORS.onSurface,
  },
  subtitle: {
    fontSize: MD3_TYPOGRAPHY.bodySm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
  },
});

const stateChipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
  },
});

const payloadBoxStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0c0e13',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
  },
  title: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: MD3_TYPOGRAPHY.labelSm.letterSpacing,
  },
  content: ( {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    fontFamily: 'monospace',
    color: MD3_COLORS.onSurfaceVariant,
    lineHeight: MD3_TYPOGRAPHY.codeSm.lineHeight,
    fontWeight: MD3_TYPOGRAPHY.codeSm.fontWeight,
  } as any),
});

const statusBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MD3_COLORS.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: MD3_TYPOGRAPHY.labelSm.fontSize,
    fontWeight: MD3_TYPOGRAPHY.labelSm.fontWeight,
    color: MD3_COLORS.onSurfaceVariant,
  },
  value: {
    fontSize: MD3_TYPOGRAPHY.codeSm.fontSize,
    color: MD3_COLORS.onSurface,
    fontWeight: '600',
    marginLeft: 8,
  },
});

const progressBarStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 4,
    backgroundColor: MD3_COLORS.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
});

const skeletonCardStyles = StyleSheet.create({
  container: {
    backgroundColor: MD3_COLORS.surfaceContainerLow,
    borderRadius: MD3_RADIUS.xl,
  },
});

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
    backgroundColor: MD3_COLORS.surfaceContainerLowest,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  active: {},
  icon: {
    width: 20,
    height: 20,
    marginBottom: 2,
  },
  activeIcon: {},
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: MD3_COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  activeLabel: {
    color: MD3_COLORS.primary,
    fontWeight: '700',
  },
});

const loadingCardStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: MD3_TYPOGRAPHY.bodyMd.fontSize,
    color: MD3_COLORS.onSurfaceVariant,
    marginTop: 12,
  },
});

export default {
  AgentButton,
  Chip,
  MetricCard,
  StateChip,
  PayloadBox,
  StatusBar,
  ProgressBar,
  SkeletonCard,
  TabBar,
  LoadingCard,
};
