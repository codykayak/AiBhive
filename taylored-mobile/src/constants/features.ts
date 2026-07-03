/**
 * Google sign-in for Hive sync + credits.
 * Enabled when EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true or a real web client ID is configured.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export const GOOGLE_AUTH_ENABLED =
  process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' ||
  (WEB_CLIENT_ID.length > 0 && !WEB_CLIENT_ID.includes('PLACEHOLDER'));
