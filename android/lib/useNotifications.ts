import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_IDENTIFIER = 'mood-reminder';

/**
 * Schedule a local reminder at the next 11am or 8pm that is at least
 * 24 hours from now. Call after every mood log and when the reminder
 * toggle is turned on.
 */
export async function scheduleReminder() {
  await cancelReminder();

  const now = new Date();
  const earliest = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Build candidate times: 11am and 8pm for the next few days
  const candidates: Date[] = [];
  for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
    for (const hour of [11, 20]) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + dayOffset);
      candidate.setHours(hour, 0, 0, 0);
      if (candidate >= earliest) {
        candidates.push(candidate);
      }
    }
  }

  if (candidates.length === 0) return;

  const next = candidates.sort((a, b) => a.getTime() - b.getTime())[0];

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: 'How are you feeling?',
      body: "You haven't logged a mood in a while.",
      data: { type: 'reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: next,
    },
  });
}

export async function cancelReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
}

export function useNotifications() {
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);
}
