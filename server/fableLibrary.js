/**
 * Fable Scrape — communal research library.
 * Supports topic tagging, visibility, search, corrections, and fork-into-project.
 */
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'fable_library';
const GLOSSARY = 'fable_glossary_corrections';
const TOPIC_STATS = 'fable_topic_stats';

const KNOWN_TOPICS = new Set([
  'hieroglyphics',
  'cuneiform',
  'mud-flood',
  'tartarian',
  'orphan-trains',
  'legal-research',
  'homeopathic',
  'mycology',
  'quantum',
  'world-fairs',
  'star-forts',
  'ancient-maps',
  'botanicals',
  'medical-holistic',
  'academia',
  'translation',
  'cathedral',
  'free-energy',
  'giants',
  'sound-healing',
  'alchemy',
  'ley-lines',
  'nag-hammadi',
  'general',
]);

function clip(s, n) {
  return String(s || '').slice(0, n);
}

function friendlyDbError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/default credentials|GOOGLE_APPLICATION_CREDENTIALS|could not load/i.test(msg)) {
    return new Error('Communal library storage is not configured on this server (Firestore credentials missing).');
  }
  if (/permission|PERMISSION_DENIED|NOT_FOUND/i.test(msg)) {
    return new Error('Communal library storage is unavailable (Firestore permission/database issue).');
  }
  return err instanceof Error ? err : new Error(msg);
}

function normalizeTopic(topic) {
  const t = String(topic || 'general')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
  return KNOWN_TOPICS.has(t) ? t : 'general';
}

function serializeEntry(doc) {
  const d = doc.data() || {};
  const created = d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null;
  const updated = d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : null;
  return {
    id: doc.id,
    title: d.title || 'Untitled',
    prompt: d.prompt || '',
    sourceUrl: d.sourceUrl || '',
    imageUrl: d.imageUrl || '',
    filename: d.filename || '',
    ocrText: d.ocrText || '',
    translation: d.translation || '',
    targetLang: d.targetLang || '',
    reason: d.reason || '',
    confidence: d.confidence ?? null,
    roles: d.roles || {},
    contributor: d.contributor || 'anonymous',
    publishedBy: d.publishedBy || null,
    topicId: d.topicId || 'general',
    visibility: d.visibility || 'public',
    shareToken: d.shareToken || null,
    provenance: d.provenance || {},
    correctionCount: d.correctionCount || 0,
    createdAt: created,
    updatedAt: updated,
  };
}

/**
 * Infer a communal topic from prompt/title/text when the client does not send one.
 */
export function inferTopicId({ prompt, title, text } = {}) {
  const hay = `${prompt || ''} ${title || ''} ${String(text || '').slice(0, 800)}`.toLowerCase();
  const rules = [
    [/hieroglyph|egyptian|cartouche/, 'hieroglyphics'],
    [/cuneiform|sumerian|akkadian|wedge/, 'cuneiform'],
    [/mud.?flood|window.?line|buried.?story/, 'mud-flood'],
    [/tartar|tartaria|old.?world.?architecture/, 'tartarian'],
    [/orphan.?train/, 'orphan-trains'],
    [/docket|exhibit|deposition|case.?law|legal/, 'legal-research'],
    [/homeopath|materia.?medica|remedy/, 'homeopathic'],
    [/mycolog|mushroom|fung(i|al)/, 'mycology'],
    [/quantum|entangle|wave.?function/, 'quantum'],
    [/world.?fair|exposition|pavilion/, 'world-fairs'],
    [/star.?fort|bastion|vauban/, 'star-forts'],
    [/sanborn|portolan|ancient.?map|cartograph/, 'ancient-maps'],
    [/botanic|herbarium|ethnobotan/, 'botanicals'],
    [/holistic|integrative.?medic|protocol/, 'medical-holistic'],
    [/dissert|scholar|literature.?review|corpus/, 'academia'],
    [/translat|glossar|script/, 'translation'],
    [/cathedral|floor.?plan|nave/, 'cathedral'],
    [/free.?energy|suppressed.?tech|tesla/, 'free-energy'],
    [/giant.?skeleton|mound.?builder/, 'giants'],
    [/frequenc|sound.?heal|acoust/, 'sound-healing'],
    [/alchem|emblem.?book/, 'alchemy'],
    [/ley.?line|geomanc/, 'ley-lines'],
    [
      /nag.?hammadi|gnostic|gospel.?of.?thomas|apocryphon.?of.?john|gospel.?of.?philip|valentinian|sethian|pistis.?sophia|thunder.?perfect|trimorphic|pleroma/,
      'nag-hammadi',
    ],
  ];
  for (const [re, id] of rules) {
    if (re.test(hay)) return id;
  }
  return 'general';
}

async function bumpTopicStat(db, topicId, delta = 1) {
  const id = normalizeTopic(topicId);
  await db
    .collection(TOPIC_STATS)
    .doc(id)
    .set(
      {
        topicId: id,
        docCount: FieldValue.increment(delta),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/**
 * Publish findings with visibility + topic + provenance.
 */
export async function publishFindings(db, payload) {
  if (!db) throw new Error('Library storage is not configured (Firestore unavailable).');
  const findings = Array.isArray(payload?.findings) ? payload.findings : [];
  if (!findings.length) throw new Error('No findings to publish.');

  const contributor = clip(payload.contributor || 'anonymous', 80);
  const publishedBy = clip(payload.publishedBy || '', 80) || null;
  const prompt = clip(payload.prompt, 1000);
  const roles = payload.roles || {};
  const visibility = ['private', 'unlisted', 'public'].includes(payload.visibility)
    ? payload.visibility
    : 'public';
  const shareToken =
    visibility === 'unlisted'
      ? clip(payload.shareToken || `share_${Math.random().toString(36).slice(2, 12)}`, 40)
      : null;
  const topicHint = payload.topicId ? normalizeTopic(payload.topicId) : null;
  const batch = db.batch();
  const ids = [];
  const topicBumps = new Map();

  for (const f of findings.slice(0, 25)) {
    if (!f || (!f.ocrText && !f.translation)) continue;
    const ref = db.collection(COLLECTION).doc();
    ids.push(ref.id);
    const topicId =
      topicHint ||
      inferTopicId({
        prompt,
        title: f.title || f.filename,
        text: f.translation || f.ocrText,
      });
    topicBumps.set(topicId, (topicBumps.get(topicId) || 0) + 1);
    batch.set(ref, {
      title: clip(f.title || f.filename || f.alt || 'Untitled finding', 200),
      prompt,
      sourceUrl: clip(f.sourceUrl || payload.sourceUrl, 1000),
      imageUrl: clip(f.url, 1000),
      filename: clip(f.filename, 200),
      mimeType: clip(f.mimeType, 100),
      alt: clip(f.alt, 300),
      reason: clip(f.reason, 500),
      confidence: typeof f.confidence === 'number' ? f.confidence : null,
      ocrText: clip(f.ocrText, 20000),
      translation: clip(f.translation, 20000),
      targetLang: clip(f.targetLang || payload.targetLang, 60),
      roles: {
        director: clip(roles?.director?.provider, 40),
        vision: clip(roles?.vision?.provider, 40),
        translator: clip(roles?.translator?.provider, 40),
      },
      contributor,
      publishedBy,
      topicId,
      visibility,
      shareToken,
      provenance: {
        sourceUrl: clip(f.sourceUrl || payload.sourceUrl, 1000),
        agentPasses: {
          director: clip(roles?.director?.provider, 40),
          vision: clip(roles?.vision?.provider, 40),
          translator: clip(roles?.translator?.provider, 40),
        },
        harvestedAt: new Date().toISOString(),
        projectId: clip(payload.projectId, 80) || null,
      },
      correctionCount: 0,
      status: 'published',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  if (!ids.length) throw new Error('Findings had no OCR/translation text to publish.');
  try {
    await batch.commit();
    for (const [topicId, n] of topicBumps) {
      await bumpTopicStat(db, topicId, n);
    }
  } catch (err) {
    throw friendlyDbError(err);
  }
  return {
    ok: true,
    published: ids.length,
    ids,
    visibility,
    shareToken,
    sharePath: shareToken ? `/research-lab/communal-library?share=${shareToken}` : null,
  };
}

/**
 * List / search communal library entries.
 */
export async function listLibrary(db, opts = {}) {
  if (!db) throw new Error('Library storage is not configured (Firestore unavailable).');
  const limit = Math.max(1, Math.min(Number(opts.limit) || 30, 100));
  const topicId = opts.topicId ? normalizeTopic(opts.topicId) : null;
  const q = String(opts.q || '').trim().toLowerCase();
  const shareToken = opts.shareToken ? clip(opts.shareToken, 40) : null;
  const includePrivateForUid = opts.viewerUid || null;

  let snap;
  try {
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(Math.min(200, limit * 4));
    if (topicId && topicId !== 'general') {
      query = db
        .collection(COLLECTION)
        .where('topicId', '==', topicId)
        .orderBy('createdAt', 'desc')
        .limit(Math.min(200, limit * 3));
    }
    if (shareToken) {
      query = db.collection(COLLECTION).where('shareToken', '==', shareToken).limit(50);
    }
    snap = await query.get();
  } catch (err) {
    // Fallback without composite index
    try {
      snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(100).get();
    } catch (err2) {
      throw friendlyDbError(err2);
    }
  }

  let entries = snap.docs.map(serializeEntry).filter((e) => {
    if (shareToken) return e.shareToken === shareToken;
    if (e.visibility === 'public') return true;
    if (e.visibility === 'unlisted') return false; // only via share token
    if (e.visibility === 'private') return includePrivateForUid && e.publishedBy === includePrivateForUid;
    return e.visibility !== 'private';
  });

  if (topicId) {
    entries = entries.filter((e) => e.topicId === topicId || (topicId === 'general' && !e.topicId));
  }
  if (q) {
    entries = entries.filter((e) => {
      const hay = `${e.title} ${e.prompt} ${e.reason} ${e.ocrText} ${e.translation} ${e.contributor}`.toLowerCase();
      return hay.includes(q);
    });
  }

  entries = entries.slice(0, limit);
  return { ok: true, count: entries.length, entries, query: { q, topicId, limit } };
}

export async function getLibraryEntry(db, id, opts = {}) {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  const entry = serializeEntry(snap);
  if (entry.visibility === 'private' && entry.publishedBy !== opts.viewerUid) return null;
  if (entry.visibility === 'unlisted' && opts.shareToken !== entry.shareToken && entry.publishedBy !== opts.viewerUid) {
    return null;
  }
  return entry;
}

/**
 * Human-in-the-loop correction — updates entry + glossary for future researchers.
 */
export async function submitCorrection(db, { entryId, field, original, corrected, note, userId, contributor }) {
  if (!entryId) throw new Error('entryId required');
  if (!['ocrText', 'translation', 'title'].includes(field)) {
    throw new Error('field must be ocrText, translation, or title');
  }
  const ref = db.collection(COLLECTION).doc(entryId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Library entry not found');
  const data = snap.data() || {};
  if (data.visibility === 'private' && data.publishedBy !== userId) {
    throw new Error('Not allowed to correct this private entry');
  }

  const next = clip(corrected, field === 'title' ? 200 : 20000);
  await ref.set(
    {
      [field]: next,
      correctionCount: FieldValue.increment(1),
      lastCorrectedBy: clip(contributor || userId, 80),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await db.collection(GLOSSARY).doc().set({
    entryId,
    topicId: data.topicId || 'general',
    field,
    original: clip(original || data[field], 2000),
    corrected: next,
    note: clip(note, 500),
    userId: clip(userId, 80),
    contributor: clip(contributor || 'anonymous', 80),
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, entryId, field };
}

export async function listGlossary(db, { topicId, limit = 40 } = {}) {
  const lim = Math.min(100, Math.max(1, Number(limit) || 40));
  let snap;
  try {
    if (topicId) {
      snap = await db
        .collection(GLOSSARY)
        .where('topicId', '==', normalizeTopic(topicId))
        .orderBy('createdAt', 'desc')
        .limit(lim)
        .get();
    } else {
      snap = await db.collection(GLOSSARY).orderBy('createdAt', 'desc').limit(lim).get();
    }
  } catch {
    snap = await db.collection(GLOSSARY).limit(lim).get();
  }
  return {
    ok: true,
    entries: snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        ...x,
        createdAt: x.createdAt?.toDate ? x.createdAt.toDate().toISOString() : null,
      };
    }),
  };
}

/**
 * Topic document counts — live stats merged with seed fallbacks.
 */
export async function getTopicStats(db) {
  const snap = await db.collection(TOPIC_STATS).get().catch(() => null);
  const map = {};
  if (snap) {
    for (const doc of snap.docs) {
      const d = doc.data() || {};
      map[doc.id] = Number(d.docCount) || 0;
    }
  }
  // Also count from recent library if stats empty
  if (!Object.keys(map).length) {
    try {
      const lib = await db.collection(COLLECTION).limit(200).get();
      for (const doc of lib.docs) {
        const tid = normalizeTopic(doc.data()?.topicId);
        map[tid] = (map[tid] || 0) + 1;
      }
    } catch {
      /* ignore */
    }
  }
  return { ok: true, stats: map };
}

export { KNOWN_TOPICS, normalizeTopic, COLLECTION as FABLE_LIBRARY_COLLECTION };
