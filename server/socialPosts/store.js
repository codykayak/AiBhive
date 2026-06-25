import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

const POSTS_COLLECTION = 'socialPosts';
const CONFIG_DOC = 'socialConfig/settings';
const LOCK_TTL_MS = 12 * 60 * 1000;

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

export async function getPostByDate(dateKey) {
  const snap = await db().collection(POSTS_COLLECTION).doc(dateKey).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function listPosts(limit = 30) {
  const snap = await db()
    .collection(POSTS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

export async function acquireGenerationLock(dateKey) {
  const ref = db().collection(POSTS_COLLECTION).doc(dateKey);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : null;

  if (existing?.status === 'generating') {
    const started = existing.generationStartedAt?.toDate?.() || new Date(0);
    const age = Date.now() - started.getTime();
    if (age < LOCK_TTL_MS) {
      return { acquired: false, reason: 'in_progress', post: { id: dateKey, ...existing } };
    }
  }

  await ref.set(
    {
      date: dateKey,
      status: 'generating',
      generationStartedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  return { acquired: true, post: existing };
}

export async function uploadSocialImage(postId, platform, buffer, contentType = 'image/png') {
  if (!mediaBucket) throw new Error('Media bucket not configured.');
  const path = `social-posts/${postId}/${platform}.png`;
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
