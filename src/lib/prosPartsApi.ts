import type { User } from 'firebase/auth';
import { prosJson } from './prosApi';

export type ProsPartRequestStatus = 'pending_approval' | 'approved' | 'ordered' | 'declined';

export type ProsPartRequest = {
  id: string;
  status: ProsPartRequestStatus;
  partName: string;
  partNumber: string;
  quantity: number;
  brand: string;
  equipmentModel: string;
  notes: string;
  jobId: string | null;
  jobTitle: string | null;
  packId: string;
  diagnoseQuery: string;
  requestedByUid: string | null;
  requestedByName: string;
  requestedByEmail: string | null;
  approvedByName: string | null;
  orderedByName: string | null;
  declineReason: string | null;
  supplierNote: string | null;
  partUrl: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  approvedAt: number | null;
  orderedAt: number | null;
};

export type PartSuggestResult = {
  partName: string;
  partNumber: string;
  brand: string;
  equipmentModel: string;
  notes: string;
  searchLinks: Array<{ label: string; query: string; googleUrl: string }>;
};

export async function prosListPartRequests(user: User, status = 'pending_approval') {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return prosJson<{ requests: ProsPartRequest[] }>(`/api/pros/parts/requests${q}`, user);
}

export async function prosCreatePartRequest(
  user: User,
  payload: {
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
  }
) {
  return prosJson<{ request: ProsPartRequest }>('/api/pros/parts/requests', user, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function prosUpdatePartRequest(
  user: User,
  id: string,
  payload: { status: ProsPartRequestStatus; declineReason?: string; supplierNote?: string }
) {
  return prosJson<{ request: ProsPartRequest }>(`/api/pros/parts/requests/${id}`, user, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function prosSuggestPart(
  user: User,
  payload: {
    userText: string;
    assistantReply?: string;
    packId?: string;
    partsHints?: string[];
  }
) {
  return prosJson<PartSuggestResult>('/api/pros/parts/suggest', user, {
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

export async function prosScanPartLabel(
  user: User,
  payload: { base64: string; mimeType?: string }
) {
  return prosJson<PartScanResult>('/api/pros/parts/scan-label', user, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
