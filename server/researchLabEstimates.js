/**
 * Pre-run Hive credit estimates for Research Lab operations.
 */
import {
  RESEARCH_AI_HARVEST_BYOK_RAW,
  RESEARCH_AI_HARVEST_RAW,
  RESEARCH_BYOK_ORCHESTRATION_RAW,
  RESEARCH_OCR_RAW_PER_PAGE,
  RESEARCH_PUBLISH_RAW,
  RESEARCH_SCRAPE_BYOK_RAW,
  RESEARCH_SCRAPE_PLATFORM_RAW,
  RESEARCH_TRANSLATE_RAW,
  harvestRawCost,
  researchOcrRawCost,
  scrapeRawCost,
} from './researchLabBilling.js';
import { markCostForUser } from './hiveUsage.js';

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
    default:
      return 0.01;
  }
}

export async function estimateForUser(db, userId, op, params = {}) {
  const rawCostUsd = estimateRawCost(op, params);
  const { markedUsd } = await markCostForUser(db, userId, rawCostUsd);
  return {
    ok: true,
    op,
    rawCostUsd,
    estimatedCredits: markedUsd,
    breakdown: {
      ocrPerPage: RESEARCH_OCR_RAW_PER_PAGE,
      scrapePlatform: RESEARCH_SCRAPE_PLATFORM_RAW,
      scrapeByok: RESEARCH_SCRAPE_BYOK_RAW,
      harvestPlatform: RESEARCH_AI_HARVEST_RAW,
      harvestByok: RESEARCH_AI_HARVEST_BYOK_RAW,
      translate: RESEARCH_TRANSLATE_RAW,
      publish: RESEARCH_PUBLISH_RAW,
    },
    message: `About ${markedUsd.toFixed(2)} Hive credits for this ${op} run`,
  };
}
