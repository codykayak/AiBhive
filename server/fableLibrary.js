/**
 * Fable Scrape — communal research library.
 *
 * Published findings land in the `fable_library` Firestore collection and are
 * served publicly (read-only) so harvested + translated documents become a
 * shared, web-visible archive. Writes go through the Admin SDK (server), so no
 * client Firestore rules are involved.
 */
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'fable_library';

function clip(s, n) {
  return String(s || '').slice(0, n);
}

/** Map raw GCP/Firestore errors to a clear, user-facing message. */
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

/**
 * Publish one or more findings to the communal library.
 * @param {FirebaseFirestore.Firestore} db
 * @param {{ findings:Array, prompt?:string, sourceUrl?:string, contributor?:string, roles?:object, targetLang?:string }} payload
 */
export async function publishFindings(db, payload) {
  if (!db) throw new Error('Library storage is not configured (Firestore unavailable).');
  const findings = Array.isArray(payload?.findings) ? payload.findings : [];
  if (!findings.length) throw new Error('No findings to publish.');

  const contributor = clip(payload.contributor || 'anonymous', 80);
  const prompt = clip(payload.prompt, 1000);
  const roles = payload.roles || {};
  const batch = db.batch();
  const ids = [];

  for (const f of findings.slice(0, 25)) {
    if (!f || (!f.ocrText && !f.translation)) continue;
    const ref = db.collection(COLLECTION).doc();
    ids.push(ref.id);
    batch.set(ref, {
      title: clip(f.title || f.filename || f.alt || 'Untitled finding', 200),
      prompt,
      sourceUrl: clip(f.sourceUrl, 1000),
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
      status: 'published',
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  if (!ids.length) throw new Error('Findings had no OCR/translation text to publish.');
  try {
    await batch.commit();
  } catch (err) {
    throw friendlyDbError(err);
  }
  return { ok: true, published: ids.length, ids };
}

/**
 * List recent communal library entries (public, read-only).
 * @param {FirebaseFirestore.Firestore} db
 * @param {{ limit?:number }} opts
 */
export async function listLibrary(db, opts = {}) {
  if (!db) throw new Error('Library storage is not configured (Firestore unavailable).');
  const limit = Math.max(1, Math.min(Number(opts.limit) || 30, 100));
  let snap;
  try {
    snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(limit).get();
  } catch (err) {
    throw friendlyDbError(err);
  }
  const entries = snap.docs.map((doc) => {
    const d = doc.data();
    const created = d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null;
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
      createdAt: created,
    };
  });
  return { ok: true, count: entries.length, entries };
}
