import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from '../services/api';
import type { RootStackParamList } from '../navigation/types';

const POLL_MS = 60_000;
// Android 8+ shows a heads-up banner only for HIGH importance channels.
const CHANNEL_ID = 'stuck-runs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Ask the backend to push us; false if this build/device can't get an Expo push token. */
async function registerForRemotePush(): Promise<boolean> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!Device.isDevice || !projectId) return false;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.registerPushToken(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Phase 20: alert when a run is looping or stops producing events.
 * Real devices with an EAS project get server pushes; everywhere else
 * (simulator, Expo Go) the app polls /runs/stuck while open and shows a local notification.
 */
export function useStuckRunAlerts(
  enabled: boolean,
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>
) {
  const alerted = useRef(new Set<string>());

  // Tapping a notification opens the run.
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const runId = response?.notification.request.content.data?.runId;
      if (typeof runId === 'string' && navigationRef.isReady()) navigationRef.navigate('RunDetail', { runId });
    };
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [navigationRef]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const check = async () => {
      if (AppState.currentState !== 'active') return;
      try {
        const fresh = (await api.getStuckRuns()).filter((run) => !alerted.current.has(run.id));
        fresh.forEach((run) => alerted.current.add(run.id));
        if (fresh.length === 0) return;
        const [run] = fresh;
        // One summary instead of a burst when several runs get stuck at once.
        const content =
          fresh.length === 1
            ? {
                title: run.status === 'looping' ? 'Workflow looping' : 'Workflow stuck',
                body: run.status === 'looping' ? `${run.name} is repeating itself` : `${run.name} has stopped making progress`,
                data: { runId: run.id },
              }
            : { title: `${fresh.length} workflows need attention`, body: fresh.map((r) => r.name).slice(0, 3).join(', '), data: {} };
        await Notifications.scheduleNotificationAsync({ content, trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null });
      } catch {
        // Offline or signed out; try again next tick.
      }
    };

    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Stuck workflows',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      const { granted } = await Notifications.requestPermissionsAsync();
      if (!granted || cancelled) return;
      if (await registerForRemotePush()) return; // server will push; no need to poll
      if (cancelled) return;
      check();
      timer = setInterval(check, POLL_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [enabled]);
}
