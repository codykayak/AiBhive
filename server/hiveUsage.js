/**
 * Hive token usage metering — 50% markup, plan allowances, ledger.
 */
import {
  applyTokenMarkup,
  computeUsageBudget,
  getPlan,
  isFreeFeature,
  TOKEN_MARKUP,
} from './hivePlans.js';

function monthBounds(from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999);
  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function ensureUsagePeriod(db, userId) {
  const ref = db.collection('hive_users').doc(userId);
  const snap = await ref.get();
  const data = snap.data() ?? {};
  const now = Date.now();
  const end = data.periodEnd ? new Date(data.periodEnd).getTime() : 0;
  if (data.periodStart && end > now) return data;

  const { periodStart, periodEnd } = monthBounds();
  await ref.set(
    {
      monthlyUsageUsd: 0,
      periodStart,
      periodEnd,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { ...data, monthlyUsageUsd: 0, periodStart, periodEnd };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function checkTokenBudget(db, userId, markedUpCostUsd, featureId) {
  if (featureId && isFreeFeature(featureId)) {
    const user = (await db.collection('hive_users').doc(userId).get()).data() ?? {};
    return { ok: true, budget: computeUsageBudget(user), free: true };
  }

  const cost = Math.max(0, Number(markedUpCostUsd) || 0);
  if (cost === 0) {
    const user = (await db.collection('hive_users').doc(userId).get()).data() ?? {};
    return { ok: true, budget: computeUsageBudget(user) };
  }

  await ensureUsagePeriod(db, userId);
  const user = (await db.collection('hive_users').doc(userId).get()).data() ?? {};
  const budget = computeUsageBudget(user);

  if (budget.totalRemainingUsd >= cost) {
    return { ok: true, budget };
  }

  const plan = getPlan(user.planId);
  return {
    ok: false,
    needUpgrade: true,
    amountUsd: cost,
    budget,
    suggestedPlan: plan.id === 'free' ? 'starter' : plan.id === 'starter' ? 'pro' : 'unlimited',
  };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function recordTokenUsage(db, userId, opts) {
  const { rawCostUsd, feature, summary, taskId } = opts;
  if (feature && isFreeFeature(feature)) {
    return { ok: true, chargedUsd: 0, free: true };
  }

  const markedUp = applyTokenMarkup(rawCostUsd);
  if (markedUp === 0) return { ok: true, chargedUsd: 0 };

  const check = await checkTokenBudget(db, userId, markedUp, feature);
  if (!check.ok) return check;

  const userRef = db.collection('hive_users').doc(userId);
  const now = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const u = snap.data() ?? {};
    const plan = getPlan(u.planId);
    const allowance = Number(u.monthlyAllowanceUsd ?? plan.monthlyAllowanceUsd) || 0;
    let used = Number(u.monthlyUsageUsd) || 0;
    let credits = Number(u.creditBalanceUsd) || 0;
    let remaining = markedUp;

    const allowanceRoom = Math.max(0, allowance - used);
    const fromAllowance = Math.min(allowanceRoom, remaining);
    used += fromAllowance;
    remaining -= fromAllowance;

    if (remaining > 0) {
      if (credits < remaining) throw new Error('INSUFFICIENT_BUDGET');
      credits -= remaining;
    }

    tx.update(userRef, {
      monthlyUsageUsd: used,
      creditBalanceUsd: credits,
      lifetimeUsageUsd: (Number(u.lifetimeUsageUsd) || 0) + markedUp,
      updatedAt: now,
    });

    tx.set(db.collection('hive_ledger').doc(), {
      userId,
      taskId: taskId ?? '',
      type: 'token_usage',
      feature: feature ?? 'token',
      rawCostUsd: Number(rawCostUsd) || 0,
      markupMultiplier: TOKEN_MARKUP,
      amountUsd: -markedUp,
      summary: summary ?? `Token usage (${feature ?? 'api'})`,
      createdAt: now,
    });
  });

  const user = (await userRef.get()).data() ?? {};
  return { ok: true, chargedUsd: markedUp, budget: computeUsageBudget(user) };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function setUserPlan(db, userId, planId, extra = {}) {
  const plan = getPlan(planId);
  const { periodStart, periodEnd } = monthBounds();
  const ref = db.collection('hive_users').doc(userId);
  const snap = await ref.get();
  const existing = snap.data() ?? {};

  const patch = {
    planId: plan.id,
    monthlyAllowanceUsd: plan.monthlyAllowanceUsd,
    periodStart,
    periodEnd,
    updatedAt: new Date().toISOString(),
    ...extra,
  };

  if (planId === 'starter' && plan.creditOnPurchaseUsd > 0 && extra.applyStarterCredit) {
    patch.creditBalanceUsd = (Number(existing.creditBalanceUsd) || 0) + plan.creditOnPurchaseUsd;
  }

  if (plan.interval === 'month') {
    patch.monthlyUsageUsd = 0;
  }

  await ref.set(patch, { merge: true });
  return (await ref.get()).data();
}

export { applyTokenMarkup, computeUsageBudget, TOKEN_MARKUP };
