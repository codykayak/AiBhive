import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OTA_PENDING_KEY = 'hive_ota_pending_v1';

/**
 * Check for JS updates on launch. Downloads in background; applies on next
 * cold start so reopening feels stable instead of an instant full reload.
 */
export async function checkForOtaUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;

  try {
    const pending = await AsyncStorage.getItem(OTA_PENDING_KEY);
    if (pending === 'true') {
      await AsyncStorage.removeItem(OTA_PENDING_KEY);
      await Updates.reloadAsync();
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await AsyncStorage.setItem(OTA_PENDING_KEY, 'true');
    }
  } catch {
    // OTA not configured yet
  }
}
