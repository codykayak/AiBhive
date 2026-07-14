import { API_BASE } from '@/lib/config/apiBase';

export type PartRequestPayload = {
  partName: string;
  partNumber?: string;
  quantity?: number;
  brand?: string;
  equipmentModel?: string;
  notes?: string;
  jobId?: string;
  jobTitle?: string;
  packId?: string;
  diagnoseQuery?: string;
  requestedByName?: string;
  partUrl?: string;
};

export type PartSuggestResult = {
  partName: string;
  partNumber: string;
  brand: string;
  equipmentModel: string;
  notes: string;
  searchLinks: Array<{ label: string; query: string; googleUrl: string }>;
};

async function prosFetch(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data;
}

export async function suggestPart(
  token: string,
  payload: {
    userText: string;
    assistantReply?: string;
    packId?: string;
    partsHints?: string[];
    brand?: string;
  }
): Promise<PartSuggestResult> {
  return prosFetch(token, '/api/pros/parts/suggest', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<PartSuggestResult>;
}

export async function submitPartRequest(token: string, payload: PartRequestPayload) {
  return prosFetch(token, '/api/pros/parts/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type PartScanResult = {
  partName: string;
  partNumber: string;
  brand: string;
  equipmentModel: string;
  notes: string;
};

export async function scanPartLabel(
  token: string,
  payload: { base64: string; mimeType?: string }
): Promise<PartScanResult> {
  return prosFetch(token, '/api/pros/parts/scan-label', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<PartScanResult>;
}
