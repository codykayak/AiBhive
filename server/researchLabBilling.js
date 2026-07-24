/**
 * Research Lab utility billing — Hive credits (Hive credits) or BYOK orchestration fee.
 */
import * as hiveUsage from './hiveUsage.js';
import { TOKEN_MARKUP } from './hivePlans.js';
import { ensureProfile, resolveApiKey } from '../functions/lib/tartar/credits.js';

/** Raw API cost per OCR page when using platform Gemini (aligned with homework). */
export const RESEARCH_OCR_RAW_PER_PAGE = Number(process.env.RESEARCH_LAB_OCR_RAW_PER_PAGE ?? 0.003);

/** Platform orchestration when user supplies their own LLM keys (BYOK). */
export const RESEARCH_BYOK_ORCHESTRATION_RAW = Number(
  process.env.RESEARCH_LAB_BYOK_ORCHESTRATION_RAW ?? 0.002,
);

/** AI harvest pipeline (Director + Vision + Translator orchestration). */
export const RESEARCH_AI_HARVEST_RAW = Number(process.env.RESEARCH_LAB_AI_HARVEST_RAW ?? 0.045);

/** AI harvest with full BYOK keys for all used providers. */
export const RESEARCH_AI_HARVEST_BYOK_RAW = Number(process.env.RESEARCH_LAB_AI_HARVEST_BYOK_RAW ?? 0.008);

/** Platform egress scrape/crawl (residential / server routing). */
export const RESEARCH_SCRAPE_PLATFORM_RAW = Number(process.env.RESEARCH_LAB_SCRAPE_PLATFORM_RAW ?? 0.02);

/** User IP or custom proxy — orchestration only. */
export const RESEARCH_SCRAPE_BYOK_RAW = Number(process.env.RESEARCH_LAB_SCRAPE_BYOK_RAW ?? 0.004);

export const RESEARCH_TRANSLATE_RAW = Number(process.env.RESEARCH_LAB_TRANSLATE_RAW ?? 0.008);

export const RESEARCH_PUBLISH_RAW = Number(process.env.RESEARCH_LAB_PUBLISH_RAW ?? 0.006);

/** DMT Matrix Decoder — CV + vision fusion per photo. */
export const RESEARCH_DMT_DECODE_RAW = Number(process.env.RESEARCH_LAB_DMT_DECODE_RAW ?? 0.018);

/** DMT corpus research — script comparison + statistical report (per ~$1 budget). */
export const RESEARCH_DMT_RESEARCH_BUDGET_USD = Number(
  process.env.RESEARCH_LAB_DMT_RESEARCH_BUDGET_USD ?? 1,
);

export function dmtResearchRawCost(budgetUsd = RESEARCH_DMT_RESEARCH_BUDGET_USD, useRawBudget = false) {
  const budget = Math.max(0.25, Math.min(Number(budgetUsd) || RESEARCH_DMT_RESEARCH_BUDGET_USD, 5));
  if (useRawBudget) return budget;
  return Math.round((budget / TOKEN_MARKUP) * 10000) / 10000;
}

export function dmtMatrixDecodeRawCost() {
  return RESEARCH_DMT_DECODE_RAW;
}

export function researchOcrRawCost(pageCount) {
  return RESEARCH_OCR_RAW_PER_PAGE * Math.max(1, Number(pageCount) || 1);
}

export function scrapeRawCost(routing = {}, usesPlatformAi = true) {
  const mode = routing?.mode || 'browser';
  if (mode === 'browser' || mode === 'custom') {
    return RESEARCH_SCRAPE_BYOK_RAW;
  }
  return RESEARCH_SCRAPE_PLATFORM_RAW;
}

export function harvestRawCost(keys = {}, roles = {}, usesPlatformRouting = false, findingCount = 8) {
  const providers = new Set(
    [roles?.director?.provider, roles?.vision?.provider, roles?.translator?.provider].filter(Boolean),
  );
  const allByok = [...providers].every((p) => keys?.[p]);
  const findings = Math.max(1, Math.min(Number(findingCount) || 8, 8));
  // Base orchestration + per-finding vision/translate cost (platform keys).
  const perFinding = allByok && providers.size > 0 ? 0.001 : 0.005;
  const base =
    allByok && providers.size > 0 ? RESEARCH_AI_HARVEST_BYOK_RAW : RESEARCH_AI_HARVEST_RAW * 0.35;
  return base + findings * perFinding + (usesPlatformRouting ? RESEARCH_SCRAPE_PLATFORM_RAW : 0);
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function requireResearchLabBudget(
  db,
  userId,
  rawCostUsd,
  feature,
  { email, chargeUsdOverride } = {},
) {
  const marked =
    chargeUsdOverride != null
      ? Math.max(0, Number(chargeUsdOverride) || 0)
      : (await hiveUsage.markCostForUser(db, userId, rawCostUsd)).markedUsd;
  const budget = await hiveUsage.checkTokenBudget(db, userId, marked, feature, { email });
  if (!budget.ok) {
    return {
      ok: false,
      needPayment: true,
      amountUsd: budget.amountUsd ?? marked,
      suggestedPlan: budget.suggestedPlan ?? 'starter',
    };
  }
  return { ok: true, marked, adminExempt: !!budget.adminExempt };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function chargeResearchLabUsage(
  db,
  userId,
  rawCostUsd,
  feature,
  summary,
  { email, chargeUsdOverride } = {},
) {
  const charge = await hiveUsage.recordTokenUsage(db, userId, {
    rawCostUsd,
    feature,
    summary,
    email,
    chargeUsdOverride,
  });
  if (!charge.ok) {
    const { markedUsd } = await hiveUsage.markCostForUser(db, userId, rawCostUsd);
    return {
      ok: false,
      needPayment: true,
      amountUsd: charge.amountUsd ?? markedUsd,
    };
  }
  return { ok: true, chargedUsd: charge.chargedUsd, adminExempt: !!charge.adminExempt };
}

/**
 * Resolve Gemini key for OCR — platform or BYOK from Tartar profile.
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function resolveResearchOcrKey(db, uid, platformGeminiKey) {
  try {
    const resolved = await resolveApiKey(db, uid, 'gemini', { gemini: platformGeminiKey });
    if (resolved.mode === 'byok') {
      return {
        apiKey: resolved.key,
        billingMode: 'byok',
        rawCostUsd: RESEARCH_BYOK_ORCHESTRATION_RAW,
      };
    }
  } catch {
    /* fall through to platform */
  }
  return {
    apiKey: platformGeminiKey,
    billingMode: 'hive_credits',
    rawCostUsd: null,
  };
}
