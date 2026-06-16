import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
