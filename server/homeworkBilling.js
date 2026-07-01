import { applyTokenMarkup } from './hivePlans.js';
import * as hiveUsage from './hiveUsage.js';

const OCR_PER_PAGE = Number(process.env.HOMEWORK_OCR_RAW_COST_PER_PAGE ?? 0.003);
const COMPLETE_COST = Number(process.env.HOMEWORK_COMPLETE_RAW_COST ?? 0.012);
const INGEST_COST = Number(process.env.HOMEWORK_INGEST_RAW_COST ?? 0.006);

export function homeworkOcrRawCost(pageCount) {
  return OCR_PER_PAGE * Math.max(1, Number(pageCount) || 1);
}

export function homeworkCompleteRawCost() {
  return COMPLETE_COST;
}

export function homeworkIngestRawCost() {
  return INGEST_COST;
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function requireHomeworkBudget(db, userId, rawCostUsd, feature) {
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
export async function chargeHomeworkUsage(db, userId, rawCostUsd, feature, summary) {
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
