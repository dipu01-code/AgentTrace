import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Timeline: undefined;
  Dashboard: undefined;
  RunDetail: { runId: string };
  EventDetail: { runId: string; eventId: string };
  GraphView: { runId: string };
  ReplayView: { runId: string };
  LoopDetector: { runId: string };
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
