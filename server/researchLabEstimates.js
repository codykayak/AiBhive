/**
 * Pre-run Hive credit estimates for Research Lab operations.
 */
import {
  RESEARCH_AI_HARVEST_BYOK_RAW,
  RESEARCH_AI_HARVEST_RAW,
  RESEARCH_BYOK_ORCHESTRATION_RAW,
  RESEARCH_OCR_RAW_PER_PAGE,
  RESEARCH_PUBLISH_RAW,
  RESEARCH_DMT_DECODE_RAW,
  RESEARCH_DMT_RESEARCH_BUDGET_USD,
  dmtResearchRawCost,
  RESEARCH_SCRAPE_BYOK_RAW,
  RESEARCH_SCRAPE_PLATFORM_RAW,
  RESEARCH_TRANSLATE_RAW,
  harvestRawCost,
  researchOcrRawCost,
  scrapeRawCost,
} from './researchLabBilling.js';
import { markCostForUser } from './hiveUsage.js';
import { isAdminEmail } from './hiveAdmin.js';

export function estimateRawCost(op, params = {}) {
  switch (op) {
    case 'ocr': {
      const pages = Math.max(1, Number(params.pages) || 1);
      if (params.byok) return RESEARCH_BYOK_ORCHESTRATION_RAW * pages;
      return researchOcrRawCost(pages);
    }
    case 'scrape':
    case 'scan':
      return scrapeRawCost(params.routing || { mode: params.mode || 'browser' });
    case 'crawl': {
      const pages = Math.max(1, Math.min(Number(params.pages) || 5, 20));
      return scrapeRawCost(params.routing || { mode: params.mode || 'browser' }) * pages;
    }
    case 'ai-harvest':
    case 'harvest':
      return harvestRawCost(
        params.keys || {},
        params.roles || {},
        !!params.usesPlatformRouting,
        params.findingCount || 8,
      );
    case 'translate':
      return RESEARCH_TRANSLATE_RAW;
    case 'publish':
      return RESEARCH_PUBLISH_RAW;
    case 'dmt-decode':
    case 'dmt-matrix-decode':
      return RESEARCH_DMT_DECODE_RAW;
    case 'dmt-research':
    case 'dmt-matrix-research': {
      const budget = Number(params.budgetUsd) || RESEARCH_DMT_RESEARCH_BUDGET_USD;
      const useRaw = !!params.useRawBudget;
      return dmtResearchRawCost(budget, useRaw);
    }
    default:
      return 0.01;
  }
}

export async function estimateForUser(db, userId, op, params = {}, opts = {}) {
  const rawCostUsd = estimateRawCost(op, params);
  const budgetUsd = Number(params.budgetUsd) || RESEARCH_DMT_RESEARCH_BUDGET_USD;
  const useRawBudget = !!params.useRawBudget;
  const isAdmin = isAdminEmail(opts.email);
  const chargeUsd =
    op === 'dmt-research' || op === 'dmt-matrix-research'
      ? budgetUsd
      : (await markCostForUser(db, userId, rawCostUsd)).markedUsd;
  const { markedUsd } = await markCostForUser(db, userId, rawCostUsd);
  return {
    ok: true,
    op,
    rawCostUsd,
    estimatedCredits: chargeUsd,
    apiBudgetUsd:
      op === 'dmt-research' || op === 'dmt-matrix-research'
        ? useRawBudget
          ? budgetUsd
          : Math.round((budgetUsd / 1.3) * 10000) / 10000
        : markedUsd,
    useRawBudget,
    budgetUsd: op === 'dmt-research' || op === 'dmt-matrix-research' ? budgetUsd : undefined,
    isAdmin,
    breakdown: {
      ocrPerPage: RESEARCH_OCR_RAW_PER_PAGE,
      scrapePlatform: RESEARCH_SCRAPE_PLATFORM_RAW,
      scrapeByok: RESEARCH_SCRAPE_BYOK_RAW,
      harvestPlatform: RESEARCH_AI_HARVEST_RAW,
      harvestByok: RESEARCH_AI_HARVEST_BYOK_RAW,
      translate: RESEARCH_TRANSLATE_RAW,
      publish: RESEARCH_PUBLISH_RAW,
    },
    message: `About ${chargeUsd.toFixed(2)} Hive credits for this ${op} run`,
  };
}
