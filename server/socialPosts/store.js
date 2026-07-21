import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

const POSTS_COLLECTION = 'socialPosts';
const CONFIG_DOC = 'socialConfig/settings';
const LOCK_TTL_MS = 12 * 60 * 1000;

export function postDocId(companyId, dateKey) {
  return `${companyId}_${dateKey}`;
}

export function parsePostDocId(docId) {
  const match = String(docId).match(/^(.+)_(\d{4}-\d{2}-\d{2})$/);
  if (match) return { companyId: match[1], dateKey: match[2] };
  if (/^\d{4}-\d{2}-\d{2}$/.test(docId)) return { companyId: 'aibhive', dateKey: docId };
  return { companyId: 'aibhive', dateKey: docId };
}

let firestoreDb = null;
let mediaBucket = null;

export function initSocialPostStore({ db, bucket }) {
  firestoreDb = db;
  mediaBucket = bucket;
}

function db() {
  if (!firestoreDb) throw new Error('Social post store not initialized.');
  return firestoreDb;
}

export async function getConfig() {
  const snap = await db().doc(CONFIG_DOC).get();
  const data = snap.exists ? snap.data() : {};
  return {
    notifyPhone: data.notifyPhone || process.env.SOCIAL_NOTIFY_PHONE || '',
    notifyEnabled: data.notifyEnabled !== false,
    scheduleHour: data.scheduleHour ?? 7,
    siteUrl: data.siteUrl || process.env.SOCIAL_SITE_URL || 'https://www.aibhive.com',
    adminBaseUrl:
      data.adminBaseUrl
      || process.env.SOCIAL_ADMIN_BASE_URL
      || 'https://www.aibhive.com/autoposter',
    socialLinks: {
      facebook: data.socialLinks?.facebook || '',
      instagram: data.socialLinks?.instagram || '',
      x: data.socialLinks?.x || '',
    },
    textModel: data.textModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    imageModel: data.imageModel || process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
  };
}

export async function saveConfig(updates) {
  await db().doc(CONFIG_DOC).set(
    { ...updates, updatedAt: Timestamp.now() },
    { merge: true },
  );
  return getConfig();
}

export async function getPostByDate(companyId, dateKey) {
  const id = postDocId(companyId, dateKey);
  let snap = await db().collection(POSTS_COLLECTION).doc(id).get();
  if (!snap.exists && companyId === 'aibhive') {
    snap = await db().collection(POSTS_COLLECTION).doc(dateKey).get();
  }
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function listPosts(companyId, limit = 30) {
  const snap = await db()
    .collection(POSTS_COLLECTION)
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  if (!snap.empty) {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Legacy posts without companyId field (AiBhive only)
  if (companyId === 'aibhive') {
    const legacy = await db()
      .collection(POSTS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return legacy.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => !p.companyId || p.companyId === 'aibhive');
  }

  return [];
}

export async function savePost(postId, data) {
  const ref = db().collection(POSTS_COLLECTION).doc(postId);
  await ref.set(
    {
      ...data,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function patchPostCaptions(postId, updates) {
  const ref = db().collection(POSTS_COLLECTION).doc(postId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Post ${postId} not found.`);

  const existing = snap.data();
  const patch = { updatedAt: Timestamp.now() };

  for (const platform of ['facebook', 'instagram', 'x']) {
    if (updates[platform]?.caption !== undefined) {
      patch[platform] = {
        ...(existing[platform] || {}),
        caption: String(updates[platform].caption).slice(0, 8000),
      };
    }
  }

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

export async function acquireGenerationLock(companyId, dateKey) {
  const id = postDocId(companyId, dateKey);
  const ref = db().collection(POSTS_COLLECTION).doc(id);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : null;

  if (existing?.status === 'generating') {
    const started = existing.generationStartedAt?.toDate?.() || new Date(0);
    const age = Date.now() - started.getTime();
    if (age < LOCK_TTL_MS) {
      return { acquired: false, reason: 'in_progress', post: { id, ...existing } };
    }
  }

  await ref.set(
    {
      companyId,
      date: dateKey,
      status: 'generating',
      generationStartedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  return { acquired: true, post: existing };
}

export async function uploadSocialImage(companyId, postId, platform, buffer, contentType = 'image/png') {
  if (!mediaBucket) throw new Error('Media bucket not configured.');
  const path = `social-posts/${companyId}/${postId}/${platform}.png`;
  const file = mediaBucket.file(path);
  const downloadToken = randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
    resumable: false,
  });

  const encoded = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${mediaBucket.name}/o/${encoded}?alt=media&token=${downloadToken}`;
}

export function serializePost(post) {
  if (!post) return null;
  const out = { ...post };
  for (const key of [
    'createdAt',
    'updatedAt',
    'approvedAt',
    'postedAt',
    'notifiedAt',
    'generationStartedAt',
    'failedAt',
  ]) {
    if (out[key]?.toDate) out[key] = out[key].toDate().toISOString();
  }
  return out;
}
