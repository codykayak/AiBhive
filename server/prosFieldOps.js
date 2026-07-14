/**
 * Pros field ops — periodic GPS pings + manager→tech notifications.
 */

import admin from 'firebase-admin';

function FieldValue() {
  return admin.firestore.FieldValue;
}

const DEFAULT_PING_MINUTES = 15;
const MIN_PING_MINUTES = 5;
const MAX_PING_MINUTES = 60;

export function normalizePingInterval(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n)) return DEFAULT_PING_MINUTES;
  return Math.min(MAX_PING_MINUTES, Math.max(MIN_PING_MINUTES, Math.round(n)));
}

export function serializeLocation(uid, data, member) {
  return {
    uid,
    displayName: data.displayName || member?.displayName || member?.email || 'Tech',
    email: member?.email || data.email || null,
    lat: typeof data.lat === 'number' ? data.lat : null,
    lng: typeof data.lng === 'number' ? data.lng : null,
    accuracyM: typeof data.accuracyM === 'number' ? data.accuracyM : null,
    heading: typeof data.heading === 'number' ? data.heading : null,
    speedMps: typeof data.speedMps === 'number' ? data.speedMps : null,
    onJobId: data.onJobId || null,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? null,
    stale: false,
  };
}

export function serializeNotification(id, data) {
  return {
    id,
    title: data.title || '',
    body: data.body || '',
    type: data.type || 'job_update',
    priority: data.priority || 'normal',
    jobId: data.jobId || null,
    jobTitle: data.jobTitle || null,
    assigneeUid: data.assigneeUid || null,
    assigneeName: data.assigneeName || null,
    status: data.status || 'pending',
    response: data.response || null,
    createdByUid: data.createdByUid || null,
    createdByEmail: data.createdByEmail || null,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? null,
    respondedAt: data.respondedAt?.toMillis?.() ?? data.respondedAt ?? null,
  };
}

export async function isLocationTrackingEnabled(db, companyId) {
  const snap = await db.collection('pros_companies').doc(companyId).get();
  const settings = snap.data()?.settings || {};
  return Boolean(settings.locationTrackingEnabled);
}

export async function recordLocationPing(db, companyId, uid, payload, member) {
  const enabled = await isLocationTrackingEnabled(db, companyId);
  if (!enabled) {
    return { ok: false, reason: 'tracking_disabled' };
  }

  const lat = Number(payload.lat);
  const lng = Number(payload.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, reason: 'invalid_coordinates' };
  }

  const ref = db.collection('pros_companies').doc(companyId).collection('member_locations').doc(uid);
  await ref.set(
    {
      uid,
      lat,
      lng,
      accuracyM: Number.isFinite(Number(payload.accuracyM)) ? Number(payload.accuracyM) : null,
      heading: Number.isFinite(Number(payload.heading)) ? Number(payload.heading) : null,
      speedMps: Number.isFinite(Number(payload.speedMps)) ? Number(payload.speedMps) : null,
      onJobId: payload.onJobId || null,
      displayName: member?.displayName || member?.email || 'Tech',
      email: member?.email || null,
      updatedAt: FieldValue().serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
}

export async function listTeamLocations(db, companyId, members, staleAfterMs = 45 * 60 * 1000) {
  const snap = await db.collection('pros_companies').doc(companyId).collection('member_locations').get();
  const byUid = new Map(snap.docs.map((d) => [d.id, d.data()]));
  const now = Date.now();

  return members
    .filter((m) => m.status !== 'inactive' && m.role !== 'owner')
    .map((m) => {
      const data = byUid.get(m.uid);
      if (!data) {
        return {
          uid: m.uid,
          displayName: m.displayName || m.email || 'Tech',
          email: m.email || null,
          lat: null,
          lng: null,
          accuracyM: null,
          updatedAt: null,
          stale: true,
          onJobId: null,
        };
      }
      const row = serializeLocation(m.uid, data, m);
      row.stale = !row.updatedAt || now - row.updatedAt > staleAfterMs;
      return row;
    });
}

export async function createProsNotification(db, companyId, actor, payload) {
  const ref = db.collection('pros_companies').doc(companyId).collection('notifications').doc();
  const doc = {
    title: String(payload.title || '').trim(),
    body: String(payload.body || '').trim(),
    type: ['job_update', 'announcement', 'dispatch'].includes(payload.type) ? payload.type : 'job_update',
    priority: ['normal', 'high', 'urgent'].includes(payload.priority) ? payload.priority : 'normal',
    jobId: payload.jobId || null,
    jobTitle: payload.jobTitle || null,
    assigneeUid: payload.assigneeUid || null,
    assigneeName: payload.assigneeName || null,
    status: 'pending',
    response: null,
    createdByUid: actor.uid,
    createdByEmail: actor.email || null,
    createdAt: FieldValue().serverTimestamp(),
  };
  if (!doc.title) throw new Error('Notification title required');
  await ref.set(doc);
  return { id: ref.id, ...doc, createdAt: Date.now() };
}

export async function respondToNotification(db, companyId, notificationId, uid, body) {
  const ref = db.collection('pros_companies').doc(companyId).collection('notifications').doc(notificationId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, reason: 'not_found' };
  const data = snap.data();
  if (data.assigneeUid && data.assigneeUid !== uid) return { ok: false, reason: 'not_assignee' };

  const completed = Boolean(body.completed);
  const fixSummary = String(body.fixSummary || '').trim();
  const response = {
    completed,
    fixSummary,
    tipText: String(body.tipText || '').trim() || null,
    respondedByUid: uid,
  };

  await ref.set(
    {
      status: completed ? 'completed' : 'declined',
      response,
      respondedAt: FieldValue().serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, response, jobId: data.jobId || null };
}

export async function ingestManualChunks(db, companyId, payload, { global = false } = {}) {
  const col = global
    ? db.collection('pros_global_manual_chunks')
    : db.collection('pros_companies').doc(companyId).collection('manual_chunks');

  const manualId = payload.manualId || `manual-${Date.now()}`;
  const chunks = Array.isArray(payload.chunks) ? payload.chunks : [];
  if (!chunks.length) throw new Error('At least one text chunk required');

  let written = 0;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const text = String(c.text || '').trim();
    if (!text) continue;
    const ref = col.doc();
    await ref.set({
      id: ref.id,
      manualId,
      brand: String(payload.brand || '').trim(),
      title: String(payload.title || '').trim(),
      packId: payload.packId || 'pool',
      modelPrefixes: Array.isArray(payload.modelPrefixes) ? payload.modelPrefixes.slice(0, 12) : [],
      sourceUrl: payload.sourceUrl || null,
      page: c.page || i + 1,
      text: text.slice(0, 12000),
      status: 'active',
      companyId: global ? null : companyId,
      createdAt: FieldValue().serverTimestamp(),
    });
    written += 1;
  }
  if (!written) throw new Error('No valid chunk text');
  return { manualId, chunksWritten: written };
}

export async function buildProsAnalytics(db, companyId) {
  const companyRef = db.collection('pros_companies').doc(companyId);
  const [tipsSnap, feedbackSnap, chunksSnap, jobsSnap, activitySnap] = await Promise.all([
    companyRef.collection('knowledge_tips').get(),
    companyRef.collection('knowledge_feedback').get(),
    companyRef.collection('manual_chunks').where('status', '==', 'active').get(),
    companyRef.collection('jobs').get(),
    companyRef.collection('activity').orderBy('createdAt', 'desc').limit(500).get(),
  ]);

  const jobs = jobsSnap.docs.map((d) => d.data());
  const jobsDone = jobs.filter((j) => j.status === 'done').length;
  const fieldNotes = jobs.reduce((sum, j) => sum + (j.fieldNotes?.length || 0), 0);

  const monthKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const buckets = new Map();
  const bump = (key, field) => {
    const row = buckets.get(key) || { month: key, tips: 0, feedback: 0, jobsDone: 0, activity: 0 };
    row[field] += 1;
    buckets.set(key, row);
  };

  for (const doc of tipsSnap.docs) {
    const t = doc.data().createdAt?.toMillis?.() ?? doc.data().createdAt ?? Date.now();
    bump(monthKey(t), 'tips');
  }
  for (const doc of feedbackSnap.docs) {
    const t = doc.data().createdAt?.toMillis?.() ?? doc.data().createdAt ?? Date.now();
    bump(monthKey(t), 'feedback');
  }
  for (const doc of jobsSnap.docs) {
    const j = doc.data();
    if (j.status === 'done') {
      const t = j.completedAt?.toMillis?.() ?? j.updatedAt?.toMillis?.() ?? j.updatedAt ?? Date.now();
      bump(monthKey(t), 'jobsDone');
    }
  }
  for (const doc of activitySnap.docs) {
    const t = doc.data().createdAt?.toMillis?.() ?? Date.now();
    bump(monthKey(t), 'activity');
  }

  const knowledgeGrowth = [...buckets.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-8)
    .map((row) => ({
      month: row.month,
      label: new Date(`${row.month}-01T12:00:00`).toLocaleString('en-US', { month: 'short' }),
      tips: row.tips,
      feedback: row.feedback,
      jobsDone: row.jobsDone,
      activity: row.activity,
    }));

  const { getDiagnoseOperationCostRates } = await import('./diagnoseBilling.js');
  const rates = getDiagnoseOperationCostRates();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let grokRawUsd = 0;
  let ttsRawUsd = 0;
  let transcribeRawUsd = 0;
  let totalRawUsd = 0;
  let countedOps = 0;

  for (const doc of activitySnap.docs) {
    const data = doc.data();
    const createdAt = data.createdAt?.toMillis?.() ?? 0;
    if (createdAt && createdAt < thirtyDaysAgo) continue;
    const cost = Number(data.rawCostUsd);
    if (!Number.isFinite(cost) || cost <= 0) continue;
    totalRawUsd += cost;
    countedOps += 1;
    if (data.type === 'diagnose_ai') grokRawUsd += cost;
    else if (data.type === 'diagnose_tts') ttsRawUsd += cost;
    else if (data.type === 'diagnose_transcribe') transcribeRawUsd += cost;
  }

  return {
    totals: {
      tips: tipsSnap.size,
      feedback: feedbackSnap.size,
      manualChunks: chunksSnap.size,
      jobsTotal: jobs.length,
      jobsDone,
      fieldNotes,
      openJobs: jobs.filter((j) => j.status !== 'done').length,
    },
    knowledgeGrowth,
    featuredTip: await pickFeaturedTip(db, companyId),
    platformCosts: {
      windowDays: 30,
      countedOps,
      grokRawUsd: Math.round(grokRawUsd * 10000) / 10000,
      ttsRawUsd: Math.round(ttsRawUsd * 10000) / 10000,
      transcribeRawUsd: Math.round(transcribeRawUsd * 10000) / 10000,
      totalRawUsd: Math.round(totalRawUsd * 10000) / 10000,
      rates,
      typicalDiagnoseWithVoiceUsd: rates.typicalDiagnoseWithVoiceUsd,
    },
  };
}

async function pickFeaturedTip(db, companyId) {
  const tipsSnap = await db
    .collection('pros_companies')
    .doc(companyId)
    .collection('knowledge_tips')
    .where('status', '==', 'active')
    .limit(40)
    .get();

  const tips = tipsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0) || (Number(b.createdAt?.toMillis?.() || 0) - Number(a.createdAt?.toMillis?.() || 0)));

  const top = tips[0];
  if (!top?.text) return null;
  return {
    id: top.id,
    text: String(top.text).slice(0, 280),
    fixSummary: top.fixSummary ? String(top.fixSummary).slice(0, 200) : null,
    packId: top.packId || 'pool',
    helpfulCount: Number(top.score) || 0,
  };
}
