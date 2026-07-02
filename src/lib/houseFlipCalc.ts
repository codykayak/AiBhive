export type FlipInputs = {
  label: string;
  purchasePrice: number;
  arv: number;
  rehabBudget: number;
  holdingMonths: number;
  holdingCostPerMonth: number;
  buyClosingPct: number;
  sellClosingPct: number;
};

export type FlipDeal = FlipInputs & {
  id: string;
  savedAt: string;
};

export const FLIP_PRESETS: { id: string; label: string; rehab: number; holding: number }[] = [
  { id: 'cosmetic', label: 'Cosmetic', rehab: 25000, holding: 3 },
  { id: 'standard', label: 'Standard', rehab: 55000, holding: 5 },
  { id: 'heavy', label: 'Heavy', rehab: 95000, holding: 7 },
];

export const DEFAULT_FLIP: FlipInputs = {
  label: 'Oak Street flip',
  purchasePrice: 185000,
  arv: 295000,
  rehabBudget: 45000,
  holdingMonths: 4,
  holdingCostPerMonth: 2200,
  buyClosingPct: 2.5,
  sellClosingPct: 7,
};

const STORAGE_KEY = 'aibhive_house_flip_deals_v1';

export function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function buyClosingCost(inputs: FlipInputs): number {
  return inputs.purchasePrice * (inputs.buyClosingPct / 100);
}

export function sellClosingCost(inputs: FlipInputs): number {
  return inputs.arv * (inputs.sellClosingPct / 100);
}

export function holdingCosts(inputs: FlipInputs): number {
  return inputs.holdingMonths * inputs.holdingCostPerMonth;
}

export function totalCashIn(inputs: FlipInputs): number {
  return (
    inputs.purchasePrice +
    inputs.rehabBudget +
    buyClosingCost(inputs) +
    holdingCosts(inputs)
  );
}

export function netProfit(inputs: FlipInputs): number {
  return inputs.arv - sellClosingCost(inputs) - totalCashIn(inputs);
}

export function roiPct(inputs: FlipInputs): number {
  const invested = totalCashIn(inputs);
  if (invested <= 0) return 0;
  return (netProfit(inputs) / invested) * 100;
}

export function maxOffer70Rule(inputs: FlipInputs): number {
  return Math.max(0, inputs.arv * 0.7 - inputs.rehabBudget - holdingCosts(inputs));
}

export function dealScore(inputs: FlipInputs): number {
  const profit = netProfit(inputs);
  const roi = roiPct(inputs);
  if (profit <= 0) return Math.max(0, 15 + profit / 5000);
  return Math.min(100, 35 + roi * 1.8 + Math.min(30, profit / 4000));
}

export function flipQuip(inputs: FlipInputs): string | null {
  const profit = netProfit(inputs);
  const roi = roiPct(inputs);
  if (profit >= 75000) return 'Whale deal — this spread can fund your next two flips.';
  if (profit >= 45000 && roi >= 22) return 'Strong margin. Run comps one more time and move.';
  if (profit >= 20000) return 'Workable flip — watch holding costs if the market slows.';
  if (profit > 0) return 'Thin edge — negotiate purchase price or trim rehab scope.';
  if (profit > -15000) return 'Break-even zone — only if you have strategic upside.';
  return 'Underwater on paper — walk or restructure the deal.';
}

export function costBreakdown(inputs: FlipInputs) {
  return [
    { name: 'Purchase', value: inputs.purchasePrice, fill: '#f59e0b' },
    { name: 'Rehab', value: inputs.rehabBudget, fill: '#fb7185' },
    { name: 'Buy close', value: buyClosingCost(inputs), fill: '#38bdf8' },
    { name: 'Holding', value: holdingCosts(inputs), fill: '#a78bfa' },
    { name: 'Sell close', value: sellClosingCost(inputs), fill: '#f472b6' },
  ];
}

export function arvSensitivity(inputs: FlipInputs) {
  const steps = [-12, -8, -4, 0, 4, 8, 12];
  return steps.map((pct) => {
    const arv = inputs.arv * (1 + pct / 100);
    const adjusted = { ...inputs, arv };
    return {
      label: pct === 0 ? 'Base' : `${pct > 0 ? '+' : ''}${pct}%`,
      arv,
      profit: netProfit(adjusted),
    };
  });
}

export function loadFlipDeals(): FlipDeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FlipDeal[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function saveFlipDeal(inputs: FlipInputs): FlipDeal[] {
  const deal: FlipDeal = {
    ...inputs,
    id: `flip-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  const next = [deal, ...loadFlipDeals()].slice(0, 12);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function shareFlipText(inputs: FlipInputs): string {
  const profit = netProfit(inputs);
  const roi = roiPct(inputs);
  return [
    `House flip — ${inputs.label || 'Deal'}`,
    `Purchase ${formatUsd(inputs.purchasePrice)} · ARV ${formatUsd(inputs.arv)}`,
    `Rehab ${formatUsd(inputs.rehabBudget)} · Hold ${inputs.holdingMonths} mo`,
    `Net profit ${formatUsd(profit)} (${roi.toFixed(1)}% ROI)`,
    'aibhive.com/hive-apps/run/example-house-flip',
  ].join('\n');
}
