import type { PlantEntry, PlantRegion } from './types';

/** UI + filter values for browsing the library by geography. */
export type RegionFilter =
  | 'all'
  | 'or-all'
  | 'ca-all'
  | 'wa-all'
  | PlantRegion;

export const REGION_FILTER_OPTIONS: {
  value: RegionFilter;
  label: string;
  group: 'all' | 'oregon' | 'norcal' | 'washington';
}[] = [
  { value: 'all', label: 'All regions', group: 'all' },
  { value: 'or-all', label: 'Oregon — statewide', group: 'oregon' },
  { value: 'or-willamette', label: 'Oregon — Willamette Valley', group: 'oregon' },
  { value: 'or-coast', label: 'Oregon — Coast', group: 'oregon' },
  { value: 'or-portland', label: 'Oregon — Portland & Gorge', group: 'oregon' },
  { value: 'or-cascades', label: 'Oregon — Cascades & Bend', group: 'oregon' },
  { value: 'or-klamath', label: 'Oregon — Klamath & Silver Lake', group: 'oregon' },
  { value: 'or-rogue', label: 'Oregon — Rogue & Umpqua', group: 'oregon' },
  { value: 'or-east', label: 'Oregon — High desert & east', group: 'oregon' },
  { value: 'ca-all', label: 'Northern California — statewide', group: 'norcal' },
  { value: 'ca-sierra-foothills', label: 'NorCal — Sierra foothills (Placerville)', group: 'norcal' },
  { value: 'ca-silver-lake', label: 'NorCal — Silver Lake & Modoc', group: 'norcal' },
  { value: 'ca-sacramento', label: 'NorCal — Sacramento Valley', group: 'norcal' },
  { value: 'ca-shasta', label: 'NorCal — Shasta & Siskiyou', group: 'norcal' },
  { value: 'ca-north-coast', label: 'NorCal — North Coast', group: 'norcal' },
  { value: 'wa-all', label: 'Washington — statewide', group: 'washington' },
  { value: 'wa-puget-sound', label: 'Washington — Puget Sound', group: 'washington' },
  { value: 'wa-olympic-coast', label: 'Washington — Olympic Coast', group: 'washington' },
  { value: 'wa-cascades', label: 'Washington — Cascades', group: 'washington' },
  { value: 'wa-eastern', label: 'Washington — Eastern & Palouse', group: 'washington' },
];

const OREGON_REGIONS = new Set<PlantRegion>([
  'or-willamette',
  'or-coast',
  'or-portland',
  'or-cascades',
  'or-klamath',
  'or-rogue',
  'or-east',
  'eugene',
  'florence',
  'both',
]);

const NORCAL_REGIONS = new Set<PlantRegion>([
  'ca-sierra-foothills',
  'ca-silver-lake',
  'ca-sacramento',
  'ca-shasta',
  'ca-north-coast',
]);

const WASHINGTON_REGIONS = new Set<PlantRegion>([
  'wa-puget-sound',
  'wa-olympic-coast',
  'wa-cascades',
  'wa-eastern',
]);

/** Legacy region tags that imply coverage of multiple OR sub-regions. */
const LEGACY_OR_WIDE: PlantRegion[] = ['both', 'eugene', 'florence'];

/** Western Oregon coverage implied by legacy `both` tag in curated entries. */
export const WESTERN_OREGON_REGIONS: PlantRegion[] = [
  'or-willamette',
  'or-coast',
  'or-portland',
  'or-cascades',
  'or-rogue',
  'or-klamath',
];

/** Per-plant region overrides for habitat-accurate filtering after legacy migration. */
const REGION_OVERRIDES: Record<string, PlantRegion[]> = {
  'psilocybe-azurescens': ['or-coast', 'or-portland', 'ca-north-coast'],
  'psilocybe-semilanceata': ['or-willamette', 'or-coast', 'or-portland', 'or-cascades', 'or-rogue'],
  'psilocybe-cyanescens': ['or-willamette', 'or-portland', 'or-coast', 'or-cascades'],
  'psilocybe-allenii': ['or-coast', 'or-portland', 'ca-north-coast'],
  'psilocybe-stuntzii': ['or-willamette', 'or-portland', 'or-cascades'],
  'psilocybe-baeocystis': ['or-willamette', 'or-coast', 'or-portland', 'or-cascades'],
  'gymnopilus-spectabilis': ['or-willamette', 'or-coast', 'or-cascades', 'or-rogue', 'ca-shasta'],
  'amanita-muscaria': ['or-willamette', 'or-coast', 'or-cascades', 'or-rogue', 'ca-shasta', 'ca-north-coast'],
  'amanita-pantherina': ['or-willamette', 'or-coast', 'or-cascades', 'or-rogue', 'ca-shasta'],
  'panaeolus-cinctulus': ['or-willamette', 'or-portland', 'or-coast'],
  'datura-stramonium': ['or-willamette', 'or-east', 'ca-sacramento', 'ca-sierra-foothills'],
};

function plantInWashington(plant: PlantEntry): boolean {
  return plant.regions.some((r) => WASHINGTON_REGIONS.has(r));
}

function appendWashingtonRegions(regions: PlantRegion[]): PlantRegion[] {
  const out = new Set(regions);
  const hasORCoast = regions.some((r) => r === 'or-coast' || r === 'florence' || r === 'both');
  const hasORPortland = regions.includes('or-portland');
  const hasORCascades = regions.includes('or-cascades');
  const hasORWillamette = regions.some((r) => r === 'or-willamette' || r === 'eugene');
  const hasOREast = regions.includes('or-east');
  const hasNorCalCoast = regions.includes('ca-north-coast');

  if (hasORCoast || hasORPortland || hasNorCalCoast) {
    out.add('wa-olympic-coast');
    out.add('wa-puget-sound');
  }
  if (hasORCascades || regions.includes('or-klamath')) out.add('wa-cascades');
  if (hasORWillamette || hasORPortland || regions.includes('or-rogue')) out.add('wa-puget-sound');
  if (hasOREast) out.add('wa-eastern');
  return [...out];
}

/** Expand legacy Eugene / Florence / both tags into modern region filters. */
export function normalizePlantRegions(regions: PlantRegion[], plantId?: string): PlantRegion[] {
  if (plantId && REGION_OVERRIDES[plantId]) {
    return appendWashingtonRegions([...REGION_OVERRIDES[plantId]]);
  }
  const out = new Set<PlantRegion>();
  for (const r of regions) {
    if (r === 'eugene') out.add('or-willamette');
    else if (r === 'florence') out.add('or-coast');
    else if (r === 'both') WESTERN_OREGON_REGIONS.forEach((x) => out.add(x));
    else out.add(r);
  }
  return appendWashingtonRegions([...out]);
}

function plantInOregon(plant: PlantEntry): boolean {
  return plant.regions.some((r) => OREGON_REGIONS.has(r));
}

function plantInNorcal(plant: PlantEntry): boolean {
  return plant.regions.some((r) => NORCAL_REGIONS.has(r));
}

/** Human label for a single plant region tag (badges on cards). */
export function regionLabel(r: PlantRegion): string {
  const labels: Record<PlantRegion, string> = {
    'or-willamette': 'Willamette Valley',
    'or-coast': 'Oregon Coast',
    'or-portland': 'Portland & Gorge',
    'or-cascades': 'Oregon Cascades',
    'or-klamath': 'Klamath & Silver Lake',
    'or-rogue': 'Rogue & Umpqua',
    'or-east': 'Eastern Oregon',
    'ca-sierra-foothills': 'Sierra Foothills',
    'ca-silver-lake': 'Silver Lake & Modoc',
    'ca-sacramento': 'Sacramento Valley',
    'ca-shasta': 'Shasta & Siskiyou',
    'ca-north-coast': 'North Coast CA',
    'wa-puget-sound': 'Puget Sound',
    'wa-olympic-coast': 'Olympic Coast',
    'wa-cascades': 'Washington Cascades',
    'wa-eastern': 'Eastern Washington',
    eugene: 'Willamette Valley',
    florence: 'Oregon Coast',
    both: 'Oregon wide',
  };
  return labels[r] ?? r;
}

export function regionFilterLabel(filter: RegionFilter): string {
  return REGION_FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? filter;
}

export function matchesRegion(plant: PlantEntry, filter: RegionFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'or-all') return plantInOregon(plant);
  if (filter === 'ca-all') return plantInNorcal(plant);
  if (filter === 'wa-all') return plantInWashington(plant);

  if (filter === 'wa-puget-sound') return plant.regions.includes('wa-puget-sound');
  if (filter === 'wa-olympic-coast') return plant.regions.includes('wa-olympic-coast');
  if (filter === 'wa-cascades') return plant.regions.includes('wa-cascades');
  if (filter === 'wa-eastern') return plant.regions.includes('wa-eastern');

  if (filter === 'or-willamette') {
    return plant.regions.some((r) => r === 'or-willamette' || r === 'eugene' || r === 'both');
  }
  if (filter === 'or-coast') {
    return plant.regions.some((r) => r === 'or-coast' || r === 'florence' || r === 'both');
  }
  if (filter === 'or-portland') {
    return plant.regions.includes('or-portland') || plant.regions.includes('both');
  }
  if (filter === 'or-cascades') {
    return plant.regions.includes('or-cascades');
  }
  if (filter === 'or-klamath') {
    return plant.regions.includes('or-klamath');
  }
  if (filter === 'or-rogue') {
    return plant.regions.includes('or-rogue');
  }
  if (filter === 'or-east') {
    return plant.regions.includes('or-east');
  }

  // Legacy filters still used when syncing user location
  if (filter === 'eugene') {
    return plant.regions.some((r) => r === 'eugene' || r === 'or-willamette' || r === 'both');
  }
  if (filter === 'florence') {
    return plant.regions.some((r) => r === 'florence' || r === 'or-coast' || r === 'both');
  }
  if (filter === 'both') {
    return plant.regions.includes('both');
  }

  return plant.regions.includes(filter);
}

export function isOregonRegion(filter: RegionFilter): boolean {
  return filter === 'or-all' || filter.startsWith('or-') || filter === 'eugene' || filter === 'florence' || filter === 'both';
}

export function isNorcalRegion(filter: RegionFilter): boolean {
  return filter === 'ca-all' || filter.startsWith('ca-');
}

export function isWashingtonRegion(filter: RegionFilter): boolean {
  return filter === 'wa-all' || filter.startsWith('wa-');
}

export { LEGACY_OR_WIDE, OREGON_REGIONS, NORCAL_REGIONS, WASHINGTON_REGIONS };
