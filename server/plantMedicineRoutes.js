import express from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyHiveAuth } from './hiveAuth.js';
import {
  runPlantMedicineChat,
  runLivingKnowledgeChat,
  runPlantPhotoIdentify,
  runCommunityPostEnrich,
  resolvePlantHiveUserId,
} from './plantMedicineChat.js';
import { isHiveBillingExempt } from './hiveAdmin.js';
import { ensureHiveUser, getHiveAccount } from './hiveBilling.js';
import {
  createPost,
  createFeedPost,
  createEssayPost,
  createThreadComment,
  createTopicPost,
  deletePost,
  getContentEngagement,
  getProfile,
  listPendingPosts,
  listCommunityFeed,
  listPostsForEssay,
  listPostsForPlant,
  listPostsForTopic,
  listThreadComments,
  moderatePost,
  toggleContentUpvote,
  toggleUpvote,
  uploadPlantMedicineImage,
  upsertProfile,
  streamPlantMedicineMedia,
} from './plantMedicine.js';

const PLANT_ID_RE = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;
const TOPIC_LIBRARY_RE = /^(hypnosis|holistic|animal-health)$/;
const TOPIC_ID_RE = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;
const CONTENT_KIND_RE = /^(plant|holistic|hypnosis|animal-health|essay)$/;

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
      const profile = await getProfile(db, user.uid, gcsBucket);
      return res.json({ profile });
    } catch (err) {
      console.error('[plant-medicine/profile/me]', err);
      return res.status(500).json({ error: err.message || 'Failed to load profile' });
    }
  });

  app.get('/api/plant-medicine/billing-status', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const hiveUserId = resolvePlantHiveUserId(user.uid);
      await ensureHiveUser(db, hiveUserId);
      await db.collection('hive_users').doc(hiveUserId).set(
        {
          email: user.email || null,
          firebaseUid: user.uid,
          product: 'plant_medicine',
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      const adminExempt = await isHiveBillingExempt(db, { userId: hiveUserId, email: user.email });
      const account = await getHiveAccount(db, hiveUserId);
      return res.json({
        hiveUserId,
        adminExempt,
        account,
      });
    } catch (err) {
      console.error('[plant-medicine/billing-status]', err);
      return res.status(500).json({ error: err.message || 'Failed to load billing status' });
    }
  });

  app.put('/api/plant-medicine/profile/me', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { displayName, bio, avatarUrl } = req.body || {};
      const profile = await upsertProfile(db, user.uid, { displayName, bio, avatarUrl }, gcsBucket);
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
      const mime = String(mimeType).toLowerCase();
      const uploadKind = kind === 'avatar' ? 'avatar' : mime.startsWith('video/') ? 'video' : 'photo';
      const url = await uploadPlantMedicineImage(gcsBucket, {
        uid: user.uid,
        kind: uploadKind,
        buffer,
        mimeType,
      });
      return res.json({ url });
    } catch (err) {
      console.error('[plant-medicine/upload]', err);
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });

  app.get(/^\/api\/plant-medicine\/media\/(.+)$/, async (req, res) => {
    try {
      const objectPath = decodeURIComponent(req.params[0]);
      await streamPlantMedicineMedia(gcsBucket, objectPath, res);
    } catch (err) {
      console.error('[plant-medicine/media]', err);
      if (!res.headersSent) res.status(500).json({ error: err.message || 'Media failed' });
    }
  });

  app.get('/api/plant-medicine/feed', async (req, res) => {
    try {
      const viewer = await verifyHiveAuth(req);
      const posts = await listCommunityFeed(db, { viewerUid: viewer?.uid, gcsBucket });
      return res.json({ posts });
    } catch (err) {
      console.error('[plant-medicine/feed GET]', err);
      return res.status(500).json({ error: err.message || 'Failed to load feed' });
    }
  });

  app.post('/api/plant-medicine/feed/enrich', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const hiveUserId = resolvePlantHiveUserId(user.uid);
      await ensureHiveUser(db, hiveUserId);
      const { title, text, plantId, feedCategory, attachment } = req.body || {};
      if (plantId && !PLANT_ID_RE.test(String(plantId))) {
        return res.status(400).json({ error: 'Invalid plant id' });
      }
      const result = await runCommunityPostEnrich(db, hiveUserId, {
        title,
        text,
        plantId,
        feedCategory,
        attachment,
        email: user.email,
      });
      if (!result.ok) {
        const status = result.needPayment ? 402 : 400;
        return res.status(status).json(result);
      }
      return res.json(result);
    } catch (err) {
      console.error('[plant-medicine/feed/enrich]', err);
      return res.status(500).json({ error: err.message || 'Enrichment failed' });
    }
  });

  app.post('/api/plant-medicine/feed/posts', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { title, text, imageUrl, imageUrls, videoUrl, plantId, feedCategory, aiTags, aiEnriched } =
        req.body || {};
      if (plantId && !PLANT_ID_RE.test(String(plantId))) {
        return res.status(400).json({ error: 'Invalid plant id' });
      }
      if (feedCategory && feedCategory !== 'plants' && feedCategory !== 'edibles') {
        return res.status(400).json({ error: 'feedCategory must be plants or edibles' });
      }
      const post = await createFeedPost(
        db,
        FieldValue,
        {
          author: user,
          title,
          text,
          imageUrl,
          imageUrls,
          videoUrl,
          plantId: plantId || null,
          feedCategory: feedCategory || null,
          aiTags,
          aiEnriched: !!aiEnriched,
        },
        gcsBucket,
      );
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[plant-medicine/feed POST]', err);
      const status = err.message === 'Title is required.' ? 400 : 500;
      return res.status(status).json({ error: err.message || 'Failed to create post' });
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
      const posts = await listPostsForPlant(db, plantId, { type, viewerUid: viewer?.uid, gcsBucket });
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
      }, gcsBucket);
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[plant-medicine/posts POST]', err);
      return res.status(500).json({ error: err.message || 'Failed to create post' });
    }
  });

  app.get('/api/plant-medicine/libraries/:library/topics/:topicId/posts', async (req, res) => {
    try {
      const library = String(req.params.library || '');
      const topicId = String(req.params.topicId || '');
      if (!TOPIC_LIBRARY_RE.test(library)) {
        return res.status(400).json({ error: 'Invalid library' });
      }
      if (!TOPIC_ID_RE.test(topicId)) {
        return res.status(400).json({ error: 'Invalid topic id' });
      }
      const type = req.query.type === 'comment' || req.query.type === 'photo' ? req.query.type : undefined;
      const viewer = await verifyHiveAuth(req);
      const posts = await listPostsForTopic(db, library, topicId, { type, viewerUid: viewer?.uid, gcsBucket });
      return res.json({ posts });
    } catch (err) {
      console.error('[plant-medicine/topic-posts GET]', err);
      return res.status(500).json({ error: err.message || 'Failed to load posts' });
    }
  });

  app.post('/api/plant-medicine/libraries/:library/topics/:topicId/posts', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const library = String(req.params.library || '');
      const topicId = String(req.params.topicId || '');
      if (!TOPIC_LIBRARY_RE.test(library)) {
        return res.status(400).json({ error: 'Invalid library' });
      }
      if (!TOPIC_ID_RE.test(topicId)) {
        return res.status(400).json({ error: 'Invalid topic id' });
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
      const post = await createTopicPost(
        db,
        FieldValue,
        { library, topicId, author: user, type, text, imageUrl },
        gcsBucket,
      );
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[plant-medicine/topic-posts POST]', err);
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

  app.get('/api/plant-medicine/content/:kind/:contentId/engagement', async (req, res) => {
    try {
      const kind = String(req.params.kind || '');
      const contentId = String(req.params.contentId || '');
      if (!CONTENT_KIND_RE.test(kind)) return res.status(400).json({ error: 'Invalid content kind' });
      const viewer = await verifyHiveAuth(req);
      const engagement = await getContentEngagement(db, kind, contentId, viewer?.uid);
      return res.json({ engagement });
    } catch (err) {
      console.error('[plant-medicine/engagement GET]', err);
      return res.status(500).json({ error: err.message || 'Failed to load engagement' });
    }
  });

  app.post('/api/plant-medicine/content/:kind/:contentId/upvote', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const kind = String(req.params.kind || '');
      const contentId = String(req.params.contentId || '');
      if (!CONTENT_KIND_RE.test(kind)) return res.status(400).json({ error: 'Invalid content kind' });
      const result = await toggleContentUpvote(db, kind, contentId, user.uid);
      return res.json(result);
    } catch (err) {
      console.error('[plant-medicine/content upvote]', err);
      return res.status(400).json({ error: err.message || 'Upvote failed' });
    }
  });

  app.get('/api/plant-medicine/essays/:essayId/posts', async (req, res) => {
    try {
      const essayId = String(req.params.essayId || '');
      if (!TOPIC_ID_RE.test(essayId)) return res.status(400).json({ error: 'Invalid essay id' });
      const type = req.query.type === 'comment' || req.query.type === 'photo' ? req.query.type : undefined;
      const viewer = await verifyHiveAuth(req);
      const posts = await listPostsForEssay(db, essayId, { type, viewerUid: viewer?.uid, gcsBucket });
      return res.json({ posts });
    } catch (err) {
      console.error('[plant-medicine/essay-posts GET]', err);
      return res.status(500).json({ error: err.message || 'Failed to load posts' });
    }
  });

  app.post('/api/plant-medicine/essays/:essayId/posts', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const essayId = String(req.params.essayId || '');
      if (!TOPIC_ID_RE.test(essayId)) return res.status(400).json({ error: 'Invalid essay id' });
      const { type, text, imageUrl } = req.body || {};
      if (type !== 'comment' && type !== 'photo') {
        return res.status(400).json({ error: 'type must be comment or photo' });
      }
      if (type === 'comment' && !String(text || '').trim()) {
        return res.status(400).json({ error: 'Comment text required' });
      }
      const post = await createEssayPost(
        db,
        FieldValue,
        { essayId, author: user, type, text, imageUrl },
        gcsBucket,
      );
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[plant-medicine/essay-posts POST]', err);
      return res.status(500).json({ error: err.message || 'Failed to create post' });
    }
  });

  app.get('/api/plant-medicine/posts/:postId/comments', async (req, res) => {
    try {
      const threadPostId = String(req.params.postId || '');
      const viewer = await verifyHiveAuth(req);
      const posts = await listThreadComments(db, threadPostId, { viewerUid: viewer?.uid, gcsBucket });
      return res.json({ posts });
    } catch (err) {
      console.error('[plant-medicine/thread GET]', err);
      return res.status(500).json({ error: err.message || 'Failed to load comments' });
    }
  });

  app.post('/api/plant-medicine/posts/:postId/comments', async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const threadPostId = String(req.params.postId || '');
      const { text } = req.body || {};
      if (!String(text || '').trim()) return res.status(400).json({ error: 'Comment text required' });
      const post = await createThreadComment(db, { threadPostId, author: user, text }, gcsBucket);
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[plant-medicine/thread POST]', err);
      return res.status(500).json({ error: err.message || 'Failed to post comment' });
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

  app.post('/api/plant-medicine/chat', express.json({ limit: '512kb' }), async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const { plantId, essayId, library, topicId, message, history = [], contextText, focusTitle } = req.body || {};
      const hiveUserId = resolvePlantHiveUserId(user.uid);
      const result = await runPlantMedicineChat(db, hiveUserId, {
        plantId,
        essayId,
        library,
        topicId,
        message,
        history,
        contextText,
        focusTitle,
        email: user.email,
      });

      if (!result.ok) {
        const status = result.needPayment ? 402 : result.error === 'Plant not found in library.' ? 404 : 400;
        return res.status(status).json(result);
      }

      return res.json(result);
    } catch (err) {
      console.error('[plant-medicine/chat]', err);
      return res.status(500).json({ error: err.message || 'Chat failed' });
    }
  });

  /** Holistic / Living Knowledge free-form chat — client supplies RAG context; free; no credits. */
  app.post('/api/plant-medicine/living-knowledge-chat', express.json({ limit: '1mb' }), async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const { message, context = '', scope = 'all', history = [] } = req.body || {};
      const hiveUserId = resolvePlantHiveUserId(user.uid);
      const result = await runLivingKnowledgeChat(db, hiveUserId, {
        message,
        context,
        scope,
        history,
        email: user.email,
      });

      if (!result.ok) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err) {
      console.error('[plant-medicine/living-knowledge-chat]', err);
      return res.status(500).json({ error: err.message || 'Chat failed' });
    }
  });

  /** Paid Bhive Credits photo plant ID — Hive credits; returns candidates + dangerous lookalikes. */
  app.post('/api/plant-medicine/identify', express.json({ limit: '8mb' }), async (req, res) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const { message, context = '', attachment } = req.body || {};
      const hiveUserId = resolvePlantHiveUserId(user.uid);
      const result = await runPlantPhotoIdentify(db, hiveUserId, {
        message,
        context,
        attachment,
        email: user.email,
      });

      if (!result.ok) {
        const status = result.needPayment ? 402 : result.code === 'grok_vision_failed' ? 502 : 400;
        return res.status(status).json(result);
      }

      return res.json(result);
    } catch (err) {
      console.error('[plant-medicine/identify]', err);
      return res.status(500).json({ error: err.message || 'Photo identify failed' });
    }
  });
}
