import { DEFAULT_BUSINESSES } from './defaults';
import { getApiBase, getAuthToken, getDeviceSecret, getDeviceUid, setDeviceSecret, setDeviceUid } from './storage';
import { BUILTIN_DEVICE_SECRET, BUILTIN_OWNER_UID } from './builtinAccess';
import type { Business, Lead } from './types';

async function leadAgentHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let secret = await getDeviceSecret();
  if (!secret) {
    secret = BUILTIN_DEVICE_SECRET;
    await setDeviceSecret(secret);
  }
  headers['X-Lead-Agent-Secret'] = secret;
  let uid = await getDeviceUid();
  if (!uid) {
    uid = BUILTIN_OWNER_UID;
    await setDeviceUid(uid);
  }
  headers['X-Lead-Agent-Uid'] = uid;
  return headers;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const base = await getApiBase();
  const headers = await leadAgentHeaders(init.headers as Record<string, string>);
  const res = await fetch(`${base}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function checkLeadAgentHealth() {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/lead-agent/health`);
  return res.json().catch(() => ({ ok: false }));
}

export async function fetchDefaults() {
  try {
    return await apiFetch('/api/lead-agent/defaults');
  } catch {
    return { businesses: DEFAULT_BUSINESSES };
  }
}

export async function syncBusinesses() {
  try {
    return await apiFetch('/api/lead-agent/businesses');
  } catch {
    return { businesses: DEFAULT_BUSINESSES };
  }
}

export async function saveBusiness(businessId: string, patch: Partial<Business>) {
  return apiFetch(`/api/lead-agent/businesses/${businessId}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export async function postInbound(businessId: string, from: string, body: string, leadId?: string) {
  return apiFetch(`/api/lead-agent/businesses/${businessId}/inbound`, {
    method: 'POST',
    body: JSON.stringify({ from, body, leadId }),
  });
}

export async function sendLeadSms(businessId: string, leadId: string, body?: string) {
  return apiFetch(`/api/lead-agent/businesses/${businessId}/leads/${leadId}/send`, {
    method: 'POST',
    body: JSON.stringify(body ? { body } : {}),
  });
}

export async function reportDeviceSent(
  businessId: string,
  leadId: string,
  to: string,
  body: string,
  automated = true,
) {
  return apiFetch(`/api/lead-agent/businesses/${businessId}/device-sent`, {
    method: 'POST',
    body: JSON.stringify({ leadId, to, body, automated }),
  });
}

export async function importLeadsBulk(businessId: string, leads: Lead[]) {
  return apiFetch(`/api/lead-agent/businesses/${businessId}/leads/import`, {
    method: 'POST',
    body: JSON.stringify({ leads }),
  });
}

export async function refreshBusinessRag(businessId: string) {
  return apiFetch(`/api/lead-agent/device/refresh-rag/${businessId}`, { method: 'POST' });
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return digits ? `+${digits}` : phone;
}

export function formatPhoneDisplay(phone: string) {
  const d = phone.replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return phone;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export type { Business, Lead };
