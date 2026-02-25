import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useClient } from 'urql';
import { useStore } from '@/lib/store';
import {
  REGISTER_DEVICE_TOKEN_MUTATION,
} from '@/lib/graphql/mutations';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_ID = 'mood-reminder';

export async function scheduleReminder(secondsFromNow: number) {
  await cancelReminder();
  if (secondsFromNow <= 0) return;
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Time to log your mood',
      body: "You haven't logged a mood in a while",
      data: { type: 'reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(secondsFromNow)),
    },
  });
}

export async function cancelReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}

export function useNotifications() {
  const router = useRouter();
  const urqlClient = useClient();
  const authToken = useStore((s) => s.authToken);
  const currentUserId = useStore((s) => s.currentUserId);
  const initialized = useRef(false);

  useEffect(() => {
    if (!authToken || !currentUserId) return;
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const pushToken = tokenData.data;

      await urqlClient
        .mutation(REGISTER_DEVICE_TOKEN_MUTATION, { input: { token: pushToken } })
        .toPromise();
    })();
  }, [authToken, currentUserId]);

  // Handle notification tap
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        router.push('/(tabs)');
      },
    );
    return () => subscription.remove();
  }, [router]);
}
