import type { DeskLead } from './employeePortalApi';

export function normalizePhoneList(primary: string, extra?: string[]): string[] {
  const raw = [primary, ...(extra || [])].map((p) => String(p || '').trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of raw) {
    const digits = p.replace(/\D/g, '');
    if (digits.length < 10) continue;
    const key = digits.length === 10 ? `1${digits}` : digits;
    if (seen.has(key)) continue;
    seen.add(key);
    let e164 = p.startsWith('+') ? p : digits.length === 10 ? `+1${digits}` : `+${digits}`;
    out.push(e164);
  }
  return out.slice(0, 8);
}

export function leadPhoneList(lead: Pick<DeskLead, 'phone' | 'phones'>): string[] {
  const list = Array.isArray(lead.phones) && lead.phones.length ? lead.phones : [];
  if (list.length) return list;
  if (lead.phone) return [lead.phone];
  return [];
}

export function dialPhoneForLead(lead: Pick<DeskLead, 'phone' | 'phones' | 'dialPhoneIndex'>): string {
  const list = leadPhoneList(lead);
  if (!list.length) return '';
  const idx = Math.min(Math.max(0, lead.dialPhoneIndex ?? 0), list.length - 1);
  return list[idx];
}

export function googleMapsSearchUrl(address: string) {
  const q = String(address || '').trim();
  if (!q) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function formatPhoneDisplay(e164: string) {
  const d = e164.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return e164;
}
