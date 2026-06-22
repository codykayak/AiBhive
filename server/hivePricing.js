/**
 * Hive build pricing.
 *
 * The earlier pricing collapsed almost every quote to the $0.50 floor because
 * Composer-2.5 token estimates for short prompts always round into the bottom
 * of the bucket. The new model uses (target, buildMethod) tiers so the user
 * sees a meaningful price spread:
 *
 *   • spec build (instant, in-app, no Cursor)          ~ $1
 *   • host_screen custom code (Cursor)                 ~ $4
 *   • web_app (Cursor + hosted at /u/owner/slug)       ~ $5
 *   • native_app (Cursor + EAS installable APK)        ~ $18
 *   • play_store (Cursor + signed AAB + listing)       ~ $35
 *   • iteration (any target, prior slug)               half of original, floor $0.50
 *
 * The Gemini token-based estimate still feeds in: it can push the quote ABOVE
 * the floor for unusually large requests, but never below. Iterations use the
 * iteration floor instead of the base-tier floor.
 */

const MARKUP = Number(process.env.HIVE_MARKUP_MULTIPLIER ?? 1.3);
const MAX_CHARGE_USD = Number(process.env.HIVE_MAX_CHARGE_USD ?? 60);
const ROUND_TO = Number(process.env.HIVE_PRICE_ROUND_USD ?? 0.25);
const ITERATION_DISCOUNT = Number(process.env.HIVE_ITERATION_DISCOUNT ?? 0.5);
const AUTO_APPROVE_USD_DEFAULT = Number(process.env.HIVE_AUTO_APPROVE_USD ?? 1.5);

/**
 * Base floor per (target, buildMethod) — what the user sees before markup
 * + token-based add-on. Override any line via env vars.
 */
const BASE_FLOOR_USD = {
  spec: Number(process.env.HIVE_PRICE_SPEC ?? 1.0),
  host_screen: Number(process.env.HIVE_PRICE_HOST_SCREEN ?? 4.0),
  web_app: Number(process.env.HIVE_PRICE_WEB_APP ?? 5.0),
  native_app: Number(process.env.HIVE_PRICE_NATIVE_APP ?? 18.0),
  play_store: Number(process.env.HIVE_PRICE_PLAY_STORE ?? 35.0),
};

const BASE_MINUTES = {
  spec: Number(process.env.HIVE_MIN_SPEC ?? 2),
  host_screen: Number(process.env.HIVE_MIN_HOST_SCREEN ?? 18),
  web_app: Number(process.env.HIVE_MIN_WEB_APP ?? 22),
  native_app: Number(process.env.HIVE_MIN_NATIVE_APP ?? 40),
  play_store: Number(process.env.HIVE_MIN_PLAY_STORE ?? 55),
};

const ITERATION_FLOOR = Number(process.env.HIVE_PRICE_ITERATION ?? 0.5);

function roundUpUsd(n, step) {
  const s = step > 0 ? step : 0.25;
  return Math.ceil(n / s) * s;
}

function pickTier(target, buildMethod) {
  if (buildMethod === 'spec') return 'spec';
  if (target === 'web_app') return 'web_app';
  if (target === 'native_app') return 'native_app';
  if (target === 'play_store') return 'play_store';
  return 'host_screen';
}

/**
 * @param {{ costUsd?: number, minutes?: number } | null | undefined} raw Cursor token-derived estimate
 * @param {{
 *   free?: boolean,
 *   iteration?: boolean,
 *   target?: 'host_screen' | 'web_app' | 'native_app' | 'play_store' | 'iteration',
 *   buildMethod?: 'spec' | 'cursor',
 * }} [opts]
 */
export function priceEstimate(raw, opts = {}) {
  const baseCostFromTokens = Math.max(0, Number(raw?.costUsd) || 0);
  const baseMinutesFromTokens = Math.max(0, Number(raw?.minutes) || 0);
  const tier = pickTier(opts.target, opts.buildMethod);
  const tierFloor = BASE_FLOOR_USD[tier] ?? BASE_FLOOR_USD.host_screen;
  const tierMinutes = BASE_MINUTES[tier] ?? BASE_MINUTES.host_screen;

  const baseMinutes = Math.max(tierMinutes, baseMinutesFromTokens || tierMinutes);

  if (opts.free) {
    return {
      base: { costUsd: tierFloor, minutes: baseMinutes },
      user: { costUsd: 0, minutes: baseMinutes },
      freeReason: 'owner_beta',
      tier,
    };
  }

  if (opts.iteration) {
    const baseFromTokens = Math.max(0, baseCostFromTokens * (MARKUP > 0 ? MARKUP : 1));
    const discounted = Math.max(ITERATION_FLOOR, tierFloor * ITERATION_DISCOUNT + baseFromTokens * 0.5);
    const userCost = Math.min(MAX_CHARGE_USD, roundUpUsd(discounted, ROUND_TO));
    return {
      base: { costUsd: tierFloor, minutes: baseMinutes },
      user: { costUsd: userCost, minutes: baseMinutes },
      tier: 'iteration',
    };
  }

  const marked = tierFloor + baseCostFromTokens * (MARKUP > 0 ? MARKUP : 1);
  const userCost = Math.min(MAX_CHARGE_USD, roundUpUsd(marked, ROUND_TO));
  return {
    base: { costUsd: tierFloor, minutes: baseMinutes },
    user: { costUsd: userCost, minutes: baseMinutes },
    tier,
  };
}

export function getPricingConfig() {
  return {
    markupMultiplier: MARKUP,
    iterationDiscount: ITERATION_DISCOUNT,
    iterationFloor: ITERATION_FLOOR,
    maxChargeUsd: MAX_CHARGE_USD,
    roundUsd: ROUND_TO,
    tiers: {
      spec: { floorUsd: BASE_FLOOR_USD.spec, minutes: BASE_MINUTES.spec },
      host_screen: { floorUsd: BASE_FLOOR_USD.host_screen, minutes: BASE_MINUTES.host_screen },
      web_app: { floorUsd: BASE_FLOOR_USD.web_app, minutes: BASE_MINUTES.web_app },
      native_app: { floorUsd: BASE_FLOOR_USD.native_app, minutes: BASE_MINUTES.native_app },
      play_store: { floorUsd: BASE_FLOOR_USD.play_store, minutes: BASE_MINUTES.play_store },
    },
    autoApproveUsd: AUTO_APPROVE_USD_DEFAULT,
    welcomeCreditUsd: Number(process.env.HIVE_WELCOME_CREDIT_USD ?? 15),
    estimateSource: 'tiered_base_plus_token_addon',
  };
}

export function getAutoApproveDefaultUsd() {
  return AUTO_APPROVE_USD_DEFAULT;
}

export function priceForTier(tier) {
  return {
    floorUsd: BASE_FLOOR_USD[tier] ?? BASE_FLOOR_USD.host_screen,
    minutes: BASE_MINUTES[tier] ?? BASE_MINUTES.host_screen,
  };
}
