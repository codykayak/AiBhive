import { API_BASE } from '@/lib/config/apiBase';

export type UploadResult = {
  url: string;
  path: string;
};

/** Upload a base64 image to Pros media storage; returns a public HTTPS URL. */
export async function uploadProsImage(
  token: string,
  base64: string,
  mimeType = 'image/jpeg',
  folder = 'diagnose'
): Promise<UploadResult | null> {
  if (!API_BASE || !token || !base64) return null;
  try {
    const res = await fetch(`${API_BASE}/api/pros/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64, mimeType, folder }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string; path?: string };
    if (!data.url) return null;
    return { url: data.url, path: data.path || '' };
  } catch {
    return null;
  }
}
