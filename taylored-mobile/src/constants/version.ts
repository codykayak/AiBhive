import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.4.1';

/** Android integer build number from app.json (used for update checks). */
export const APP_VERSION_CODE =
  Platform.OS === 'android'
    ? (Constants.expoConfig?.android?.versionCode ??
      (Constants.manifest2?.extra?.expoClient as { android?: { versionCode?: number } } | undefined)
        ?.android?.versionCode)
    : undefined;

export const APP_BUILD = APP_VERSION;
