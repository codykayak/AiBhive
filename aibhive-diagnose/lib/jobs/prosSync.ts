import type { FieldJob } from './storage';
import { loadJobs, saveJobs, upsertJob } from './storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

/** Parse JSON error bodies from Pros API (`{"error":"..."}`). */
export function parseProsApiError(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'Request failed';
  try {
    const parsed = JSON.parse(trimmed) as { error?: string };
    if (parsed?.error) return parsed.error;
  } catch {
    /* plain text */
  }
  return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;
}

async function prosFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseProsApiError(text || `Pros API ${res.status}`));
  }
  return res.json();
}

function mapCloudJob(j: Record<string, unknown>): FieldJob {
  return {
    id: String(j.id),
    title: String(j.title || ''),
    address: String(j.address || ''),
    notes: String(j.notes || ''),
    packId:
      j.packId === 'electrical' || j.packId === 'property' || j.packId === 'pool'
        ? (j.packId as FieldJob['packId'])
        : 'pool',
    status: (j.status as FieldJob['status']) || 'queued',
    createdAt: Number(j.createdAt) || Date.now(),
    updatedAt: Number(j.updatedAt) || Date.now(),
    faultIds: Array.isArray(j.faultIds) ? (j.faultIds as string[]) : [],
    customerName: j.customerName ? String(j.customerName) : '',
    adminNotes: j.adminNotes ? String(j.adminNotes) : '',
    priority: (j.priority as FieldJob['priority']) || 'normal',
    assigneeUid: j.assigneeUid ? String(j.assigneeUid) : null,
    fieldNotes: Array.isArray(j.fieldNotes) ? (j.fieldNotes as FieldJob['fieldNotes']) : [],
    photos: Array.isArray(j.photos) ? (j.photos as FieldJob['photos']) : [],
    cloudSynced: true,
  };
}

/** Pull company jobs from Pros and merge into local storage. */
export async function syncJobsFromPros(token: string): Promise<FieldJob[]> {
  try {
    const data = await prosFetch('/api/pros/jobs', token);
    const cloud = (data.jobs || []).map(mapCloudJob);
    const local = await loadJobs();
    const byId = new Map(local.map((j) => [j.id, j]));
    for (const c of cloud) {
      const existing = byId.get(c.id);
      if (!existing || (c.updatedAt || 0) >= (existing.updatedAt || 0)) {
        byId.set(c.id, { ...existing, ...c, cloudSynced: true });
      }
    }
    const merged = Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    await saveJobs(merged);
    return merged;
  } catch (err) {
    console.warn('[prosSync] pull failed', err);
    return loadJobs();
  }
}

export async function pushJobNoteToPros(
  token: string,
  jobId: string,
  fieldNote: string
): Promise<FieldJob | null> {
  try {
    const data = await prosFetch(`/api/pros/jobs/${jobId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ fieldNote }),
    });
    const job = mapCloudJob(data.job);
    await upsertJob(job);
    return job;
  } catch (err) {
    console.warn('[prosSync] note push failed', err);
    return null;
  }
}

export async function pushJobPhotoToPros(
  token: string,
  jobId: string,
  photoUrl: string,
  caption?: string
): Promise<FieldJob | null> {
  try {
    const data = await prosFetch(`/api/pros/jobs/${jobId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ photoUrl, photoCaption: caption || '' }),
    });
    const job = mapCloudJob(data.job);
    await upsertJob(job);
    return job;
  } catch (err) {
    console.warn('[prosSync] photo push failed', err);
    return null;
  }
}

export async function pushJobStatusToPros(
  token: string,
  jobId: string,
  status: FieldJob['status']
): Promise<FieldJob | null> {
  try {
    const data = await prosFetch(`/api/pros/jobs/${jobId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const job = mapCloudJob(data.job);
    await upsertJob(job);
    return job;
  } catch (err) {
    console.warn('[prosSync] status push failed', err);
    return null;
  }
}

export async function joinProsCompany(
  token: string,
  inviteCode: string,
  displayName?: string
): Promise<{ companyId: string; role: string }> {
  return prosFetch('/api/pros/join', token, {
    method: 'POST',
    body: JSON.stringify({ inviteCode, displayName }),
  });
}
