import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Dashboard: undefined;
  RunDetail: { runId: string };
  EventDetail: { runId: string; eventId: string };
  GraphView: { runId: string };
  ReplayView: { runId: string };
};

export type DashboardScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Dashboard'
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
