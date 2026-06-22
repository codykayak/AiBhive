/**
 * Hive platform billing — pay-for-what-you-use accounts.
 * Each mobile install gets a hive_user_id; balance stored in Firestore.
 */
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
  const doc = {
    userId,
    creditBalanceUsd: Number(process.env.HIVE_WELCOME_CREDIT_USD ?? 15),
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
    userId: user.userId,
    creditBalanceUsd: user.creditBalanceUsd ?? 0,
    totalSpentUsd: user.totalSpentUsd ?? 0,
    buildCount: user.buildCount ?? 0,
    recentActivity,
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
            name: 'Taylored Hive Credits',
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
