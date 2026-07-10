export type ChemTarget = {
  name: string;
  min: number;
  max: number;
  unit: string;
  tip: string;
};

export const POOL_CHEM_TARGETS: ChemTarget[] = [
  { name: 'Free Chlorine (FC)', min: 3, max: 5, unit: 'ppm', tip: 'Keep higher with higher CYA; SWG often 3–5.' },
  { name: 'pH', min: 7.2, max: 7.6, unit: '', tip: '7.4–7.6 is the sweet spot for comfort + effectiveness.' },
  { name: 'Total Alkalinity', min: 70, max: 90, unit: 'ppm', tip: '80 is a solid target for most plaster/SWG setups.' },
  { name: 'Cyanuric Acid', min: 30, max: 50, unit: 'ppm', tip: 'SWG often 30–50; very high CYA kills FC efficiency.' },
  { name: 'Calcium Hardness', min: 250, max: 350, unit: 'ppm', tip: 'Protects plaster; too high = scale.' },
  { name: 'Salt (SWG)', min: 3000, max: 3500, unit: 'ppm', tip: 'Follow cell brand — many like ~3200–3400.' },
];

/** Rough muriatic acid (31.45%) ounces to lower pH in a given volume — rule-of-thumb only. */
export function estimateAcidOz(gallons: number, currentPh: number, targetPh: number): number {
  if (targetPh >= currentPh) return 0;
  const delta = currentPh - targetPh;
  // Very rough field heuristic: ~12 oz per 10k gal per 0.2 pH (varies wildly with TA).
  return Math.round((gallons / 10000) * (delta / 0.2) * 12);
}

/** Rough liquid chlorine (12.5%) ounces to raise FC by delta ppm. */
export function estimateLiquidChlorineOz(gallons: number, deltaPpm: number): number {
  if (deltaPpm <= 0) return 0;
  // ~10.7 oz of 12.5% per 10k gal per 1 ppm FC
  return Math.round((gallons / 10000) * deltaPpm * 10.7);
}

/** Rough salt lbs to raise ppm. */
export function estimateSaltLbs(gallons: number, deltaPpm: number): number {
  if (deltaPpm <= 0) return 0;
  // ~0.83 lb per 1k gal per 100 ppm → 8.3 lb / 10k / 100 ppm
  return Math.round((gallons / 10000) * (deltaPpm / 100) * 8.3);
}

export function slamFcTarget(cya: number): number {
  // Simplified SLAM FC ≈ roughly 40% of CYA as a field mnemonic (verify with current TFP/chem guidance).
  return Math.max(12, Math.round(cya * 0.4));
}
