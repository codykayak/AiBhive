import Constants from 'expo-constants';

export const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.0.4';

export const APP_BUILD = APP_VERSION;
