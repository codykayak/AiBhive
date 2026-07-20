/** Supported states and sub-regions in the Living Knowledge plant library. */

export type OregonSubRegion = 'eugene' | 'florence' | 'all';

export type SupportedStateId = 'oregon';

export type UserLocation = {
  city: string;
  state: string;
  stateId: SupportedStateId | null;
  oregonRegion: OregonSubRegion;
};

const STATE_ALIASES: Record<string, { name: string; id: SupportedStateId | null }> = {
  or: { name: 'Oregon', id: 'oregon' },
  oregon: { name: 'Oregon', id: 'oregon' },
  wa: { name: 'Washington', id: null },
  washington: { name: 'Washington', id: null },
  ca: { name: 'California', id: null },
  california: { name: 'California', id: null },
  id: { name: 'Idaho', id: null },
  idaho: { name: 'Idaho', id: null },
};

const EUGENE_CITIES = new Set([
  'eugene',
  'springfield',
  'coburg',
  'veneta',
  'cottage grove',
  'junction city',
  'harrisburg',
  'corvallis',
  'albany',
  'oakridge',
  'westfir',
]);

const FLORENCE_CITIES = new Set([
  'florence',
  'mapleton',
  'yachats',
  'waldport',
  'reedsport',
  'coos bay',
  'north bend',
  'bandon',
  'gold beach',
  'port orford',
]);

export function normalizeStateInput(raw: string): { displayName: string; stateId: SupportedStateId | null } {
  const key = raw.trim().toLowerCase().replace(/\./g, '');
  if (!key) return { displayName: '', stateId: null };
  const hit = STATE_ALIASES[key];
  if (hit) return { displayName: hit.name, stateId: hit.id };
  const title = raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return { displayName: title, stateId: null };
}

export function resolveOregonSubRegion(city: string): OregonSubRegion {
  const c = city.trim().toLowerCase();
  if (!c) return 'all';
  if (EUGENE_CITIES.has(c)) return 'eugene';
  if (FLORENCE_CITIES.has(c)) return 'florence';
  if (/\b(coast|beach|ocean|dunes)\b/.test(c)) return 'florence';
  if (/\b(valley|willamette|eugene)\b/.test(c)) return 'eugene';
  return 'all';
}

export function parseUserLocation(city: string, stateInput: string): UserLocation {
  const { displayName, stateId } = normalizeStateInput(stateInput);
  const oregonRegion = stateId === 'oregon' ? resolveOregonSubRegion(city) : 'all';
  return {
    city: city.trim(),
    state: displayName,
    stateId,
    oregonRegion,
  };
}

export function locationLabel(loc: UserLocation): string {
  if (loc.city && loc.state) return `${loc.city}, ${loc.state}`;
  if (loc.state) return loc.state;
  return 'Your region';
}

export function oregonRegionLabel(region: OregonSubRegion): string {
  if (region === 'eugene') return 'Eugene / Willamette Valley';
  if (region === 'florence') return 'Florence / Oregon Coast';
  return 'All Oregon regions';
}

export function isSupportedLocation(loc: UserLocation): boolean {
  return loc.stateId === 'oregon';
}
