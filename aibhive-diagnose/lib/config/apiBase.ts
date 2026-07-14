/**
 * Single source of truth for Pros / Diagnose API host.
 * Must default to production so APKs still reach Pros AI even if
 * EXPO_PUBLIC_API_URL was omitted at build time (login already did this;
 * diagnose / tips / uploads must match).
 */
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_PROS_API_URL ||
  'https://aibhive.com'
).replace(/\/$/, '');
