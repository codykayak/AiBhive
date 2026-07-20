/**
 * Oregon Plant Medicine — profiles, community posts, votes.
 * All writes via Admin SDK; public reads return approved content only.
 */

const PROFILES = 'plant_medicine_profiles';
const POSTS = 'plant_medicine_posts';

const TOPIC_LIBRARIES = new Set(['hypnosis', 'holistic', 'animal-health']);
const TOPIC_ID_RE = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;

function clip(s, max) {
  return String(s ?? '')
    .trim()
    .slice(0, max);
}

function parsePlantMedicineStoragePath(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    if (url.includes('storage.googleapis.com/')) {
      const match = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)$/);
      return match?.[1] ? decodeURIComponent(match[1]) : null;
    }
    if (url.includes('firebasestorage.googleapis.com')) {
      const match = url.match(/\/o\/([^?]+)/);
      return match?.[1] ? decodeURIComponent(match[1]) : null;
    }
  } catch {
    return null;
  }
  return null;
}

function gcsPublicUrl(bucketName, objectPath) {
  return `https://storage.googleapis.com/${bucketName}/${objectPath}`;
}

/** Same-origin proxy URL — reliable in browsers regardless of GCS bucket ACL. */
export function plantMedicineMediaProxyUrl(objectPath) {
  const encoded = objectPath.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `/api/plant-medicine/media/${encoded}`;
}

/** Normalize stored media URLs to the app proxy path. */
export async function resolvePlantMedicineMediaUrl(_gcsBucket, url) {
  if (!url) return url;
  if (url.startsWith('/api/plant-medicine/media/')) return url;

  const path = parsePlantMedicineStoragePath(url);
  if (path?.startsWith('plant-medicine/')) {
    return plantMedicineMediaProxyUrl(path);
  }
  if (url.includes('/plant-medicine/')) {
    const idx = url.indexOf('plant-medicine/');
    const objectPath = url.slice(idx).split('?')[0];
    if (objectPath.startsWith('plant-medicine/')) {
      return plantMedicineMediaProxyUrl(objectPath);
    }
  }
  return url;
}

export async function streamPlantMedicineMedia(gcsBucket, objectPath, res) {
  if (!gcsBucket) {
    res.status(503).json({ error: 'Media storage not configured' });
    return;
  }
  if (!objectPath?.startsWith('plant-medicine/')) {
    res.status(400).json({ error: 'Invalid media path' });
    return;
  }
  const file = gcsBucket.file(objectPath);
  const [exists] = await file.exists();
  if (!exists) {
    res.status(404).end();
    return;
  }
  const [meta] = await file.getMetadata();
  res.setHeader('Content-Type', meta.contentType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  file.createReadStream().on('error', () => res.status(500).end()).pipe(res);
}

async function resolveProfile(db, uid, gcsBucket) {
  if (!uid) return null;
  const snap = await db.collection(PROFILES).doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data();
  let avatarUrl = d.avatarUrl || null;
  if (avatarUrl && gcsBucket) {
    avatarUrl = await resolvePlantMedicineMediaUrl(gcsBucket, avatarUrl);
  }
  return {
    uid,
    displayName: d.displayName || '',
    bio: d.bio || '',
    avatarUrl,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || null,
  };
}

function serializePost(id, d) {
  return {
    id,
    plantId: d.plantId || null,
    library: d.library || null,
    topicId: d.topicId || null,
    authorUid: d.authorUid,
    authorDisplayName: d.authorDisplayName || 'Forager',
    authorAvatarUrl: d.authorAvatarUrl || null,
    type: d.type,
    text: d.text || '',
    imageUrl: d.imageUrl || null,
    status: d.status,
    upvoteCount: d.upvoteCount || 0,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt || null,
    viewerHasUpvoted: !!d.viewerHasUpvoted,
  };
}

export async function getProfile(db, uid, gcsBucket = null) {
  return resolveProfile(db, uid, gcsBucket);
}

export async function upsertProfile(db, uid, { displayName, bio, avatarUrl }, gcsBucket = null) {
  const ref = db.collection(PROFILES).doc(uid);
  const existing = await ref.get();
  const now = new Date();
  const payload = {
    displayName: clip(displayName, 80) || 'Forager',
    bio: clip(bio, 500),
    updatedAt: now,
  };
  if (avatarUrl !== undefined) {
    payload.avatarUrl = avatarUrl ? String(avatarUrl).slice(0, 2048) : null;
  }
  if (!existing.exists) {
    payload.createdAt = now;
    await ref.set(payload);
  } else {
    await ref.update(payload);
  }
  return getProfile(db, uid, gcsBucket);
}

export async function listPostsForPlant(db, plantId, { type, viewerUid, gcsBucket = null } = {}) {
  let q = db.collection(POSTS).where('plantId', '==', plantId).where('status', '==', 'approved');
  if (type) q = q.where('type', '==', type);
  const snap = await q.limit(100).get();

  const posts = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    let viewerHasUpvoted = false;
    if (viewerUid) {
      const vote = await doc.ref.collection('votes').doc(viewerUid).get();
      viewerHasUpvoted = vote.exists;
    }
    posts.push(serializePost(doc.id, { ...data, viewerHasUpvoted }));
  }
  if (gcsBucket) {
    for (const post of posts) {
      if (post.authorAvatarUrl) {
        post.authorAvatarUrl = await resolvePlantMedicineMediaUrl(gcsBucket, post.authorAvatarUrl);
      }
      if (post.imageUrl) {
        post.imageUrl = await resolvePlantMedicineMediaUrl(gcsBucket, post.imageUrl);
      }
    }
  }
  posts.sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return posts;
}

export async function listPostsForTopic(db, library, topicId, { type, viewerUid, gcsBucket = null } = {}) {
  if (!TOPIC_LIBRARIES.has(library)) throw new Error('Invalid library');
  if (!TOPIC_ID_RE.test(topicId)) throw new Error('Invalid topic id');

  let q = db
    .collection(POSTS)
    .where('library', '==', library)
    .where('topicId', '==', topicId)
    .where('status', '==', 'approved');
  if (type) q = q.where('type', '==', type);
  const snap = await q.limit(100).get();

  const posts = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    let viewerHasUpvoted = false;
    if (viewerUid) {
      const vote = await doc.ref.collection('votes').doc(viewerUid).get();
      viewerHasUpvoted = vote.exists;
    }
    posts.push(serializePost(doc.id, { ...data, viewerHasUpvoted }));
  }
  if (gcsBucket) {
    for (const post of posts) {
      if (post.authorAvatarUrl) {
        post.authorAvatarUrl = await resolvePlantMedicineMediaUrl(gcsBucket, post.authorAvatarUrl);
      }
      if (post.imageUrl) {
        post.imageUrl = await resolvePlantMedicineMediaUrl(gcsBucket, post.imageUrl);
      }
    }
  }
  posts.sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return posts;
}

export async function listCommunityFeed(db, { viewerUid, gcsBucket, limit = 50 } = {}) {
  const snap = await db.collection(POSTS).where('status', '==', 'approved').limit(150).get();

  const posts = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    let viewerHasUpvoted = false;
    if (viewerUid) {
      const vote = await doc.ref.collection('votes').doc(viewerUid).get();
      viewerHasUpvoted = vote.exists;
    }
    posts.push(serializePost(doc.id, { ...data, viewerHasUpvoted }));
  }
  if (gcsBucket) {
    for (const post of posts) {
      if (post.authorAvatarUrl) {
        post.authorAvatarUrl = await resolvePlantMedicineMediaUrl(gcsBucket, post.authorAvatarUrl);
      }
      if (post.imageUrl) {
        post.imageUrl = await resolvePlantMedicineMediaUrl(gcsBucket, post.imageUrl);
      }
    }
  }
  posts.sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return posts.slice(0, limit);
}

export async function createPost(db, FieldValue, { plantId, author, type, text, imageUrl }, gcsBucket = null) {
  const profile = (await getProfile(db, author.uid, gcsBucket)) || {};
  const status = type === 'comment' ? 'approved' : 'pending';
  const ref = db.collection(POSTS).doc();
  const now = new Date();
  const payload = {
    plantId,
    authorUid: author.uid,
    authorDisplayName: profile.displayName || author.email?.split('@')[0] || 'Forager',
    authorAvatarUrl: profile.avatarUrl || null,
    type,
    text: clip(text, type === 'comment' ? 2000 : 500),
    imageUrl: imageUrl || null,
    status,
    upvoteCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(payload);
  return serializePost(ref.id, { ...payload, viewerHasUpvoted: false });
}

export async function createTopicPost(
  db,
  FieldValue,
  { library, topicId, author, type, text, imageUrl },
  gcsBucket = null,
) {
  if (!TOPIC_LIBRARIES.has(library)) throw new Error('Invalid library');
  if (!TOPIC_ID_RE.test(topicId)) throw new Error('Invalid topic id');

  const profile = (await getProfile(db, author.uid, gcsBucket)) || {};
  const status = type === 'comment' ? 'approved' : 'pending';
  const ref = db.collection(POSTS).doc();
  const now = new Date();
  const payload = {
    library,
    topicId,
    authorUid: author.uid,
    authorDisplayName: profile.displayName || author.email?.split('@')[0] || 'Researcher',
    authorAvatarUrl: profile.avatarUrl || null,
    type,
    text: clip(text, type === 'comment' ? 2000 : 500),
    imageUrl: imageUrl || null,
    status,
    upvoteCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(payload);
  return serializePost(ref.id, { ...payload, viewerHasUpvoted: false });
}

export async function deletePost(db, postId, uid, isAdmin) {
  const ref = db.collection(POSTS).doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, reason: 'not_found' };
  const data = snap.data();
  if (data.authorUid !== uid && !isAdmin) return { ok: false, reason: 'forbidden' };
  await ref.delete();
  return { ok: true };
}

export async function toggleUpvote(db, FieldValue, postId, uid) {
  const postRef = db.collection(POSTS).doc(postId);
  const voteRef = postRef.collection('votes').doc(uid);

  return db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists) throw new Error('Post not found');
    const post = postSnap.data();
    if (post.status !== 'approved') throw new Error('Post not votable');

    const voteSnap = await tx.get(voteRef);
    let delta = 0;
    if (voteSnap.exists) {
      tx.delete(voteRef);
      delta = -1;
    } else {
      tx.set(voteRef, { createdAt: new Date() });
      delta = 1;
    }
    const next = Math.max(0, (post.upvoteCount || 0) + delta);
    tx.update(postRef, { upvoteCount: next });
    return { upvoteCount: next, viewerHasUpvoted: delta > 0 };
  });
}

export async function listPendingPosts(db, limit = 50) {
  const snap = await db.collection(POSTS).where('status', '==', 'pending').limit(limit).get();
  const posts = snap.docs.map((doc) => serializePost(doc.id, doc.data()));
  posts.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return posts;
}

export async function moderatePost(db, postId, status) {
  if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid status');
  const ref = db.collection(POSTS).doc(postId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Post not found');
  await ref.update({ status, updatedAt: new Date() });
  return serializePost(postId, { ...snap.data(), status });
}

export async function uploadPlantMedicineImage(gcsBucket, { uid, kind, buffer, mimeType }) {
  if (!gcsBucket) throw new Error('Media storage not configured');
  if (!buffer?.length) throw new Error('Empty file');
  if (buffer.length > 8 * 1024 * 1024) throw new Error('Image too large (max 8MB)');

  const ext = String(mimeType).includes('png') ? 'png' : String(mimeType).includes('webp') ? 'webp' : 'jpg';
  const safeKind = kind === 'avatar' ? 'avatars' : 'photos';
  const path = `plant-medicine/${safeKind}/${uid}-${Date.now()}.${ext}`;
  const file = gcsBucket.file(path);
  await file.save(buffer, {
    contentType: mimeType || 'image/jpeg',
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  try {
    await file.makePublic();
  } catch {
    // Bucket may already use uniform public access
  }
  return plantMedicineMediaProxyUrl(path);
}
