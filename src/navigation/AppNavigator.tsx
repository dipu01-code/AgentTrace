import { DarkTheme, DefaultTheme, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BloatScreen } from '../screens/BloatScreen';
import { DeterminismScreen } from '../screens/DeterminismScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { GraphViewScreen } from '../screens/GraphViewScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { LoopDetectorScreen } from '../screens/LoopDetectorScreen';
import { RegressionScreen } from '../screens/RegressionScreen';
import { ReplayViewScreen } from '../screens/ReplayViewScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { StateDiffScreen } from '../screens/StateDiffScreen';
import { SyncScreen } from '../screens/SyncScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { useStuckRunAlerts } from '../hooks/useStuckRunAlerts';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { MD3_COLORS } from '../theme/colors';
import { useAppScheme } from '../theme/useAppScheme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const linking = {
  prefixes: ['agenttrace://'],
  config: {
    screens: {
      Timeline: '',
      Settings: 'settings',
      RunDetail: 'run/:runId',
      GraphView: 'run/:runId/graph',
      ReplayView: 'run/:runId/replay',
      LoopDetector: 'run/:runId/loops',
      StateDiff: 'run/:runId/diffs',
      Bloat: 'run/:runId/bloat',
      Export: 'run/:runId/export',
      Determinism: 'compare/:runIdA/:runIdB?',
      Regression: 'regression',
      Sync: 'sync',
    },
  },
};

export function AppNavigator() {
  const scheme = useAppScheme();
  const hydrated = useWorkflowStore((s) => s.hydrated);
  const isAuthenticated = useWorkflowStore((s) => s.isAuthenticated);
  useStuckRunAlerts(isAuthenticated, navigationRef);

  // Wait for the saved login to load so we don't flash the sign-in screen.
  if (!hydrated) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: MD3_COLORS.background,
      card: MD3_COLORS.surface,
      text: MD3_COLORS.onSurface,
      border: MD3_COLORS.outlineVariant,
      primary: MD3_COLORS.primary,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: MD3_COLORS.surface },
            headerTintColor: MD3_COLORS.onSurface,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: MD3_COLORS.background },
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in' }} />
              <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create account' }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Timeline" component={TimelineScreen} options={{ title: 'AgentTrace' }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
              <Stack.Screen name="RunDetail" component={RunDetailScreen} options={{ title: 'Run' }} />
              <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
              <Stack.Screen name="GraphView" component={GraphViewScreen} options={{ title: 'Workflow Graph' }} />
              <Stack.Screen name="ReplayView" component={ReplayViewScreen} options={{ title: 'Replay' }} />
              <Stack.Screen name="LoopDetector" component={LoopDetectorScreen} options={{ title: 'Loop Detector' }} />
              <Stack.Screen name="StateDiff" component={StateDiffScreen} options={{ title: 'State Diffs' }} />
              <Stack.Screen name="Determinism" component={DeterminismScreen} options={{ title: 'Determinism' }} />
              <Stack.Screen name="Regression" component={RegressionScreen} options={{ title: 'Regression Tests' }} />
              <Stack.Screen name="Bloat" component={BloatScreen} options={{ title: 'Code Bloat' }} />
              <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Export / Share' }} />
              <Stack.Screen name="Sync" component={SyncScreen} options={{ title: 'Cloud Sync' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
