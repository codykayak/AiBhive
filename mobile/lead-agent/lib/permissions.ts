import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const needed = [
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ];
  const checks = await PermissionsAndroid.requestMultiple(needed);
  return needed.every((p) => checks[p] === PermissionsAndroid.RESULTS.GRANTED);
}
