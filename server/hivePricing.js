/**
 * User-facing Hive build prices = Cursor internal estimate + markup (default 30%).
 */

const MARKUP = Number(process.env.HIVE_MARKUP_MULTIPLIER ?? 1.3);
const MIN_CHARGE_USD = Number(process.env.HIVE_MIN_CHARGE_USD ?? 2);
const MAX_CHARGE_USD = Number(process.env.HIVE_MAX_CHARGE_USD ?? 12);
const ROUND_TO = Number(process.env.HIVE_PRICE_ROUND_USD ?? 0.5);

function roundUpUsd(n) {
  const step = ROUND_TO > 0 ? ROUND_TO : 0.5;
  return Math.ceil(n / step) * step;
}

/**
 * @param {{ costUsd?: number, minutes?: number } | null | undefined} raw Cursor base estimate
 * @param {{ free?: boolean }} [opts]
 */
export function priceEstimate(raw, opts = {}) {
  const baseCost = Math.max(0, Number(raw?.costUsd) || 0);
  const baseMinutes = Math.max(5, Number(raw?.minutes) || 20);

  if (opts.free) {
    return {
      base: { costUsd: baseCost, minutes: baseMinutes },
      user: { costUsd: 0, minutes: baseMinutes },
      freeReason: 'owner_beta',
    };
  }

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
    welcomeCreditUsd: Number(process.env.HIVE_WELCOME_CREDIT_USD ?? 15),
    estimateSource: 'cursor_model_via_gemini',
  };
}
