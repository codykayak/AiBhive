import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getOrCreateHiveUserId, registerHiveDevice } from './hiveApi';

/** Bundled notification sound (see app.json expo-notifications plugin sounds). */
export const HIVE_CHIME_SOUND = 'hive-chime.wav';

export const NOTIFICATION_CHANNELS = {
  hiveMagic: 'hive-magic',
  daily: 'hive-daily',
  proactive: 'hive-proactive',
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let permissionGranted = false;

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.hiveMagic, {
    name: 'Hive Magic',
    importance: Notifications.AndroidImportance.HIGH,
    sound: HIVE_CHIME_SOUND,
    vibrationPattern: [0, 100, 60, 100],
    lightColor: '#f59e0b',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.daily, {
    name: 'Daily motivation',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: HIVE_CHIME_SOUND,
    vibrationPattern: [0, 80, 40, 80],
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.proactive, {
    name: 'Smart suggestions',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: HIVE_CHIME_SOUND,
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionGranted) return true;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  permissionGranted = final === 'granted';
  if (permissionGranted) {
    await ensureAndroidChannels();
  }
  return permissionGranted;
}

type DingOptions = {
  title?: string;
  body?: string;
  channel?: keyof typeof NOTIFICATION_CHANNELS;
};

export async function dingFeatureReady(
  title = 'Hive Magic',
  body = 'Your feature is ready!',
  opts?: DingOptions
) {
  await ensureNotificationPermission();
  const channelKey = opts?.channel ?? 'hiveMagic';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: opts?.title ?? title,
      body: opts?.body ?? body,
      sound: HIVE_CHIME_SOUND,
      ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNELS[channelKey] } : {}),
    },
    trigger: null,
  });
}

export async function notifyProactive(title: string, body: string): Promise<void> {
  await ensureNotificationPermission();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: HIVE_CHIME_SOUND,
      data: { type: 'proactive' },
      ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNELS.proactive } : {}),
    },
    trigger: null,
  });
}

let pushRegistered = false;

/**
 * Request the Expo push token and send it to the Hive server so server-side
 * code (orchestrator poller) can ding this device when the build completes,
 * even if the app is backgrounded or closed.
 */
export async function registerExpoPushToken(): Promise<string | null> {
  if (pushRegistered) return null;
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return null;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any).easConfig?.projectId ||
      undefined;
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenRes?.data;
    if (!token) return null;
    const userId = await getOrCreateHiveUserId();
    const registered = await registerHiveDevice(userId, token, Platform.OS);
    pushRegistered = registered;
    return token;
  } catch {
    return null;
  }
}

export async function initNotificationServices(): Promise<void> {
  await ensureNotificationPermission();
  await registerExpoPushToken();
}
