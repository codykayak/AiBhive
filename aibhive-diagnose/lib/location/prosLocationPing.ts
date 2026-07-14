import { API_BASE } from '@/lib/config/apiBase';
/**
 * Periodic GPS ping for Pros — Diagnose will call this on an interval when tracking is enabled.
 * Location permissions and background tasks: follow-up in the mobile app.
 */


export type LocationPingPayload = {
  lat: number;
  lng: number;
  accuracyM?: number;
  heading?: number;
  speedMps?: number;
  onJobId?: string;
};

export async function pingProsLocation(token: string, payload: LocationPingPayload): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/api/pros/location/ping`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchProsTrackingSettings(token: string): Promise<{
  enabled: boolean;
  pingIntervalMinutes: number;
} | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/pros/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      settings?: { locationTrackingEnabled?: boolean; locationPingIntervalMinutes?: number };
    };
    return {
      enabled: Boolean(data.settings?.locationTrackingEnabled),
      pingIntervalMinutes: data.settings?.locationPingIntervalMinutes ?? 15,
    };
  } catch {
    return null;
  }
}
