import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import { APP_VERSION, APP_VERSION_CODE } from '../constants/version';
import { isNewerVersion } from './semver';

function isNativeUpdateAvailable(manifest: MobileReleaseManifest): boolean {
  const latestCode = manifest.versionCode;
  if (typeof latestCode === 'number' && typeof APP_VERSION_CODE === 'number') {
    if (latestCode !== APP_VERSION_CODE) return latestCode > APP_VERSION_CODE;
  }
  return isNewerVersion(manifest.shippedNativeVersion, APP_VERSION);
}

const HIVE_API_BASE = 'https://aibhive.com';
const OTA_PENDING_KEY = 'hive_ota_pending_v1';

/** Direct APK endpoint — never the .gz mirror. */
export const NATIVE_APK_DOWNLOAD_URL = `${HIVE_API_BASE}/api/download/apk`;

export type MobileReleaseManifest = {
  shippedNativeVersion: string;
  versionCode?: number;
  sourceVersion?: string;
  releaseNotes?: string;
  downloadUrl: string;
  fullApkUrl?: string;
  firebaseApkUrl?: string;
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

export type DownloadProgress = {
  totalBytes: number;
  downloadedBytes: number;
};

/** Pick a URL the Android package installer can use (never .gz). */
export function resolveNativeDownloadUrl(_manifest?: Partial<MobileReleaseManifest> | null): string {
  // Always prefer the direct API endpoint — streams a real .apk, never a redirect to .gz.
  return NATIVE_APK_DOWNLOAD_URL;
}

export async function fetchReleaseManifest(): Promise<MobileReleaseManifest | null> {
  try {
    const res = await fetch(`${HIVE_API_BASE}/api/mobile/releases`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
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
  if (isNativeUpdateAvailable(manifest)) {
    const url = resolveNativeDownloadUrl(manifest);
    return {
      status: 'native-available',
      latestVersion: latestNative,
      downloadUrl: url,
      releaseNotes: manifest.releaseNotes,
      message: `Version v${latestNative} is ready. Tap Download update below.`,
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

async function downloadApkToCache(
  url: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  const dest = new File(Paths.cache, 'aibhive-update.apk');
  const file = await File.downloadFileAsync(url, dest, {
    idempotent: true,
    onProgress: onProgress
      ? (p) => {
          if (p.totalBytes > 0) {
            onProgress({
              totalBytes: p.totalBytes,
              downloadedBytes: p.bytesWritten,
            });
          }
        }
      : undefined,
  });
  return file.uri;
}

async function promptInstallApk(localUri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri, {
      mimeType: 'application/vnd.android.package-archive',
      dialogTitle: 'Install AiBhive update',
    });
    return;
  }
  throw new Error('Install picker unavailable on this device.');
}

/**
 * Download and open the Android package installer.
 * Falls back to the system browser if in-app download fails.
 */
export async function downloadNativeUpdate(
  url?: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<'installed-prompt' | 'browser'> {
  const target = resolveNativeDownloadUrl(
    url ? { downloadUrl: url, fullApkUrl: url } : null
  );

  if (Platform.OS === 'android') {
    try {
      const localUri = await downloadApkToCache(target, onProgress);
      await promptInstallApk(localUri);
      return 'installed-prompt';
    } catch {
      // Browser fallback below
    }
  }

  await Linking.openURL(target);
  return 'browser';
}

/** @deprecated Use downloadNativeUpdate — kept for callers that only open a link. */
export async function openUpdateDownload(url: string): Promise<void> {
  await downloadNativeUpdate(url);
}
