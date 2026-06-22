/**
 * Google sign-in for Hive sync + credits.
 * Set EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true at build time when OAuth client IDs are ready.
 * Sideload beta builds keep this false until Play Console SHA-1 + Firebase are wired.
 */
export const GOOGLE_AUTH_ENABLED =
  process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
