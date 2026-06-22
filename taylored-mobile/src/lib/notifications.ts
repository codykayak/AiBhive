import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getOrCreateHiveUserId, registerHiveDevice } from './hiveApi';

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

export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionGranted) return true;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  permissionGranted = final === 'granted';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hive-magic', {
      name: 'Hive Magic',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 120, 80, 120],
    });
  }
  return permissionGranted;
}

export async function dingFeatureReady(title = 'Hive Magic', body = 'Your feature is ready!') {
  await ensureNotificationPermission();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: null,
    ...(Platform.OS === 'android' ? { channelId: 'hive-magic' } : {}),
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
    if (!userId || userId.startsWith('anon_')) {
      // We still send the anonymous id so the server can deliver pushes
      // before sign-in. The auth-aware server prefers the Firebase uid
      // when present.
    }
    const registered = await registerHiveDevice(userId, token, Platform.OS);
    pushRegistered = registered;
    return token;
  } catch {
    return null;
  }
}
