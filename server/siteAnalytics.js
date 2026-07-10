/**
 * Lightweight first-party site analytics — pageviews & click events.
 * No third-party trackers; stored in Firestore for the admin dashboard.
 */
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const EVENTS = 'site_analytics_events';
const DAILY = 'site_analytics_daily';

const ALLOWED_TYPES = new Set(['pageview', 'click', 'cta', 'nav', 'promo', 'custom']);

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function sanitizePath(path) {
  const p = String(path || '/').slice(0, 200);
  if (!p.startsWith('/')) return '/';
  return p.split('?')[0].split('#')[0] || '/';
}

function pathKey(path) {
  return (
    sanitizePath(path)
      .replace(/^\//, '')
      .replace(/\//g, '__')
      .replace(/\./g, '_')
      .slice(0, 120) || 'home'
  );
}

function pathFromKey(key) {
  if (!key || key === 'home') return '/';
  return `/${String(key).replace(/__/g, '/')}`;
}

export function hashIp(ip) {
  const salt = process.env.ANALYTICS_IP_SALT || 'aibhive-analytics';
  return crypto.createHash('sha256').update(`${salt}:${ip || ''}`).digest('hex').slice(0, 16);
}

/**
 * Record one or more client events (rate-limited by caller).
 */
export async function recordAnalyticsEvents(db, events, meta = {}) {
  const batch = db.batch();
  const now = new Date();
  const iso = now.toISOString();
  const day = dayKey(now);
  let count = 0;

  const list = Array.isArray(events) ? events.slice(0, 25) : [events];
  const pathCounts = new Map();
  const typeCounts = new Map();

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const type = ALLOWED_TYPES.has(raw.type) ? raw.type : 'custom';
    const path = sanitizePath(raw.path);
    const label = String(raw.label || raw.target || '').slice(0, 120);
    const ref = db.collection(EVENTS).doc();
    batch.set(ref, {
      type,
      path,
      label,
      href: String(raw.href || '').slice(0, 300),
      referrer: String(raw.referrer || meta.referrer || '').slice(0, 300),
      sessionId: String(raw.sessionId || meta.sessionId || '').slice(0, 64),
      userAgent: String(meta.userAgent || '').slice(0, 240),
      ipHash: meta.ipHash || '',
      createdAt: iso,
      day,
    });
    const pk = pathKey(path);
    pathCounts.set(pk, (pathCounts.get(pk) || 0) + 1);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    count += 1;
  }

  if (count === 0) return { ok: true, recorded: 0 };

  const dailyRef = db.collection(DAILY).doc(day);
  const increments = {
    totalEvents: FieldValue.increment(count),
    updatedAt: iso,
  };
  for (const [key, n] of pathCounts) {
    increments[`paths.${key}`] = FieldValue.increment(n);
  }
  for (const [type, n] of typeCounts) {
    increments[`types.${type}`] = FieldValue.increment(n);
  }
  if (typeCounts.get('pageview')) {
    increments.pageviews = FieldValue.increment(typeCounts.get('pageview'));
  }
  if (typeCounts.get('click') || typeCounts.get('cta') || typeCounts.get('nav')) {
    increments.clicks = FieldValue.increment(
      (typeCounts.get('click') || 0) + (typeCounts.get('cta') || 0) + (typeCounts.get('nav') || 0),
    );
  }
  batch.set(dailyRef, increments, { merge: true });

  await batch.commit();
  return { ok: true, recorded: count };
}

/**
 * Admin summary for last N days.
 */
export async function getAnalyticsSummary(db, { days = 14, recentLimit = 80 } = {}) {
  const dayCount = Math.min(60, Math.max(1, Number(days) || 14));
  const keys = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(dayKey(d));
  }

  const dailySnaps = await Promise.all(keys.map((k) => db.collection(DAILY).doc(k).get()));
  const daily = dailySnaps.map((snap, i) => {
    const data = snap.exists ? snap.data() : {};
    return {
      day: keys[i],
      pageviews: Number(data.pageviews) || 0,
      clicks: Number(data.clicks) || 0,
      totalEvents: Number(data.totalEvents) || 0,
      paths: data.paths || {},
      types: data.types || {},
    };
  });

  const pathTotals = new Map();
  let pageviews = 0;
  let clicks = 0;
  let totalEvents = 0;
  for (const d of daily) {
    pageviews += d.pageviews;
    clicks += d.clicks;
    totalEvents += d.totalEvents;
    for (const [key, n] of Object.entries(d.paths || {})) {
      const path = pathFromKey(key);
      pathTotals.set(path, (pathTotals.get(path) || 0) + Number(n || 0));
    }
  }

  const topPages = [...pathTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({ path, count }));

  let recent = [];
  try {
    const recentSnap = await db
      .collection(EVENTS)
      .orderBy('createdAt', 'desc')
      .limit(Math.min(200, recentLimit))
      .get();
    recent = recentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    recent = [];
  }

  let recentSpend = [];
  try {
    const spendSnap = await db.collection('hive_ledger').orderBy('createdAt', 'desc').limit(40).get();
    recentSpend = spendSnap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        userId: x.userId,
        type: x.type,
        feature: x.feature,
        amountUsd: x.amountUsd,
        summary: x.summary,
        promoCode: x.promoCode,
        createdAt: x.createdAt,
      };
    });
  } catch {
    recentSpend = [];
  }

  return {
    days: dayCount,
    totals: { pageviews, clicks, totalEvents },
    daily: daily.reverse(),
    topPages,
    recent,
    recentSpend,
  };
}
