import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Timeline: undefined;
  Dashboard: undefined;
  RunDetail: { runId: string };
  EventDetail: { runId: string; eventId: string };
  GraphView: { runId: string };
  ReplayView: { runId: string };
  LoopDetector: { runId: string };
  StateDiff: { runId: string };
  Determinism: { runIdA: string; runIdB: string };
  Regression: undefined;
  Bloat: { runId: string };
  Export: { runId: string };
};

export type DashboardScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Dashboard'
>;
export type TimelineScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Timeline'
>;
export type RunDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'RunDetail'
>;
export type EventDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EventDetail'
>;
export type GraphViewScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'GraphView'
>;
export type ReplayViewScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ReplayView'
>;
export type LoopDetectorScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'LoopDetector'
>;
export type StateDiffScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'StateDiff'
>;
export type DeterminismScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Determinism'
>;
export type RegressionScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Regression'
>;
export type BloatScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Bloat'
>;
export type ExportScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Export'
>;
