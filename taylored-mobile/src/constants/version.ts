import Constants from 'expo-constants';

export const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.4.0';

export const APP_BUILD = APP_VERSION;
