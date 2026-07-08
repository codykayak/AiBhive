/**
 * Community research pool — opt-in contributions from users who share research.
 */

import { createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import {
  profileRef,
  mentionsCol,
  anomaliesCol,
  ingestionJobsCol,
  poolMentionsCol,
  poolAnomaliesCol,
  poolAnomalyCacheCol,
  poolStatsRef,
} from './paths.js';

const ESTIMATED_UNDISCOVERED_CATALOG = 48000;

function poolDocId(parts) {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 40);
}

function sanitizeMention(data) {
  return {
    entityName: data.entityName,
    entityId: data.entityId,
    entityType: data.entityType,
    role: data.role ?? null,
    project: data.project ?? null,
    year: data.year ?? null,
    location: data.location ?? null,
    sourceId: data.sourceId,
    sourceKind: data.sourceKind,
    sourceUrl: data.sourceUrl ?? null,
    sourceTitle: data.sourceTitle ?? null,
    excerpt: String(data.sourceExcerpt ?? '').slice(0, 280),
  };
}

function sanitizeAnomaly(data) {
  return {
    entityId: data.entityId,
    entityName: data.entityName,
    entityType: data.entityType,
    kind: data.kind,
    score: data.score,
    count: data.count,
    windowStartYear: data.windowStartYear,
    windowEndYear: data.windowEndYear,
    summary: data.summary,
    aiInsight: data.aiInsight ?? null,
    focusPrompt: data.focusPrompt ?? null,
  };
}

export async function isSharingEnabled(db, uid) {
  const snap = await profileRef(db, uid).get();
  return Boolean(snap.data()?.shareWithCommunity);
}

export async function setShareOptIn(db, uid, enabled) {
  await profileRef(db, uid).set({
    shareWithCommunity: Boolean(enabled),
    shareOptInAt: enabled ? FieldValue.serverTimestamp() : null,
  }, { merge: true });
  if (enabled) {
    await contributeUserData(db, uid);
  }
  return { ok: true, shareWithCommunity: Boolean(enabled) };
}

/** Copy recent user mentions + anomalies into the shared pool (deduped). */
export async function contributeUserData(db, uid) {
  if (!(await isSharingEnabled(db, uid))) return { contributed: 0 };

  let contributed = 0;
  const batch = db.batch();
  const mentionsSnap = await mentionsCol(db, uid).orderBy('createdAt', 'desc').limit(200).get();
  for (const doc of mentionsSnap.docs) {
    const data = sanitizeMention(doc.data());
    const id = poolDocId([data.entityId, data.sourceId, String(data.year), data.project ?? '']);
    batch.set(poolMentionsCol(db).doc(id), {
      ...data,
      poolId: id,
      contributedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    contributed++;
  }

  const anomaliesSnap = await anomaliesCol(db, uid).limit(50).get();
  for (const doc of anomaliesSnap.docs) {
    const data = sanitizeAnomaly(doc.data());
    const id = poolDocId([data.entityId, String(data.windowStartYear), data.kind]);
    batch.set(poolAnomaliesCol(db).doc(id), {
      ...data,
      poolId: id,
      contributedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    contributed++;
  }

  if (contributed) {
    await batch.commit();
    await poolStatsRef(db).set({
      lastContributionAt: FieldValue.serverTimestamp(),
      contributorCount: FieldValue.increment(1),
    }, { merge: true });
  }
  return { contributed };
}

export async function getPoolStats(db) {
  const [mentionsCount, anomaliesCount, statsSnap] = await Promise.all([
    poolMentionsCol(db).count().get(),
    poolAnomaliesCol(db).count().get(),
    poolStatsRef(db).get(),
  ]);
  const meta = statsSnap.exists ? statsSnap.data() : {};
  const pooledMentions = mentionsCount.data().count ?? 0;
  const pooledAnomalies = anomaliesCount.data().count ?? 0;
  const documentsIndexed = pooledMentions; // proxy: each mention ≈ one indexed doc excerpt

  return {
    pooledMentions,
    pooledAnomalies,
    documentsIndexed,
    contributorCount: meta.contributorCount ?? 0,
    undiscoveredEstimate: Math.max(0, ESTIMATED_UNDISCOVERED_CATALOG - documentsIndexed),
    catalogEstimate: ESTIMATED_UNDISCOVERED_CATALOG,
  };
}

export async function queryPooledAnomalies(db, limit = 30) {
  const snap = await poolAnomaliesCol(db).orderBy('score', 'desc').limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), fromPool: true }));
}

export function anomalyCacheKey(rules, customPrompt) {
  return poolDocId([
    JSON.stringify(rules ?? {}),
    String(customPrompt ?? '').trim().toLowerCase(),
  ]);
}

export async function getCachedAnomalyResult(db, cacheKey) {
  const snap = await poolAnomalyCacheCol(db).doc(cacheKey).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.expiresAt?.toDate?.() < new Date()) return null;
  return data;
}

export async function setCachedAnomalyResult(db, cacheKey, payload) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await poolAnomalyCacheCol(db).doc(cacheKey).set({
    ...payload,
    cacheKey,
    cachedAt: FieldValue.serverTimestamp(),
    expiresAt,
  }, { merge: true });
}