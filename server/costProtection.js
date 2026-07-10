/**
 * Platform cost protection — daily spend caps, concurrency, and IP rate limits.
 * Mirrors hiveBuildLimits.js for Research Lab / OCR / scrape / harvest.
 */
const USAGE_COL = 'platform_cost_usage';

const MAX_PLATFORM_DAILY_USD = Number(process.env.PLATFORM_DAILY_USD_CAP ?? 200);
const MAX_USER_DAILY_USD = Number(process.env.PLATFORM_MAX_USD_PER_USER_DAY ?? 25);
const MAX_CONCURRENT_JOBS = Number(process.env.PLATFORM_MAX_CONCURRENT_JOBS ?? 2);
const MAX_OCR_IMAGES = Number(process.env.OCR_MAX_IMAGES ?? 50);
const MAX_CRAWL_PAGES = Number(process.env.FABLE_MAX_CRAWL_PAGES ?? 20);
const MAX_HARVEST_FINDINGS = Number(process.env.FABLE_MAX_HARVEST_FINDINGS ?? 8);
const MAX_TRANSLATE_CHARS = Number(process.env.FABLE_MAX_TRANSLATE_CHARS ?? 8000);

/** When false (default in production), unmetered public OCR/Fable/Firecrawl are blocked. */
export function allowPublicPlatformAi() {
  if (process.env.ALLOW_PUBLIC_PLATFORM_AI === 'true') return true;
  if (process.env.ALLOW_PUBLIC_PLATFORM_AI === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export function allowTestCheckout() {
  if (process.env.ALLOW_TEST_CHECKOUT === 'true') return true;
  if (process.env.ALLOW_TEST_CHECKOUT === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export function getCostProtectionLimits() {
  return {
    maxPlatformDailyUsd: MAX_PLATFORM_DAILY_USD,
    maxUserDailyUsd: MAX_USER_DAILY_USD,
    maxConcurrentJobs: MAX_CONCURRENT_JOBS,
    maxOcrImages: MAX_OCR_IMAGES,
    maxCrawlPages: MAX_CRAWL_PAGES,
    maxHarvestFindings: MAX_HARVEST_FINDINGS,
    maxTranslateChars: MAX_TRANSLATE_CHARS,
    allowPublicPlatformAi: allowPublicPlatformAi(),
  };
}

function utcDayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** In-memory IP rate buckets (per process / Cloud Run instance). */
const ipBuckets = new Map();

/**
 * Simple sliding window: max `limit` hits per `windowMs` for a key.
 * @returns {{ ok: true } | { ok: false, retryAfterSec: number }}
 */
export function assertIpRateLimit(key, limit, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const bucket = ipBuckets.get(key) || { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { ok: false, retryAfterSec };
  }
  bucket.hits.push(now);
  ipBuckets.set(key, bucket);
  // Bound map size
  if (ipBuckets.size > 5000) {
    const first = ipBuckets.keys().next().value;
    ipBuckets.delete(first);
  }
  return { ok: true };
}

export function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return xf || req.ip || req.socket?.remoteAddress || 'unknown';
}

/** In-flight job counters per user (process-local). */
const inflight = new Map();

export function beginUserJob(userId) {
  const uid = userId || 'anonymous';
  const n = inflight.get(uid) || 0;
  if (n >= MAX_CONCURRENT_JOBS) {
    return {
      ok: false,
      reason: `Too many jobs running (max ${MAX_CONCURRENT_JOBS}). Wait for one to finish.`,
    };
  }
  inflight.set(uid, n + 1);
  return { ok: true, uid };
}

export function endUserJob(userId) {
  const uid = userId || 'anonymous';
  const n = inflight.get(uid) || 0;
  if (n <= 1) inflight.delete(uid);
  else inflight.set(uid, n - 1);
}

/**
 * Check + optionally reserve daily USD spend (platform + per-user).
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} userId
 * @param {number} costUsd marked-up USD about to spend
 * @param {{ reserve?: boolean }} [opts]
 */
export async function assertDailySpendCap(db, userId, costUsd, opts = {}) {
  const cost = Math.max(0, Number(costUsd) || 0);
  if (cost === 0 && !opts.reserve) {
    return { ok: true };
  }

  const day = utcDayKey();
  const ref = db.collection(USAGE_COL).doc(day);
  const uid = userId || 'anonymous';

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists
        ? snap.data()
        : { totalUsd: 0, byUserUsd: {}, requestCount: 0 };
      const totalUsd = Number(data.totalUsd) || 0;
      const byUserUsd = { ...(data.byUserUsd || {}) };
      const userUsd = Number(byUserUsd[uid]) || 0;

      if (totalUsd + cost > MAX_PLATFORM_DAILY_USD) {
        return {
          ok: false,
          reason: `Platform daily spend cap reached ($${MAX_PLATFORM_DAILY_USD}). Resumes tomorrow UTC.`,
        };
      }
      if (uid !== 'anonymous' && userUsd + cost > MAX_USER_DAILY_USD) {
        return {
          ok: false,
          reason: `Your daily Research Lab spend cap is $${MAX_USER_DAILY_USD}. Try again tomorrow or narrow the job.`,
        };
      }

      if (opts.reserve && cost > 0) {
        byUserUsd[uid] = userUsd + cost;
        tx.set(
          ref,
          {
            totalUsd: totalUsd + cost,
            byUserUsd,
            requestCount: (Number(data.requestCount) || 0) + 1,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }

      return {
        ok: true,
        day,
        totalUsd,
        userUsd,
        limits: getCostProtectionLimits(),
      };
    });
    return result;
  } catch (err) {
    console.error('[costProtection] assertDailySpendCap', err.message || err);
    // Fail closed on Firestore errors for expensive paths
    return {
      ok: false,
      reason: 'Could not verify spend caps. Try again in a moment.',
    };
  }
}

/**
 * Express middleware: block unmetered public platform-AI routes in production.
 */
export function requirePublicPlatformAiAllowed(req, res, next) {
  if (allowPublicPlatformAi()) return next();
  return res.status(401).json({
    error:
      'This endpoint is disabled for anonymous use. Sign in to Research Lab (/research-lab/workspace) where jobs are metered with Hive credits.',
    code: 'PUBLIC_PLATFORM_AI_DISABLED',
  });
}

/**
 * Express middleware: IP rate limit for expensive public routes.
 * @param {number} limit
 * @param {number} [windowMs]
 * @param {string} [bucket]
 */
export function ipRateLimitMiddleware(limit, windowMs = 60 * 60 * 1000, bucket = 'platform') {
  return (req, res, next) => {
    const ip = clientIp(req);
    const check = assertIpRateLimit(`${bucket}:${ip}`, limit, windowMs);
    if (!check.ok) {
      res.setHeader('Retry-After', String(check.retryAfterSec));
      return res.status(429).json({
        error: `Rate limit exceeded. Try again in ~${check.retryAfterSec}s.`,
        code: 'RATE_LIMIT',
      });
    }
    return next();
  };
}

export {
  MAX_OCR_IMAGES,
  MAX_CRAWL_PAGES,
  MAX_HARVEST_FINDINGS,
  MAX_TRANSLATE_CHARS,
  MAX_PLATFORM_DAILY_USD,
  MAX_USER_DAILY_USD,
  MAX_CONCURRENT_JOBS,
};
