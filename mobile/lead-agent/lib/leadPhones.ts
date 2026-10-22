import type { Lead } from './types';

export function leadPhoneList(lead: Pick<Lead, 'phone' | 'phones'>): string[] {
  if (Array.isArray(lead.phones) && lead.phones.length) return lead.phones;
  if (lead.phone) return [lead.phone];
  return [];
}

export function dialPhoneForLead(lead: Pick<Lead, 'phone' | 'phones' | 'dialPhoneIndex'>): string {
  const list = leadPhoneList(lead);
  if (!list.length) return lead.phone || '';
  const idx = Math.min(Math.max(0, lead.dialPhoneIndex ?? 0), list.length - 1);
  return list[idx];
}

export function googleMapsUrl(address: string) {
  const q = String(address || '').trim();
  if (!q) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function zillowUrl(address: string) {
  const q = String(address || '').trim();
  if (!q) return '';
  return `https://www.zillow.com/homes/${encodeURIComponent(q)}_rb/`;
}
