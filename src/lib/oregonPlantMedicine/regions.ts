/** Supported states and sub-regions in the Living Knowledge plant library. */

import type { RegionFilter } from './regionCatalog';
import { regionFilterLabel } from './regionCatalog';

export type OregonSubRegion = 'eugene' | 'florence' | 'all';

export type SupportedStateId = 'oregon' | 'northern-california';

export type UserLocation = {
  city: string;
  state: string;
  stateId: SupportedStateId | null;
  /** Best-matching library region filter for this user. */
  subRegion: RegionFilter;
  /** @deprecated use subRegion */
  oregonRegion: OregonSubRegion;
};

const STATE_ALIASES: Record<string, { name: string; id: SupportedStateId | null }> = {
  or: { name: 'Oregon', id: 'oregon' },
  oregon: { name: 'Oregon', id: 'oregon' },
  ca: { name: 'California', id: 'northern-california' },
  california: { name: 'California', id: 'northern-california' },
  'northern california': { name: 'Northern California', id: 'northern-california' },
  'norcal': { name: 'Northern California', id: 'northern-california' },
  wa: { name: 'Washington', id: null },
  washington: { name: 'Washington', id: null },
  id: { name: 'Idaho', id: null },
  idaho: { name: 'Idaho', id: null },
};

const WILLAMETTE_CITIES = new Set([
  'eugene', 'springfield', 'coburg', 'veneta', 'cottage grove', 'junction city', 'harrisburg',
  'corvallis', 'albany', 'oakridge', 'westfir', 'salem', 'portland', 'beaverton', 'hillsboro',
  'oregon city', 'mcminnville', 'newberg',
]);

const COAST_CITIES = new Set([
  'florence', 'mapleton', 'yachats', 'waldport', 'reedsport', 'coos bay', 'north bend', 'bandon',
  'gold beach', 'port orford', 'newport', 'lincoln city', 'seaside', 'astoria', 'tillamook',
]);

const CASCADE_CITIES = new Set([
  'bend', 'sisters', 'sunriver', 'la pine', 'madras', 'redmond', 'sisters', 'mckenzie bridge',
  'oakridge', 'crescent', 'chemult',
]);

const KLAMATH_CITIES = new Set([
  'klamath falls', 'silver lake', 'summer lake', 'lakeview', 'paisley', 'beatty', 'bonanza',
  'chiloquin', 'fort rock',
]);

const ROGUE_CITIES = new Set([
  'medford', 'ashland', 'grants pass', 'jacksonville', 'talent', 'phoenix', 'roseburg',
  'canyonville', 'glide',
]);

const EAST_OR_CITIES = new Set([
  'burns', 'ontario', 'john day', 'prineville', 'pendleton', 'la grande', 'enterprise', 'baker city',
]);

const SIERRA_FOOTHILLS_CITIES = new Set([
  'placerville', 'auburn', 'grass valley', 'nevada city', 'colfax', 'pollock pines', 'camino',
  'georgetown', 'volcano', 'pioneer', 'murphys', 'angels camp', 'sonora', 'jamestown',
]);

const SILVER_LAKE_CA_CITIES = new Set([
  'silver lake', 'alturas', 'likely', 'susanville', 'bieber', 'adin', 'tulelake', 'davis creek',
  'eagle lake', 'canby', 'cedarville',
]);

const SACRAMENTO_CITIES = new Set([
  'sacramento', 'chico', 'redding', 'woodland', 'davis', 'oroville', 'yuba city', 'marysville',
  'paradise', 'magalia',
]);

const SHASTA_CITIES = new Set([
  'mt shasta', 'mount shasta', 'weaverville', 'yreka', 'dunsmuir', 'mount shasta', 'mccloud',
  'etna', 'fort jones',
]);

const NORTH_COAST_CA_CITIES = new Set([
  'eureka', 'arcata', 'mckinleyville', 'fort bragg', 'mendocino', 'crescent city', 'trinidad',
  'willits', 'ukiah',
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
  const sub = resolveSubRegion(city, 'oregon');
  if (sub === 'or-willamette' || sub === 'eugene') return 'eugene';
  if (sub === 'or-coast' || sub === 'florence') return 'florence';
  return 'all';
}

export function resolveSubRegion(city: string, stateId: SupportedStateId | null): RegionFilter {
  const c = city.trim().toLowerCase();
  if (!stateId) return 'all';

  if (stateId === 'oregon') {
    if (WILLAMETTE_CITIES.has(c)) return 'or-willamette';
    if (COAST_CITIES.has(c)) return 'or-coast';
    if (CASCADE_CITIES.has(c)) return 'or-cascades';
    if (KLAMATH_CITIES.has(c)) return 'or-klamath';
    if (ROGUE_CITIES.has(c)) return 'or-rogue';
    if (EAST_OR_CITIES.has(c)) return 'or-east';
    if (/\b(coast|beach|ocean|dunes)\b/.test(c)) return 'or-coast';
    if (/\b(valley|willamette|eugene)\b/.test(c)) return 'or-willamette';
    if (/\b(desert|burns|sage)\b/.test(c)) return 'or-east';
    return 'or-all';
  }

  if (stateId === 'northern-california') {
    if (SIERRA_FOOTHILLS_CITIES.has(c)) return 'ca-sierra-foothills';
    if (SILVER_LAKE_CA_CITIES.has(c)) return 'ca-silver-lake';
    if (SACRAMENTO_CITIES.has(c)) return 'ca-sacramento';
    if (SHASTA_CITIES.has(c)) return 'ca-shasta';
    if (NORTH_COAST_CA_CITIES.has(c)) return 'ca-north-coast';
    if (/\b(placerville|gold country|foothill)\b/.test(c)) return 'ca-sierra-foothills';
    if (/\b(silver lake|modoc|lassen)\b/.test(c)) return 'ca-silver-lake';
    return 'ca-all';
  }

  return 'all';
}

export function parseUserLocation(city: string, stateInput: string): UserLocation {
  const { displayName, stateId } = normalizeStateInput(stateInput);
  const subRegion = resolveSubRegion(city, stateId);
  const oregonRegion = stateId === 'oregon' ? resolveOregonSubRegion(city) : 'all';
  return {
    city: city.trim(),
    state: displayName,
    stateId,
    subRegion,
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

export function subRegionLabel(filter: RegionFilter): string {
  if (filter === 'all') return 'All regions';
  return regionFilterLabel(filter);
}

export function isSupportedLocation(loc: UserLocation): boolean {
  return loc.stateId === 'oregon' || loc.stateId === 'northern-california';
}
