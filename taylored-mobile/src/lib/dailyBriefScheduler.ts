import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { buildDailyBrief } from './proactiveAssistant';
import { loadProactivePrefs } from './proactivePrefs';
import { ensureNotificationPermission, HIVE_CHIME_SOUND, NOTIFICATION_CHANNELS } from './notifications';

const DAILY_BRIEF_ID = 'hive-daily-motivation';

export async function cancelDailyMotivation(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_BRIEF_ID);
  } catch {
    // ignore
  }
}

export async function scheduleDailyMotivation(): Promise<void> {
  const prefs = await loadProactivePrefs();
  await cancelDailyMotivation();

  if (!prefs.dailyMotivation) return;

  const ok = await ensureNotificationPermission();
  if (!ok) return;

  const brief = await buildDailyBrief();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_BRIEF_ID,
    content: {
      title: brief.title,
      body: brief.body,
      sound: HIVE_CHIME_SOUND,
      data: { type: 'daily_brief', actionHint: brief.actionHint },
      ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNELS.daily } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: prefs.dailyHour,
      minute: prefs.dailyMinute,
    },
  });
}

export async function refreshProactiveSchedules(): Promise<void> {
  await scheduleDailyMotivation();
}
