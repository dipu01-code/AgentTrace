import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { GraphViewScreen } from '../screens/GraphViewScreen';
import { ReplayViewScreen } from '../screens/ReplayViewScreen';
import { LoopDetectorScreen } from '../screens/LoopDetectorScreen';
import { StateDiffScreen } from '../screens/StateDiffScreen';
import { DeterminismScreen } from '../screens/DeterminismScreen';
import { RegressionScreen } from '../screens/RegressionScreen';
import { BloatScreen } from '../screens/BloatScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { SyncScreen } from '../screens/SyncScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { useWorkflowStore } from '../store/useWorkflowStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Stack: any = require('@react-navigation/native-stack').createNativeStackNavigator();

export function AppNavigator() {
  const { isAuthenticated } = useWorkflowStore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Timeline' : 'Login'}
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign in' }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ title: 'Create account' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Timeline"
            component={TimelineScreen}
            options={{ title: 'Timeline' }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'Workflows' }}
          />
          <Stack.Screen
            name="RunDetail"
            component={RunDetailScreen}
            options={{ title: 'Run Details' }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ title: 'Event' }}
          />
          <Stack.Screen
            name="GraphView"
            component={GraphViewScreen}
            options={{ title: 'Workflow Graph' }}
          />
          <Stack.Screen
            name="ReplayView"
            component={ReplayViewScreen}
            options={{ title: 'Replay' }}
          />
          <Stack.Screen
            name="LoopDetector"
            component={LoopDetectorScreen}
            options={{ title: 'Loop Detector' }}
          />
          <Stack.Screen
            name="StateDiff"
            component={StateDiffScreen}
            options={{ title: 'State Diffs' }}
          />
          <Stack.Screen
            name="Determinism"
            component={DeterminismScreen}
            options={{ title: 'Determinism Check' }}
          />
          <Stack.Screen
            name="Regression"
            component={RegressionScreen}
            options={{ title: 'Regression Tests' }}
          />
          <Stack.Screen
            name="Bloat"
            component={BloatScreen}
            options={{ title: 'Code Bloat' }}
          />
          <Stack.Screen
            name="Export"
            component={ExportScreen}
            options={{ title: 'Export / Share' }}
          />
          <Stack.Screen
            name="Sync"
            component={SyncScreen}
            options={{ title: 'Cloud Sync' }}
          />
        </>
      )}
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return <AppNavigator />;
}
