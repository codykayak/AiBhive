import type { AssetId, GcStack, Quality } from './types';

export interface Market {
  id: string;
  name: string;
  /** Planning index versus a national direct-cost base. Not a licensed city cost index. */
  factor: number;
  note: string;
}

/** Spreads follow the shape of publicly summarized RLB Q3 2026 city ranges, normalized around 1.00. */
export const MARKETS: Market[] = [
  { id: 'national', name: 'United States blend', factor: 1, note: 'National planning base' },
  { id: 'sun-belt', name: 'Sun Belt blend', factor: 0.97, note: 'Dallas, Atlanta, Phoenix, Charlotte blend' },
  { id: 'houston', name: 'Houston', factor: 0.9, note: 'Below the national warehouse band' },
  { id: 'dallas', name: 'Dallas–Fort Worth', factor: 0.93, note: 'RLB warehouse band sits under coastal cities' },
  { id: 'atlanta', name: 'Atlanta', factor: 0.94, note: 'Garden and industrial costs run under the coasts' },
  { id: 'phoenix', name: 'Phoenix', factor: 0.97, note: 'Infill multifamily still prices under Seattle and Boston' },
  { id: 'austin', name: 'Austin', factor: 0.99, note: 'Office and multifamily mid-pack versus coastal bids' },
  { id: 'miami', name: 'Miami', factor: 1.06, note: 'Insurance and concrete push the index up' },
  { id: 'denver', name: 'Denver', factor: 1.1, note: 'Mountain labor and envelope premiums' },
  { id: 'portland', name: 'Portland', factor: 1.12, note: 'West Coast labor without Bay Area land' },
  { id: 'chicago', name: 'Chicago', factor: 1.16, note: 'Union structural and MEP premiums' },
  { id: 'dc', name: 'Washington, D.C.', factor: 1.15, note: 'Mid-Atlantic institutional costs' },
  { id: 'los-angeles', name: 'Los Angeles', factor: 1.2, note: 'High warehouse and multifamily bands' },
  { id: 'seattle', name: 'Seattle', factor: 1.26, note: 'RLB multifamily and office bands run hot' },
  { id: 'boston', name: 'Boston', factor: 1.3, note: 'Among the widest US hard-cost bands' },
  { id: 'san-francisco', name: 'San Francisco Bay', factor: 1.4, note: 'Labor, seismic, and logistics premiums' },
  { id: 'new-york', name: 'New York', factor: 1.48, note: 'Top of the RLB office and retail ranges' },
];

export function marketById(id: string): Market {
  return MARKETS.find((m) => m.id === id) ?? MARKETS[0];
}

export function qualityFactor(quality: Quality): number {
  if (quality === 'economy') return 0.9;
  if (quality === 'premium') return 1.16;
  return 1;
}

export interface AssetProfile {
  id: AssetId;
  label: string;
  /** National owner-hard dollars per SF for a new shell, planning midpoint. */
  groundLow: number;
  groundHigh: number;
  source: string;
}

/**
 * National hard-cost bands for context. They are planning ranges drawn from
 * publicly described 2026 guides (Terrapin Construction Group, June 2026;
 * city shape from RLB Q3 2026 summaries). They are not a substitute for a
 * contractor GMP or a licensed RSMeans takeoff.
 */
export const ASSETS: Record<AssetId, AssetProfile> = {
  logistics: {
    id: 'logistics',
    label: 'Logistics / distribution',
    groundLow: 55,
    groundHigh: 130,
    source: 'TCG 2026 warehouse shell $46–$108/SF and 3PL $55–$130/SF',
  },
  industrial: {
    id: 'industrial',
    label: 'Light industrial',
    groundLow: 95,
    groundHigh: 240,
    source: 'TCG 2026 light industrial / manufacturing $95–$240/SF',
  },
  office: {
    id: 'office',
    label: 'Office',
    groundLow: 200,
    groundHigh: 450,
    source: 'Public 2026 multi-story office bands, below trophy high-rise',
  },
  retail: {
    id: 'retail',
    label: 'Retail',
    groundLow: 110,
    groundHigh: 260,
    source: 'TCG 2026 strip-center shell $110–$260/SF',
  },
  'mixed-use': {
    id: 'mixed-use',
    label: 'Mixed-use podium',
    groundLow: 250,
    groundHigh: 520,
    source: 'RLB 2026 multifamily city bands, podium/tower above garden product',
  },
  multifamily: {
    id: 'multifamily',
    label: 'Multifamily',
    groundLow: 190,
    groundHigh: 450,
    source: 'RLB Q3 2026 apartment hard-cost ranges across US cities',
  },
  medical: {
    id: 'medical',
    label: 'Medical office',
    groundLow: 190,
    groundHigh: 432,
    source: 'TCG 2026 medical office $190–$432/SF; clinical TI runs hotter',
  },
};

export const GC_CORE: GcStack = {
  designContingency: 0.01,
  escalation: 0.025,
  generalConditions: 0.055,
  insurance: 0.011,
  bond: 0.007,
  overhead: 0.028,
  profit: 0.032,
  constructionContingency: 0.04,
};

export const GC_VALUE_ADD: GcStack = {
  designContingency: 0.02,
  escalation: 0.03,
  generalConditions: 0.065,
  insurance: 0.013,
  bond: 0.009,
  overhead: 0.03,
  profit: 0.04,
  constructionContingency: 0.05,
};

export const GC_GROUND_UP: GcStack = {
  designContingency: 0.04,
  escalation: 0.035,
  generalConditions: 0.07,
  insurance: 0.014,
  bond: 0.01,
  overhead: 0.035,
  profit: 0.04,
  constructionContingency: 0.07,
};

export const GC_TI: GcStack = {
  designContingency: 0.025,
  escalation: 0.03,
  generalConditions: 0.08,
  insurance: 0.012,
  bond: 0.006,
  overhead: 0.04,
  profit: 0.05,
  constructionContingency: 0.06,
};

/** Sequential markup: each percent applies to the running subtotal, matching the cost stack. */
export function stackMultiplier(gc: GcStack): number {
  const parts = [
    gc.designContingency,
    gc.escalation,
    gc.generalConditions,
    gc.insurance,
    gc.bond,
    gc.overhead,
    gc.profit,
    gc.constructionContingency,
  ];
  return parts.reduce((prod, pct) => prod * (1 + (Number.isFinite(pct) ? pct : 0)), 1);
}

export const SOURCE_NOTES = [
  'Terrapin Construction Group, commercial cost-per-square-foot guide, data described as of June 2026: warehouse, 3PL, medical office, hotel, retail shell, and TI ranges.',
  'Rider Levett Bucknall North America quarterly cost report, Q3 2026, as publicly summarized: city hard-cost bands for office, retail, warehouse, multifamily, and hotel. Location factors here are a planning index shaped by those spreads, not a reproduction of the tables.',
  'Terrapin construction-finance notes, September 2026: stabilized DSCR often 1.20x–1.30x (higher for hospitality), development yield-on-cost typically 150–250 bps over the exit cap, and soft costs often 15–30% of total project cost.',
  'Cash-on-cash is year-1 cash flow after reserves and debt service, divided by equity. Cap rate is NOI divided by price. Yield on cost is stabilized NOI divided by total project cost. DSCR is NOI divided by amortizing takeout debt service. Debt yield is NOI divided by the senior loan. IRR is the levered annual rate on equity cash flows plus sale proceeds.',
];
