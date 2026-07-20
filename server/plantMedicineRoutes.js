import { FieldValue } from 'firebase-admin/firestore';
import { verifyHiveAuth } from './hiveAuth.js';
import {
  createPost,
  deletePost,
  getProfile,
  listPendingPosts,
  listPostsForPlant,
  moderatePost,
  toggleUpvote,
  uploadPlantMedicineImage,
  upsertProfile,
} from './plantMedicine.js';

const PLANT_ID_RE = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;

function requireAuth(req, res) {
  return verifyHiveAuth(req).then((user) => {
    if (!user?.uid) {
      res.status(401).json({ error: 'Sign in to continue.' });
      return null;
    }
    return user;
  });
}

export function registerPlantMedicineRoutes(app, db, { isPlatformAdmin, gcsBucket } = {}) {
  app.get('/api/plant-medicine/profile/me', async (req, res) => {
    try {
      const user = await verifyHiveAuth(req);
      if (!user?.uid) return res.json({ profile: null });
      const profile = await getProfile(db, user.uid);
      return res.json({ profile });
    } catch (err) {
      console.error('[plant-medicine/profile/me]', err);
      return res.status(500).json({ error: err.message || 'Failed to load profile' });
    }
  });

  app.put('/api/plant-medicine/profile/me', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { displayName, bio, avatarUrl } = req.body || {};
      const profile = await upsertProfile(db, user.uid, { displayName, bio, avatarUrl });
      return res.json({ profile });
    } catch (err) {
      console.error('[plant-medicine/profile PUT]', err);
      return res.status(500).json({ error: err.message || 'Failed to save profile' });
    }
  });

  app.post('/api/plant-medicine/upload', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { base64, mimeType = 'image/jpeg', kind = 'photo' } = req.body || {};
      if (!base64 || typeof base64 !== 'string') {
        return res.status(400).json({ error: 'base64 required' });
      }
      const buffer = Buffer.from(base64, 'base64');
      const url = await uploadPlantMedicineImage(gcsBucket, {
        uid: user.uid,
        kind: kind === 'avatar' ? 'avatar' : 'photo',
        buffer,
        mimeType,
      });
      return res.json({ url });
    } catch (err) {
      console.error('[plant-medicine/upload]', err);
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });

  app.get('/api/plant-medicine/plants/:plantId/posts', async (req, res) => {
    try {
      const plantId = String(req.params.plantId || '');
      if (!PLANT_ID_RE.test(plantId)) {
        return res.status(400).json({ error: 'Invalid plant id' });
      }
      const type = req.query.type === 'comment' || req.query.type === 'photo' ? req.query.type : undefined;
      const viewer = await verifyHiveAuth(req);
      const posts = await listPostsForPlant(db, plantId, { type, viewerUid: viewer?.uid });
      return res.json({ posts });
    } catch (err) {
      console.error('[plant-medicine/posts GET]', err);
      return res.status(500).json({ error: err.message || 'Failed to load posts' });
    }
  });

  app.post('/api/plant-medicine/plants/:plantId/posts', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const plantId = String(req.params.plantId || '');
      if (!PLANT_ID_RE.test(plantId)) {
        return res.status(400).json({ error: 'Invalid plant id' });
      }
      const { type, text, imageUrl } = req.body || {};
      if (type !== 'comment' && type !== 'photo') {
        return res.status(400).json({ error: 'type must be comment or photo' });
      }
      if (type === 'comment' && !String(text || '').trim()) {
        return res.status(400).json({ error: 'Comment text required' });
      }
      if (type === 'photo' && !imageUrl) {
        return res.status(400).json({ error: 'imageUrl required for photo posts' });
      }
      const post = await createPost(db, FieldValue, {
        plantId,
        author: user,
        type,
        text,
        imageUrl,
      });
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[plant-medicine/posts POST]', err);
      return res.status(500).json({ error: err.message || 'Failed to create post' });
    }
  });

  app.delete('/api/plant-medicine/posts/:postId', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const isAdmin = isPlatformAdmin?.(user.email);
      const result = await deletePost(db, req.params.postId, user.uid, isAdmin);
      if (!result.ok) {
        const code = result.reason === 'not_found' ? 404 : 403;
        return res.status(code).json({ error: result.reason });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('[plant-medicine/posts DELETE]', err);
      return res.status(500).json({ error: err.message || 'Failed to delete post' });
    }
  });

  app.post('/api/plant-medicine/posts/:postId/upvote', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const result = await toggleUpvote(db, FieldValue, req.params.postId, user.uid);
      return res.json(result);
    } catch (err) {
      console.error('[plant-medicine/upvote]', err);
      return res.status(400).json({ error: err.message || 'Upvote failed' });
    }
  });

  app.get('/api/plant-medicine/admin/pending', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!isPlatformAdmin?.(user.email)) {
        return res.status(403).json({ error: 'Admin only' });
      }
      const posts = await listPendingPosts(db);
      return res.json({ posts });
    } catch (err) {
      console.error('[plant-medicine/admin/pending]', err);
      return res.status(500).json({ error: err.message || 'Failed to list pending' });
    }
  });

  app.post('/api/plant-medicine/admin/posts/:postId/moderate', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!isPlatformAdmin?.(user.email)) {
        return res.status(403).json({ error: 'Admin only' });
      }
      const { status } = req.body || {};
      const post = await moderatePost(db, req.params.postId, status);
      return res.json({ post });
    } catch (err) {
      console.error('[plant-medicine/moderate]', err);
      return res.status(400).json({ error: err.message || 'Moderation failed' });
    }
  });
}
