/** Heuristic estimator using city medians + property inputs (not an appraisal). */

const CITY_MEDIAN = {
  Eugene: 478000,
  Springfield: 419000,
  Corvallis: 465000,
  Bend: 625000,
  Lebanon: 355000,
  Roseburg: 340000,
  Florence: 385000,
};

const DEFAULT_MEDIAN = 420000;

function parseNum(v) {
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function estimateFromInputs({
  address = '',
  city = '',
  zip = '',
  beds = '',
  baths = '',
  sqft = '',
  condition = 'average',
  yearBuilt = '',
}) {
  const cityKey = Object.keys(CITY_MEDIAN).find(
    (k) => city.toLowerCase().includes(k.toLowerCase()) || address.toLowerCase().includes(k.toLowerCase()),
  );
  let base = cityKey ? CITY_MEDIAN[cityKey] : DEFAULT_MEDIAN;

  const sq = parseNum(sqft);
  if (sq > 0) {
    const perSq = base / 1650;
    base = perSq * sq;
  }

  const b = parseNum(beds);
  const ba = parseNum(baths);
  if (b >= 4) base *= 1.06;
  if (b <= 2 && b > 0) base *= 0.94;
  if (ba >= 3) base *= 1.03;

  const yr = parseNum(yearBuilt);
  if (yr > 0 && yr < 1970) base *= 0.88;
  if (yr >= 2000) base *= 1.04;

  const conditionMult = {
    excellent: 1.08,
    good: 1.02,
    average: 1,
    fair: 0.9,
    poor: 0.78,
    'needs-work': 0.72,
  };
  base *= conditionMult[condition] ?? 1;

  if (zip.startsWith('974') || zip.startsWith('973') || zip.startsWith('977')) {
    /* Oregon zips — no adjustment */
  }

  const marketLow = Math.round(base * 0.92 / 1000) * 1000;
  const marketHigh = Math.round(base * 1.08 / 1000) * 1000;

  const investorMargin = 0.68;
  const cashLow = Math.round(marketLow * investorMargin / 1000) * 1000;
  const cashHigh = Math.round(marketHigh * 0.82 / 1000) * 1000;

  return {
    marketLow,
    marketHigh,
    cashLow,
    cashHigh: Math.max(cashHigh, cashLow + 5000),
    cityDetected: cityKey || (city || 'Oregon'),
    zip,
  };
}

export function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
