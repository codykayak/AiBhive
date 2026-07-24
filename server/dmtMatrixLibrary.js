/**
 * DMT Matrix communal decode library — public research + community contributions.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';

const LIBRARY = 'dmt_matrix_library';
const CONTRIBUTIONS = 'dmt_matrix_contributions';
const STATS = 'dmt_matrix_library_stats';

function clip(s, n) {
  return String(s || '').slice(0, n);
}

function serializeEntry(doc) {
  const d = doc.data() || {};
  const created = d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || null;
  const updated = d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt || null;
  return {
    id: doc.id,
    ...d,
    createdAt: created,
    updatedAt: updated,
  };
}

async function bumpStats(db, field, delta = 1) {
  await db
    .collection(STATS)
    .doc('global')
    .set(
      {
        [field]: FieldValue.increment(delta),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/**
 * Publish a corpus research report to the communal library (public by default).
 */
export async function publishResearchToLibrary(db, report, { uid, email, contributor, visibility = 'public' }) {
  if (!db || !report) return null;
  const ref = db.collection(LIBRARY).doc(report.reportId || randomUUID());
  const promising = (report.promisingMatches || []).slice(0, 12);
  const title =
    report.synthesis?.headline ||
    `Corpus decode · ${report.stats?.symbolCount || 0} glyphs · ${promising.length} script matches`;

  const entry = {
    type: 'corpus_research',
    title: clip(title, 200),
    headline: clip(report.synthesis?.headline || title, 300),
    summary: clip(report.synthesis?.summary || '', 4000),
    contributor: clip(contributor || email?.split('@')[0] || 'researcher', 80),
    publishedBy: uid || null,
    contributorEmail: email ? clip(email, 120) : null,
    visibility: visibility === 'private' ? 'private' : 'public',
    reportId: report.reportId,
    classification: report.assessment?.classification || null,
    classificationConfidence: report.assessment?.confidence ?? null,
    classificationRationale: (report.assessment?.rationale || []).slice(0, 6),
    shannonEntropy: report.stats?.shannonEntropy ?? null,
    symbolCount: report.stats?.symbolCount ?? null,
    registryCount: report.stats?.registryCount ?? null,
    promisingMatches: promising,
    frequencyRanking: (report.stats?.frequencyRanking || []).slice(0, 12),
    topBigrams: (report.stats?.topBigrams || []).slice(0, 8),
    namingHypotheses: (report.synthesis?.namingHypotheses || []).slice(0, 8),
    nextExperiments: (report.synthesis?.nextExperiments || []).slice(0, 6),
    glyphsCompared: report.budget?.glyphsCompared ?? null,
    apiSpentUsd: report.budget?.apiSpentUsd ?? null,
    confidenceInStructuredLanguage: report.synthesis?.confidenceInStructuredLanguage ?? null,
    upvoteCount: 0,
    contributionCount: 0,
    tags: ['corpus-research', 'dmt-code', '650nm'],
    status: 'published',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(entry, { merge: true });
  await bumpStats(db, 'researchCount');
  await bumpStats(db, 'totalEntries');
  return {
    id: ref.id,
    type: entry.type,
    title: entry.title,
    reportId: report.reportId,
    sharePath: `/research-lab/dmt-matrix-library/${ref.id}`,
  };
}

/**
 * Publish a photo decode session summary to the communal library.
 */
export async function publishDecodeToLibrary(db, result, { uid, email, contributor, visibility = 'public', notes = '' }) {
  if (!db || !result) return null;
  const ref = db.collection(LIBRARY).doc(result.sessionId || randomUUID());
  const merged = (result.merged || []).slice(0, 24);
  const tokens = result.syntax?.tokenSequence || merged.map((m) => m.tokenId || m.symbolId).filter(Boolean);

  const entry = {
    type: 'photo_decode',
    title: clip(
      `Matrix photo · ${merged.length} glyph${merged.length === 1 ? '' : 's'} detected`,
      200,
    ),
    headline: clip(result.vision?.summary || `Photo decode with ${merged.length} detections`, 300),
    summary: clip(
      [result.vision?.decodeNotes, result.vision?.matrixStructure && `Structure: ${result.vision.matrixStructure}`, notes]
        .filter(Boolean)
        .join(' · '),
      4000,
    ),
    contributor: clip(contributor || email?.split('@')[0] || 'observer', 80),
    publishedBy: uid || null,
    contributorEmail: email ? clip(email, 120) : null,
    visibility: visibility === 'private' ? 'private' : 'public',
    sessionId: result.sessionId,
    detectionCount: merged.length,
    merged: merged.map((m) => ({
      symbolId: m.symbolId,
      tokenId: m.tokenId,
      name: m.name,
      confidence: m.confidence,
      method: m.method || m.source,
      catalogDescription: m.catalogDescription,
    })),
    tokenSequence: tokens.slice(0, 32),
    shannonEntropy: result.syntax?.shannonEntropy ?? null,
    spatialLayout: result.syntax?.spatialGraph?.layoutType || null,
    researchFlags: (result.vision?.researchFlags || []).slice(0, 8),
    upvoteCount: 0,
    contributionCount: 0,
    tags: ['photo-decode', 'dmt-code', '650nm'],
    status: 'published',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(entry, { merge: true });
  await bumpStats(db, 'decodeCount');
  await bumpStats(db, 'totalEntries');
  return {
    id: ref.id,
    type: entry.type,
    title: entry.title,
    sessionId: result.sessionId,
    sharePath: `/research-lab/dmt-matrix-library/${ref.id}`,
  };
}

/**
 * List public library entries (newest first).
 */
export async function listDmtLibrary(db, { limit = 40, type, q, viewerUid } = {}) {
  const cap = Math.min(Math.max(Number(limit) || 40, 1), 100);
  let snap;
  try {
    if (type) {
      snap = await db
        .collection(LIBRARY)
        .where('visibility', '==', 'public')
        .where('type', '==', type)
        .orderBy('createdAt', 'desc')
        .limit(cap)
        .get();
    } else {
      snap = await db
        .collection(LIBRARY)
        .where('visibility', '==', 'public')
        .orderBy('createdAt', 'desc')
        .limit(cap)
        .get();
    }
  } catch {
    snap = await db.collection(LIBRARY).orderBy('createdAt', 'desc').limit(cap).get();
  }

  let entries = snap.docs.map(serializeEntry).filter((e) => e.visibility !== 'private' || e.publishedBy === viewerUid);

  if (q?.trim()) {
    const hay = q.trim().toLowerCase();
    entries = entries.filter(
      (e) =>
        String(e.title || '').toLowerCase().includes(hay) ||
        String(e.summary || '').toLowerCase().includes(hay) ||
        String(e.contributor || '').toLowerCase().includes(hay) ||
        (e.promisingMatches || []).some(
          (m) =>
            String(m.script || '').toLowerCase().includes(hay) ||
            String(m.glyphName || '').toLowerCase().includes(hay),
        ),
    );
  }

  return entries;
}

export async function getDmtLibraryEntry(db, id, { viewerUid } = {}) {
  const doc = await db.collection(LIBRARY).doc(id).get();
  if (!doc.exists) return null;
  const entry = serializeEntry(doc);
  if (entry.visibility === 'private' && entry.publishedBy !== viewerUid) return null;
  return entry;
}

export async function getDmtLibraryStats(db) {
  const snap = await db.collection(STATS).doc('global').get();
  const d = snap.data() || {};
  const libSnap = await db.collection(LIBRARY).where('visibility', '==', 'public').count().get();
  return {
    totalEntries: libSnap.data()?.count ?? d.totalEntries ?? 0,
    researchCount: d.researchCount ?? 0,
    decodeCount: d.decodeCount ?? 0,
    contributionCount: d.contributionCount ?? 0,
  };
}

/**
 * Community contribution: naming hypothesis, correction, or confirmation.
 */
export async function contributeToDmtEntry(
  db,
  entryId,
  { uid, email, contributor, kind, payload },
) {
  const entryRef = db.collection(LIBRARY).doc(entryId);
  const entrySnap = await entryRef.get();
  if (!entrySnap.exists) throw new Error('Library entry not found.');

  const kindNorm = ['naming', 'correction', 'confirmation', 'note'].includes(kind) ? kind : 'note';
  const contribRef = db.collection(CONTRIBUTIONS).doc();

  const contribution = {
    entryId,
    kind: kindNorm,
    contributor: clip(contributor || email?.split('@')[0] || 'community', 80),
    userId: uid,
    email: email ? clip(email, 120) : null,
    name: clip(payload?.name, 120),
    glyphId: clip(payload?.glyphId, 80),
    tokenId: clip(payload?.tokenId, 40),
    script: clip(payload?.script, 80),
    text: clip(payload?.text || payload?.note, 2000),
    original: clip(payload?.original, 2000),
    corrected: clip(payload?.corrected, 2000),
    createdAt: FieldValue.serverTimestamp(),
  };

  await contribRef.set(contribution);
  await entryRef.update({
    contributionCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await bumpStats(db, 'contributionCount');

  if (kindNorm === 'naming' && payload?.name) {
    await entryRef.update({
      namingHypotheses: FieldValue.arrayUnion({
        name: payload.name,
        glyphIds: payload.glyphId ? [payload.glyphId] : [],
        rationale: clip(payload?.text, 500),
        contributor: contribution.contributor,
        community: true,
      }),
    });
  }

  return { id: contribRef.id, ...contribution };
}

export async function listContributions(db, entryId, limit = 30) {
  const snap = await db
    .collection(CONTRIBUTIONS)
    .where('entryId', '==', entryId)
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit, 50))
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    const created = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
    return { id: d.id, ...data, createdAt: created };
  });
}

export async function upvoteDmtEntry(db, entryId, uid) {
  const voteRef = db.collection(LIBRARY).doc(entryId).collection('votes').doc(uid);
  const existing = await voteRef.get();
  if (existing.exists) return { ok: true, already: true };
  await voteRef.set({ uid, createdAt: FieldValue.serverTimestamp() });
  await db
    .collection(LIBRARY)
    .doc(entryId)
    .update({ upvoteCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
}
