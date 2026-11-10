import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Timeline: undefined;
  Settings: undefined;
  RunDetail: { runId: string };
  EventDetail: { runId: string; eventId: string };
  GraphView: { runId: string };
  ReplayView: { runId: string };
  LoopDetector: { runId: string };
  StateDiff: { runId: string };
  Determinism: { runIdA: string; runIdB?: string };
  Regression: { baselineRunId?: string } | undefined;
  Bloat: { runId: string };
  Export: { runId: string };
  Sync: { runId?: string } | undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
