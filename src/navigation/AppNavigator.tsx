import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { GraphViewScreen } from '../screens/GraphViewScreen';
import { ReplayViewScreen } from '../screens/ReplayViewScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Timeline"
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
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
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
