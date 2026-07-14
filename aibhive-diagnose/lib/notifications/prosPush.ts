import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerProsPushToken } from '@/lib/jobs/prosNotifications';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let handlerConfigured = false;
let registeredForUid: string | null = null;

/** Remote push was removed from Expo Go in SDK 53 — only load in dev/production builds. */
function canUsePushNotifications(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.appOwnership === 'expo') return false;
  if (Constants.executionEnvironment === 'storeClient') return false;
  return true;
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!canUsePushNotifications()) return null;
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    const mod = await import('expo-notifications');
    if (!handlerConfigured) {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
    notificationsModule = mod;
    return mod;
  } catch {
    notificationsModule = null;
    return null;
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerDiagnosePush(
  getIdToken: () => Promise<string | null>,
  uid?: string | null
): Promise<void> {
  if (uid && registeredForUid === uid) return;
  if (!canUsePushNotifications()) return;
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return;

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
    if (saved && uid) registeredForUid = uid;
  } catch {
    // Missing push credentials or unsupported runtime — non-fatal
  }
}

export function addNotificationResponseListener(
  handler: (data: { notificationId?: string; jobId?: string }) => void
) {
  if (!canUsePushNotifications()) return () => {};

  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  void loadNotifications().then((Notifications) => {
    if (cancelled || !Notifications) return;
    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        notificationId?: string;
        jobId?: string;
      };
      handler(data || {});
    });
  });

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}
