/**
 * Guardrails so Hive + GitHub Actions usage stays under control.
 */

const HIVE_TASKS = 'hive_tasks';
const USAGE_DOC = 'hive_build_usage';

const MAX_DAILY_BUILDS = Number(process.env.HIVE_MAX_DAILY_BUILDS ?? 8);
const MAX_CONCURRENT = Number(process.env.HIVE_MAX_CONCURRENT_BUILDS ?? 2);
const MAX_PER_USER_DAY = Number(process.env.HIVE_MAX_BUILDS_PER_USER_DAY ?? 3);

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
  const usage = usageSnap?.data() ?? { total: 0, byUser: {} };

  const buildingSnap = await db.collection(HIVE_TASKS).where('status', '==', 'building').get().catch(() => null);
  const buildingNow = buildingSnap?.size ?? 0;

  return {
    day,
    approvedToday: usage.total ?? 0,
    buildingNow,
    limits: {
      maxDailyBuilds: MAX_DAILY_BUILDS,
      maxConcurrentBuilds: MAX_CONCURRENT,
      maxPerUserPerDay: MAX_PER_USER_DAY,
    },
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} userId
 */
export async function recordBuildStart(db, userId) {
  const day = utcDayKey();
  const ref = db.collection(USAGE_DOC).doc(day);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : { total: 0, byUser: {} };
    const byUser = { ...(data.byUser || {}) };
    const uid = userId || 'anonymous';
    byUser[uid] = (byUser[uid] || 0) + 1;
    tx.set(ref, {
      total: (data.total || 0) + 1,
      byUser,
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} userId
 */
export async function assertCanStartBuild(db, userId) {
  const usage = await getBuildUsage(db);
  const uid = userId || 'anonymous';
  const day = utcDayKey();
  const usageSnap = await db.collection(USAGE_DOC).doc(day).get().catch(() => null);
  const userToday = usageSnap?.data()?.byUser?.[uid] ?? 0;

  if (usage.buildingNow >= MAX_CONCURRENT) {
    return {
      ok: false,
      reason: `The Hive is at capacity (${MAX_CONCURRENT} builds running). Try again in a few minutes.`,
      usage: { ...usage, userBuildsToday: userToday },
    };
  }

  if (usage.approvedToday >= MAX_DAILY_BUILDS) {
    return {
      ok: false,
      reason: `Daily build limit reached (${MAX_DAILY_BUILDS}/day). We're protecting repo capacity — try again tomorrow.`,
      usage: { ...usage, userBuildsToday: userToday },
    };
  }

  if (uid !== 'anonymous' && userToday >= MAX_PER_USER_DAY) {
    return {
      ok: false,
      reason: `You've started ${MAX_PER_USER_DAY} builds today. Pick one to finish, or come back tomorrow.`,
      usage: { ...usage, userBuildsToday: userToday },
    };
  }

  return { ok: true, usage: { ...usage, userBuildsToday: userToday } };
}
