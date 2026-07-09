/**
 * Research Lab utility billing — Hive credits (30% markup) or BYOK orchestration fee.
 */
import { applyTokenMarkup } from './hivePlans.js';
import * as hiveUsage from './hiveUsage.js';
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

export function harvestRawCost(keys = {}, roles = {}, usesPlatformRouting = false) {
  const providers = new Set(
    [roles?.director?.provider, roles?.vision?.provider, roles?.translator?.provider].filter(Boolean),
  );
  const allByok = [...providers].every((p) => keys?.[p]);
  if (allByok && providers.size > 0) {
    return RESEARCH_AI_HARVEST_BYOK_RAW + (usesPlatformRouting ? RESEARCH_SCRAPE_PLATFORM_RAW : 0);
  }
  return RESEARCH_AI_HARVEST_RAW + (usesPlatformRouting ? RESEARCH_SCRAPE_PLATFORM_RAW : 0);
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function requireResearchLabBudget(db, userId, rawCostUsd, feature) {
  const marked = applyTokenMarkup(rawCostUsd);
  const budget = await hiveUsage.checkTokenBudget(db, userId, marked, feature);
  if (!budget.ok) {
    return {
      ok: false,
      needPayment: true,
      amountUsd: budget.amountUsd ?? marked,
      suggestedPlan: budget.suggestedPlan ?? 'starter',
    };
  }
  return { ok: true, marked };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function chargeResearchLabUsage(db, userId, rawCostUsd, feature, summary) {
  const charge = await hiveUsage.recordTokenUsage(db, userId, {
    rawCostUsd,
    feature,
    summary,
  });
  if (!charge.ok) {
    return {
      ok: false,
      needPayment: true,
      amountUsd: charge.amountUsd ?? applyTokenMarkup(rawCostUsd),
    };
  }
  return { ok: true, chargedUsd: charge.chargedUsd };
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
