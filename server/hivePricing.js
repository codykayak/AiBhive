/**
 * Hive user-facing prices vs internal cost estimates.
 *
 * Consumer-friendly tiers: most first builds $4–$4.50, iterations slightly higher,
 * capped under $5 for beta. Owner/admin accounts can be flagged free at quote time.
 */

const MAX_CHARGE_USD = Number(process.env.HIVE_MAX_CHARGE_USD ?? 5);
const FIRST_SIMPLE_USD = Number(process.env.HIVE_FIRST_SIMPLE_USD ?? 4);
const FIRST_STANDARD_USD = Number(process.env.HIVE_FIRST_STANDARD_USD ?? 4.5);
const ITERATION_SIMPLE_USD = Number(process.env.HIVE_ITERATION_SIMPLE_USD ?? 4.5);
const ITERATION_STANDARD_USD = Number(process.env.HIVE_ITERATION_STANDARD_USD ?? 5);

function roundUsd(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Map Gemini "base" complexity to a flat user price (not multiplicative markup).
 * @param {{ costUsd?: number, minutes?: number } | null | undefined} raw
 * @param {{ free?: boolean, priorBuildCount?: number, isIteration?: boolean }} [opts]
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

  const iteration =
    Boolean(opts.isIteration) || (Number(opts.priorBuildCount) || 0) > 0;

  // Simple = tiny UI / calculator / single screen; standard = everything else in beta band.
  const simple = baseCost <= 3 || baseMinutes <= 20;

  let userCost;
  if (iteration) {
    userCost = simple ? ITERATION_SIMPLE_USD : ITERATION_STANDARD_USD;
  } else {
    userCost = simple ? FIRST_SIMPLE_USD : FIRST_STANDARD_USD;
  }

  userCost = Math.min(MAX_CHARGE_USD, roundUsd(userCost));

  return {
    base: { costUsd: baseCost, minutes: baseMinutes },
    user: { costUsd: userCost, minutes: baseMinutes },
  };
}

export function getPricingConfig() {
  return {
    maxChargeUsd: MAX_CHARGE_USD,
    firstSimpleUsd: FIRST_SIMPLE_USD,
    firstStandardUsd: FIRST_STANDARD_USD,
    iterationSimpleUsd: ITERATION_SIMPLE_USD,
    iterationStandardUsd: ITERATION_STANDARD_USD,
    welcomeCreditUsd: Number(process.env.HIVE_WELCOME_CREDIT_USD ?? 5),
    freeBuildEmailsConfigured: true,
  };
}
