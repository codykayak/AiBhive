/**
 * Hive user-facing prices vs internal cost estimates.
 *
 * Today: Gemini returns a "base" estimate in JSON. We apply markup before
 * showing the user or charging credits so builds stay profitable.
 */

const MARKUP = Number(process.env.HIVE_MARKUP_MULTIPLIER ?? 2.5);
const MIN_CHARGE_USD = Number(process.env.HIVE_MIN_CHARGE_USD ?? 2);
const MAX_CHARGE_USD = Number(process.env.HIVE_MAX_CHARGE_USD ?? 35);
const ROUND_TO = Number(process.env.HIVE_PRICE_ROUND_USD ?? 1);

function roundUpUsd(n) {
  const step = ROUND_TO > 0 ? ROUND_TO : 1;
  return Math.ceil(n / step) * step;
}

/**
 * @param {{ costUsd?: number, minutes?: number } | null | undefined} raw
 * @returns {{ base: { costUsd: number, minutes: number }, user: { costUsd: number, minutes: number } }}
 */
export function priceEstimate(raw) {
  const baseCost = Math.max(0, Number(raw?.costUsd) || 0);
  const baseMinutes = Math.max(5, Number(raw?.minutes) || 20);

  if (baseCost === 0) {
    return {
      base: { costUsd: 0, minutes: baseMinutes },
      user: { costUsd: 0, minutes: baseMinutes },
    };
  }

  const marked = baseCost * (MARKUP > 0 ? MARKUP : 1);
  const userCost = Math.min(MAX_CHARGE_USD, Math.max(MIN_CHARGE_USD, roundUpUsd(marked)));

  return {
    base: { costUsd: baseCost, minutes: baseMinutes },
    user: { costUsd: userCost, minutes: baseMinutes },
  };
}

export function getPricingConfig() {
  return {
    markupMultiplier: MARKUP,
    minChargeUsd: MIN_CHARGE_USD,
    maxChargeUsd: MAX_CHARGE_USD,
    roundUsd: ROUND_TO,
    welcomeCreditUsd: Number(process.env.HIVE_WELCOME_CREDIT_USD ?? 5),
  };
}
