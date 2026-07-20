/**
 * Oregon Plant Medicine — profiles, community posts, votes.
 * All writes via Admin SDK; public reads return approved content only.
 */

const PROFILES = 'plant_medicine_profiles';
const POSTS = 'plant_medicine_posts';

function clip(s, max) {
  return String(s ?? '')
    .trim()
    .slice(0, max);
}

function serializePost(id, d) {
  return {
    id,
    plantId: d.plantId,
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

export async function getProfile(db, uid) {
  if (!uid) return null;
  const snap = await db.collection(PROFILES).doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data();
  return {
    uid,
    displayName: d.displayName || '',
    bio: d.bio || '',
    avatarUrl: d.avatarUrl || null,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || null,
  };
}

export async function upsertProfile(db, uid, { displayName, bio, avatarUrl }) {
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
  return getProfile(db, uid);
}

export async function listPostsForPlant(db, plantId, { type, viewerUid } = {}) {
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
  posts.sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return posts;
}

export async function createPost(db, FieldValue, { plantId, author, type, text, imageUrl }) {
  const profile = (await getProfile(db, author.uid)) || {};
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
    /* uniform bucket access */
  }
  return `https://storage.googleapis.com/${gcsBucket.name}/${path}`;
}
