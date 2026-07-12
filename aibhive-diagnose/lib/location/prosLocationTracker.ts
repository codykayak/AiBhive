import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { pingProsLocation, fetchProsTrackingSettings } from '@/lib/location/prosLocationPing';

let intervalId: ReturnType<typeof setInterval> | null = null;
let currentJobId: string | null = null;

async function sendPing(getIdToken: () => Promise<string | null>) {
  if (Platform.OS === 'web') return;
  const token = await getIdToken();
  if (!token) return;

  const settings = await fetchProsTrackingSettings(token);
  if (!settings?.enabled) return;

  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return;

  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await pingProsLocation(token, {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracyM: pos.coords.accuracy ?? undefined,
      heading: pos.coords.heading ?? undefined,
      speedMps: pos.coords.speed ?? undefined,
      onJobId: currentJobId || undefined,
    });
  } catch {
    // GPS unavailable — skip this cycle
  }
}

export function setProsLocationJobContext(jobId: string | null) {
  currentJobId = jobId;
}

export function startProsLocationTracker(getIdToken: () => Promise<string | null>) {
  if (Platform.OS === 'web') return () => {};

  const tick = () => void sendPing(getIdToken);

  const schedule = async () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    const token = await getIdToken();
    if (!token) return;
    const settings = await fetchProsTrackingSettings(token);
    if (!settings?.enabled) return;

    const mins = Math.max(5, settings.pingIntervalMinutes || 15);
    void tick();
    intervalId = setInterval(tick, mins * 60 * 1000);
  };

  void schedule();

  const appSub = AppState.addEventListener('change', (state) => {
    if (state === 'active') void schedule();
  });

  return () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    appSub.remove();
  };
}

export async function requestLocationPermissionIfTracking(
  getIdToken: () => Promise<string | null>
): Promise<void> {
  if (Platform.OS === 'web') return;
  const token = await getIdToken();
  if (!token) return;
  const settings = await fetchProsTrackingSettings(token);
  if (!settings?.enabled) return;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;
}
