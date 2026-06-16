import * as Updates from 'expo-updates';

/** Check for JS bundle updates on launch (requires EAS Update linked to the APK). */
export async function checkForOtaUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // OTA not configured yet — safe to ignore until EAS project is linked
  }
}
