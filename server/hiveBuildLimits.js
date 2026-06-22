/**
 * Guardrails so Hive + GitHub Actions usage stays under control.
 */

const HIVE_TASKS = 'hive_tasks';
const USAGE_DOC = 'hive_build_usage';

const MAX_DAILY_BUILDS = Number(process.env.HIVE_MAX_DAILY_BUILDS ?? 40);
const MAX_CONCURRENT = Number(process.env.HIVE_MAX_CONCURRENT_BUILDS ?? 6);
const MAX_PER_USER_DAY = Number(process.env.HIVE_MAX_BUILDS_PER_USER_DAY ?? 8);
const MAX_DAILY_USD = Number(process.env.HIVE_DAILY_USD_CAP ?? 50);
const MAX_PER_USER_USD = Number(process.env.HIVE_MAX_USD_PER_USER_DAY ?? 15);

function utcDayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function getBuildUsage(db) {
  const day = utcDayKey();
  const usageSnap = await db.collection(USAGE_DOC).doc(day).get().catch(() => null);
  const usage = usageSnap?.data() ?? { total: 0, byUser: {}, totalUsd: 0, byUserUsd: {} };

  const buildingSnap = await db.collection(HIVE_TASKS).where('status', '==', 'building').get().catch(() => null);
  const buildingNow = buildingSnap?.size ?? 0;

  return {
    day,
    approvedToday: usage.total ?? 0,
    approvedUsdToday: usage.totalUsd ?? 0,
    buildingNow,
    limits: {
      maxDailyBuilds: MAX_DAILY_BUILDS,
      maxConcurrentBuilds: MAX_CONCURRENT,
      maxPerUserPerDay: MAX_PER_USER_DAY,
      maxDailyUsd: MAX_DAILY_USD,
      maxPerUserUsd: MAX_PER_USER_USD,
    },
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} userId
 * @param {number} [costUsd] Approved cost to count toward the daily USD cap.
 */
export async function recordBuildStart(db, userId, costUsd = 0) {
  const day = utcDayKey();
  const ref = db.collection(USAGE_DOC).doc(day);
  const cost = Math.max(0, Number(costUsd) || 0);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : { total: 0, byUser: {}, totalUsd: 0, byUserUsd: {} };
    const byUser = { ...(data.byUser || {}) };
    const byUserUsd = { ...(data.byUserUsd || {}) };
    const uid = userId || 'anonymous';
    byUser[uid] = (byUser[uid] || 0) + 1;
    byUserUsd[uid] = (byUserUsd[uid] || 0) + cost;
    tx.set(ref, {
      total: (data.total || 0) + 1,
      totalUsd: (data.totalUsd || 0) + cost,
      byUser,
      byUserUsd,
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} userId
 * @param {number} [costUsd]
 */
export async function assertCanStartBuild(db, userId, costUsd = 0) {
  const usage = await getBuildUsage(db);
  const uid = userId || 'anonymous';
  const day = utcDayKey();
  const usageSnap = await db.collection(USAGE_DOC).doc(day).get().catch(() => null);
  const userToday = usageSnap?.data()?.byUser?.[uid] ?? 0;
  const userUsdToday = usageSnap?.data()?.byUserUsd?.[uid] ?? 0;
  const cost = Math.max(0, Number(costUsd) || 0);

  if (usage.buildingNow >= MAX_CONCURRENT) {
    return {
      ok: false,
      reason: `The Hive is at capacity (${MAX_CONCURRENT} builds running). Try again in a few minutes.`,
      usage: { ...usage, userBuildsToday: userToday, userUsdToday },
    };
  }

  if (usage.approvedToday >= MAX_DAILY_BUILDS) {
    return {
      ok: false,
      reason: `Daily build count reached (${MAX_DAILY_BUILDS}/day). Try again tomorrow.`,
      usage: { ...usage, userBuildsToday: userToday, userUsdToday },
    };
  }

  if ((usage.approvedUsdToday ?? 0) + cost > MAX_DAILY_USD) {
    return {
      ok: false,
      reason: `Daily Hive spend cap reached ($${MAX_DAILY_USD.toFixed(0)}). New builds resume tomorrow.`,
      usage: { ...usage, userBuildsToday: userToday, userUsdToday },
    };
  }

  if (uid !== 'anonymous' && userToday >= MAX_PER_USER_DAY) {
    return {
      ok: false,
      reason: `You've started ${MAX_PER_USER_DAY} builds today. Pick one to finish, or come back tomorrow.`,
      usage: { ...usage, userBuildsToday: userToday, userUsdToday },
    };
  }

  if (uid !== 'anonymous' && userUsdToday + cost > MAX_PER_USER_USD) {
    return {
      ok: false,
      reason: `You're at $${MAX_PER_USER_USD.toFixed(0)} of Hive builds today. Try again tomorrow or smaller scope.`,
      usage: { ...usage, userBuildsToday: userToday, userUsdToday },
    };
  }

  return { ok: true, usage: { ...usage, userBuildsToday: userToday, userUsdToday } };
}
