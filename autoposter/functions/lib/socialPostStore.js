import { createHash, timingSafeEqual } from 'crypto';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const DB_ID = process.env.FIRESTORE_DATABASE_ID || 'property-managment';
const POSTS_COLLECTION = 'socialPosts';
const CONFIG_DOC = 'socialConfig/settings';
const LOCK_TTL_MS = 12 * 60 * 1000;

function db() {
  return getFirestore(DB_ID);
}

export async function getConfig() {
  const snap = await db().doc(CONFIG_DOC).get();
  const data = snap.exists ? snap.data() : {};
  return {
    notifyPhone: data.notifyPhone || process.env.SOCIAL_NOTIFY_PHONE || '',
    notifyEnabled: data.notifyEnabled !== false,
    scheduleHour: data.scheduleHour ?? 7,
    siteUrl: data.siteUrl || process.env.SOCIAL_SITE_URL || 'https://example.com',
    adminBaseUrl: data.adminBaseUrl || process.env.SOCIAL_ADMIN_BASE_URL || 'http://localhost:5174',
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

/** Merge caption edits without wiping imageUrl / link / hashtags. */
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

/**
 * Prevent duplicate concurrent generation for the same day.
 * @returns {{ acquired: boolean, reason?: string, post?: object }}
 */
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
  const bucket = getStorage().bucket();
  const path = `social-posts/${postId}/${platform}.png`;
  const file = bucket.file(path);
  await file.save(buffer, {
    metadata: { contentType, cacheControl: 'public, max-age=31536000' },
    resumable: false,
  });
  try {
    await file.makePublic();
  } catch (e) {
    console.warn('[socialPostStore] makePublic failed, using signed URL', e.message);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    return signedUrl;
  }
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
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

export function safeCompareKeys(provided, expected) {
  if (!provided || !expected) return false;
  const a = createHash('sha256').update(String(provided)).digest();
  const b = createHash('sha256').update(String(expected)).digest();
  return timingSafeEqual(a, b);
}
