/**
 * Hive platform billing — pay-for-what-you-use accounts.
 * Each mobile install gets a hive_user_id; balance stored in Firestore.
 */
import { computeUsageBudget, getPlan } from './hivePlans.js';
import { ensureUsagePeriod } from './hiveUsage.js';
const HIVE_USERS = 'hive_users';
const HIVE_LEDGER = 'hive_ledger';

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function ensureHiveUser(db, userId) {
  if (!userId || userId === 'anonymous') {
    throw new Error('A valid user id is required.');
  }
  const ref = db.collection(HIVE_USERS).doc(userId);
  const snap = await ref.get();
  if (snap.exists) return snap.data();

  const now = new Date().toISOString();
  const { periodStart, periodEnd } = (() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
  })();
  const doc = {
    userId,
    planId: 'free',
    creditBalanceUsd: String(userId).startsWith('web_')
      ? Number(process.env.HIVE_WEB_WELCOME_CREDIT_USD ?? process.env.HIVE_WELCOME_CREDIT_USD ?? 2)
      : Number(process.env.HIVE_WELCOME_CREDIT_USD ?? 0),
    monthlyAllowanceUsd: 0,
    monthlyUsageUsd: 0,
    lifetimeUsageUsd: 0,
    periodStart,
    periodEnd,
    totalSpentUsd: 0,
    buildCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(doc);
  return doc;
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function getHiveAccount(db, userId) {
  const user = await ensureHiveUser(db, userId);
  await ensureUsagePeriod(db, userId);
  const fresh = (await db.collection(HIVE_USERS).doc(userId).get()).data() ?? user;
  const ledgerSnap = await db
    .collection(HIVE_LEDGER)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()
    .catch(() => null);

  const recentActivity =
    ledgerSnap?.docs.map((d) => {
      const row = d.data();
      return {
        id: d.id,
        type: row.type,
        amountUsd: row.amountUsd,
        summary: row.summary,
        createdAt: row.createdAt,
      };
    }) ?? [];

  return {
    userId: fresh.userId,
    planId: fresh.planId ?? 'free',
    creditBalanceUsd: fresh.creditBalanceUsd ?? 0,
    totalSpentUsd: fresh.totalSpentUsd ?? 0,
    buildCount: fresh.buildCount ?? 0,
    monthlyUsageUsd: fresh.monthlyUsageUsd ?? 0,
    monthlyAllowanceUsd: fresh.monthlyAllowanceUsd ?? 0,
    lifetimeUsageUsd: fresh.lifetimeUsageUsd ?? 0,
    periodStart: fresh.periodStart ?? null,
    periodEnd: fresh.periodEnd ?? null,
    stripeSubscriptionId: fresh.stripeSubscriptionId ?? null,
    recentActivity,
    usage: computeUsageBudget(fresh),
  };
}

/**
 * Check if user has enough credit (does not deduct).
 * @returns {{ ok: true, creditBalanceUsd: number } | { ok: false, needPayment: true, amountUsd: number }}
 */
export async function checkBuildCredits(db, userId, amountUsd) {
  const user = await ensureHiveUser(db, userId);
  const cost = Math.max(0, Number(amountUsd) || 0);
  if (cost === 0) return { ok: true, creditBalanceUsd: user.creditBalanceUsd ?? 0 };
  if ((user.creditBalanceUsd ?? 0) < cost) {
    return { ok: false, needPayment: true, amountUsd: cost };
  }
  return { ok: true, creditBalanceUsd: user.creditBalanceUsd ?? 0 };
}

/**
 * Deduct estimate from balance when a build is approved.
 * @returns {{ ok: true } | { ok: false, needPayment: true, amountUsd: number }}
 */
export async function reserveBuildCredits(db, userId, taskId, amountUsd) {
  const check = await checkBuildCredits(db, userId, amountUsd);
  if (!check.ok) return check;

  const userRef = db.collection(HIVE_USERS).doc(userId);
  const cost = Math.max(0, Number(amountUsd) || 0);
  if (cost === 0) return { ok: true };

  const now = new Date().toISOString();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const bal = snap.data()?.creditBalanceUsd ?? 0;
    if (bal < cost) throw new Error('INSUFFICIENT_CREDITS');
    tx.update(userRef, {
      creditBalanceUsd: bal - cost,
      totalSpentUsd: (snap.data()?.totalSpentUsd ?? 0) + cost,
      buildCount: (snap.data()?.buildCount ?? 0) + 1,
      updatedAt: now,
    });
    tx.set(db.collection(HIVE_LEDGER).doc(), {
      userId,
      taskId,
      type: 'build_charge',
      amountUsd: -cost,
      summary: `Build approved (${taskId})`,
      createdAt: now,
    });
  });

  return { ok: true };
}

/**
 * Create Stripe Checkout to add credits (used when balance too low).
 * @param {import('stripe').Stripe} stripe
 */
export async function createCreditsCheckout(stripe, { userId, amountUsd, taskId, successUrl, cancelUrl }) {
  const dollars = Math.max(1, Math.ceil(Number(amountUsd) || 5));
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl || 'https://aibhive.com/hive/credits/success',
    cancel_url: cancelUrl || 'https://aibhive.com/hive/credits/cancel',
    metadata: {
      hiveUserId: userId,
      hiveTaskId: taskId || '',
      creditAmountUsd: String(dollars),
      purpose: 'hive_credits',
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'AiBhive Credits',
            description: taskId
              ? `Credits for your build (${taskId})`
              : 'Add credits to build apps and modules',
          },
          unit_amount: dollars * 100,
        },
        quantity: 1,
      },
    ],
  });
  return session;
}

/**
 * Stripe Checkout for AiBhive plans: starter ($5 once), pro ($20/mo), unlimited ($50/mo).
 * @param {import('stripe').Stripe} stripe
 */
export async function createPlanCheckout(stripe, { userId, planId, successUrl, cancelUrl }) {
  const plan = getPlan(planId);
  if (!plan || plan.id === 'free') {
    throw new Error('Invalid plan.');
  }

  const baseMetadata = {
    hiveUserId: userId,
    purpose: 'hive_plan',
    planId: plan.id,
  };

  if (plan.interval === 'once') {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl || 'https://aibhive.com/hive/plan/success',
      cancel_url: cancelUrl || 'https://aibhive.com/hive/plan/cancel',
      metadata: {
        ...baseMetadata,
        creditAmountUsd: String(plan.creditOnPurchaseUsd || plan.priceUsd),
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AiBhive ${plan.name}`,
              description: plan.tagline,
            },
            unit_amount: Math.round(plan.priceUsd * 100),
          },
          quantity: 1,
        },
      ],
    });
    return session;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: successUrl || 'https://aibhive.com/hive/plan/success',
    cancel_url: cancelUrl || 'https://aibhive.com/hive/plan/cancel',
    metadata: baseMetadata,
    subscription_data: {
      metadata: baseMetadata,
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `AiBhive ${plan.name}`,
            description: plan.tagline,
          },
          unit_amount: Math.round(plan.priceUsd * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
  });
  return session;
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function applyCreditPurchase(db, { userId, amountUsd, stripeSessionId }) {
  const userRef = db.collection(HIVE_USERS).doc(userId);
  await ensureHiveUser(db, userId);
  const credit = Number(amountUsd) || 0;
  const now = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const bal = snap.data()?.creditBalanceUsd ?? 0;
    tx.update(userRef, {
      creditBalanceUsd: bal + credit,
      updatedAt: now,
    });
    tx.set(db.collection(HIVE_LEDGER).doc(), {
      userId,
      type: 'credit_purchase',
      amountUsd: credit,
      stripeSessionId,
      summary: `Added $${credit.toFixed(2)} credits`,
      createdAt: now,
    });
  });
}

export { HIVE_USERS, HIVE_LEDGER };
