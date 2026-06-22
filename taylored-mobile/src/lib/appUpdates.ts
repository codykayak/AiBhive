import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { APP_VERSION } from '../constants/version';
import { isNewerVersion } from './semver';

const HIVE_API_BASE = 'https://aibhive.com';
const OTA_PENDING_KEY = 'hive_ota_pending_v1';

export type MobileReleaseManifest = {
  shippedNativeVersion: string;
  versionCode?: number;
  sourceVersion?: string;
  releaseNotes?: string;
  downloadUrl: string;
  fullApkUrl?: string;
  firebaseGzUrl?: string;
  publishedAt?: string;
  otaChannel?: string;
};

export type UpdateCheckResult =
  | { status: 'current'; message: string }
  | { status: 'ota-pending'; message: string }
  | { status: 'native-available'; latestVersion: string; downloadUrl: string; releaseNotes?: string; message: string }
  | { status: 'offline'; message: string }
  | { status: 'error'; message: string };

export async function fetchReleaseManifest(): Promise<MobileReleaseManifest | null> {
  try {
    const res = await fetch(`${HIVE_API_BASE}/api/mobile/releases`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as MobileReleaseManifest;
  } catch {
    return null;
  }
}

export async function getOtaStatus(): Promise<{ enabled: boolean; pendingRestart: boolean; channel?: string }> {
  if (__DEV__) {
    return { enabled: false, pendingRestart: false };
  }
  try {
    const pending = (await AsyncStorage.getItem(OTA_PENDING_KEY)) === 'true';
    return {
      enabled: Updates.isEnabled,
      pendingRestart: pending,
      channel: Updates.channel ?? undefined,
    };
  } catch {
    return { enabled: false, pendingRestart: false };
  }
}

/**
 * Check for JS updates on launch. Downloads in background; applies on next cold start.
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
    // OTA not configured yet — native APK install still works
  }
}

export async function applyPendingOtaRestart(): Promise<boolean> {
  try {
    const pending = (await AsyncStorage.getItem(OTA_PENDING_KEY)) === 'true';
    if (!pending || !Updates.isEnabled) return false;
    await AsyncStorage.removeItem(OTA_PENDING_KEY);
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const ota = await getOtaStatus();
  if (ota.pendingRestart) {
    return {
      status: 'ota-pending',
      message: 'A small update downloaded. Close and reopen AiBhive to apply it.',
    };
  }

  const manifest = await fetchReleaseManifest();
  if (!manifest) {
    return {
      status: 'offline',
      message: 'Could not reach the update server. You are on v' + APP_VERSION + '.',
    };
  }

  const latestNative = manifest.shippedNativeVersion;
  if (isNewerVersion(latestNative, APP_VERSION)) {
    const url = manifest.firebaseGzUrl || manifest.downloadUrl;
    return {
      status: 'native-available',
      latestVersion: latestNative,
      downloadUrl: url,
      releaseNotes: manifest.releaseNotes,
      message: `Version v${latestNative} is ready. Download and install the new app package.`,
    };
  }

  if (ota.enabled && !__DEV__) {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await AsyncStorage.setItem(OTA_PENDING_KEY, 'true');
        return {
          status: 'ota-pending',
          message: 'Update downloaded. Close and reopen AiBhive to apply it.',
        };
      }
    } catch {
      // fall through to current
    }
  }

  return {
    status: 'current',
    message: `You are on the latest version (v${APP_VERSION}).`,
  };
}

export async function openUpdateDownload(url: string): Promise<void> {
  const can = await Linking.canOpenURL(url);
  if (!can) throw new Error('Cannot open download link on this device.');
  await Linking.openURL(url);
}
