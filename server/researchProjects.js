/**
 * Research Lab projects — persistent workspace sessions.
 * users/{uid}/researchProjects/{projectId}
 */
import { FieldValue } from 'firebase-admin/firestore';

function clip(s, n) {
  return String(s || '').slice(0, n);
}

function projectsCol(db, uid) {
  return db.collection('users').doc(uid).collection('researchProjects');
}

function serialize(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    title: d.title || 'Untitled project',
    domainPackId: d.domainPackId || null,
    visibility: d.visibility || 'private',
    shareToken: d.shareToken || null,
    activeStep: d.activeStep ?? 0,
    scrapeText: d.scrapeText || '',
    ocrText: d.ocrText || '',
    imageUrls: Array.isArray(d.imageUrls) ? d.imageUrls.slice(0, 100) : [],
    output: Array.isArray(d.output) ? d.output.slice(-80) : [],
    receipts: Array.isArray(d.receipts) ? d.receipts.slice(-40) : [],
    forkedFrom: d.forkedFrom || null,
    notes: d.notes || '',
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt || null,
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || null,
  };
}

export async function listProjects(db, uid) {
  const snap = await projectsCol(db, uid).orderBy('updatedAt', 'desc').limit(40).get().catch(async () => {
    return projectsCol(db, uid).limit(40).get();
  });
  return { ok: true, projects: snap.docs.map(serialize) };
}

export async function getProject(db, uid, projectId) {
  const snap = await projectsCol(db, uid).doc(projectId).get();
  if (!snap.exists) return null;
  return serialize(snap);
}

export async function createProject(db, uid, input = {}) {
  const ref = projectsCol(db, uid).doc();
  const now = FieldValue.serverTimestamp();
  const visibility = ['private', 'unlisted', 'public'].includes(input.visibility)
    ? input.visibility
    : 'private';
  const doc = {
    title: clip(input.title || 'Research project', 120),
    domainPackId: clip(input.domainPackId, 60) || null,
    visibility,
    shareToken:
      visibility === 'unlisted' ? `proj_${Math.random().toString(36).slice(2, 12)}` : null,
    activeStep: Number(input.activeStep) || 0,
    scrapeText: clip(input.scrapeText, 100000),
    ocrText: clip(input.ocrText, 100000),
    imageUrls: Array.isArray(input.imageUrls) ? input.imageUrls.slice(0, 100).map((u) => clip(u, 1000)) : [],
    output: Array.isArray(input.output) ? input.output.slice(-80) : [],
    receipts: Array.isArray(input.receipts) ? input.receipts.slice(-40) : [],
    forkedFrom: input.forkedFrom || null,
    notes: clip(input.notes, 5000),
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(doc);
  const snap = await ref.get();
  return { ok: true, project: serialize(snap) };
}

export async function updateProject(db, uid, projectId, patch = {}) {
  const ref = projectsCol(db, uid).doc(projectId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Project not found');

  const next = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.title != null) next.title = clip(patch.title, 120);
  if (patch.domainPackId != null) next.domainPackId = clip(patch.domainPackId, 60) || null;
  if (patch.activeStep != null) next.activeStep = Number(patch.activeStep) || 0;
  if (patch.scrapeText != null) next.scrapeText = clip(patch.scrapeText, 100000);
  if (patch.ocrText != null) next.ocrText = clip(patch.ocrText, 100000);
  if (patch.imageUrls != null) {
    next.imageUrls = Array.isArray(patch.imageUrls)
      ? patch.imageUrls.slice(0, 100).map((u) => clip(u, 1000))
      : [];
  }
  if (patch.output != null) next.output = Array.isArray(patch.output) ? patch.output.slice(-80) : [];
  if (patch.receipts != null) {
    next.receipts = Array.isArray(patch.receipts) ? patch.receipts.slice(-40) : [];
  }
  if (patch.notes != null) next.notes = clip(patch.notes, 5000);
  if (['private', 'unlisted', 'public'].includes(patch.visibility)) {
    next.visibility = patch.visibility;
    if (patch.visibility === 'unlisted' && !snap.data()?.shareToken) {
      next.shareToken = `proj_${Math.random().toString(36).slice(2, 12)}`;
    }
  }

  await ref.set(next, { merge: true });
  return { ok: true, project: serialize(await ref.get()) };
}

export async function appendProjectReceipt(db, uid, projectId, receipt) {
  if (!projectId) return { ok: true, skipped: true };
  const ref = projectsCol(db, uid).doc(projectId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: 'Project not found' };
  const existing = Array.isArray(snap.data()?.receipts) ? snap.data().receipts : [];
  const row = {
    id: `rcpt_${Date.now().toString(36)}`,
    feature: clip(receipt.feature, 60),
    summary: clip(receipt.summary, 200),
    rawCostUsd: Number(receipt.rawCostUsd) || 0,
    chargedUsd: Number(receipt.chargedUsd) || 0,
    meta: receipt.meta || {},
    at: new Date().toISOString(),
  };
  await ref.set(
    {
      receipts: [...existing, row].slice(-40),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { ok: true, receipt: row };
}

/**
 * Fork a public/unlisted library entry into a new private project.
 */
export async function forkLibraryEntryIntoProject(db, uid, entry, opts = {}) {
  const text = [entry.translation, entry.ocrText].filter(Boolean).join('\n\n---\n\n');
  return createProject(db, uid, {
    title: clip(opts.title || `Fork · ${entry.title}`, 120),
    domainPackId: opts.domainPackId || null,
    scrapeText: '',
    ocrText: clip(text, 100000),
    imageUrls: entry.imageUrl ? [entry.imageUrl] : [],
    output: [
      {
        id: `fork_${Date.now()}`,
        step: 'library',
        title: `Forked from Communal Library · ${entry.title}`,
        text: clip(
          `Source: ${entry.sourceUrl || 'n/a'}\nContributor: ${entry.contributor}\nTopic: ${entry.topicId}\n\n${text}`,
          20000,
        ),
        at: new Date().toISOString(),
      },
    ],
    forkedFrom: {
      entryId: entry.id,
      title: entry.title,
      topicId: entry.topicId,
      sourceUrl: entry.sourceUrl,
    },
    visibility: 'private',
    activeStep: 2,
  });
}

export async function deleteProject(db, uid, projectId) {
  await projectsCol(db, uid).doc(projectId).delete();
  return { ok: true };
}
