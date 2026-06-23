import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'aibhive_intel_use_hive_cloud';

export async function loadUseHiveCloudIntel(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v !== '0';
  } catch {
    return true;
  }
}

export async function saveUseHiveCloudIntel(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, enabled ? '1' : '0');
}
