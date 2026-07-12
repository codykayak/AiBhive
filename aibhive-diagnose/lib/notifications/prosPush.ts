import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registerProsPushToken } from '@/lib/jobs/prosNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let registered = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerDiagnosePush(getIdToken: () => Promise<string | null>): Promise<void> {
  if (registered || Platform.OS === 'web') return;
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const expoPushToken = tokenRes?.data;
    if (!expoPushToken) return;

    const authToken = await getIdToken();
    if (!authToken) return;

    const saved = await registerProsPushToken(authToken, expoPushToken, Platform.OS);
    if (saved) registered = true;
  } catch {
    // Expo Go may lack push credentials — non-fatal
  }
}

export function addNotificationResponseListener(
  handler: (data: { notificationId?: string; jobId?: string }) => void
) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as {
      notificationId?: string;
      jobId?: string;
    };
    handler(data || {});
  });
  return () => sub.remove();
}
