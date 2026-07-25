/** True when loaded inside the AiBhivePlants Android WebView shell. */
export function isPlantsMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('mobile') === '1') return true;
  return /AiBhivePlants\/[\d.]+ Android/i.test(navigator.userAgent);
}
