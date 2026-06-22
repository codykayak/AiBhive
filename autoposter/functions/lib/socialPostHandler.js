import { Timestamp } from 'firebase-admin/firestore';
import { generateDailySocialPost, resendPostNotification } from './socialPostGenerator.js';
import { sendTestSms } from './socialPostNotify.js';
import {
  getConfig,
  getPostByDate,
  listPosts,
  patchPostCaptions,
  saveConfig,
  savePost,
  safeCompareKeys,
  serializePost,
} from './socialPostStore.js';
import { todayDateKey } from './socialPostTopics.js';

const ALLOWED_ORIGINS = [
  'https://www.aibhive.com',
  'https://aibhive.com',
  /^https:\/\/.*\.aibhive\.com$/,
  'https://www.macrorei.com',
  'https://macrorei.com',
  /^https:\/\/.*\.macrorei\.com$/,
  'https://www.manydoorsai.com',
  'https://manydoorsai.com',
  /^https:\/\/.*\.manydoorsai\.com$/,
  'https://realestate-map-23692.web.app',
  'https://realestate-map-23692.firebaseapp.com',
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  'http://localhost:5174',
];

function corsOrigin(req) {
  const origin = req.get('origin') || req.get('Origin') || '';
  if (!origin) return ALLOWED_ORIGINS[0];
  const ok = ALLOWED_ORIGINS.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin));
  return ok ? origin : ALLOWED_ORIGINS[0];
}

export function setSocialCors(req, res) {
  res.set('Access-Control-Allow-Origin', corsOrigin(req));
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Social-Admin-Key');
  res.set('Access-Control-Max-Age', '3600');
}

function checkAdminKey(req) {
  const expected = process.env.SOCIAL_ADMIN_API_KEY;
  if (!expected) {
    return { ok: false, error: 'SOCIAL_ADMIN_API_KEY is not configured on the server.' };
  }
  const provided = req.get('X-Social-Admin-Key') || req.get('x-social-admin-key') || '';
  if (!safeCompareKeys(provided, expected)) {
    return { ok: false, error: 'Invalid admin API key.' };
  }
  return { ok: true };
}

function computeStats(posts) {
  const today = todayDateKey();
  const counts = { pending: 0, approved: 0, posted: 0, failed: 0, generating: 0 };
  let todayPost = null;

  for (const p of posts) {
    const status = p.status || 'pending_review';
    if (status === 'pending_review') counts.pending += 1;
    else if (status === 'approved') counts.approved += 1;
    else if (status === 'posted') counts.posted += 1;
    else if (status === 'failed') counts.failed += 1;
    else if (status === 'generating') counts.generating += 1;
    if (p.date === today || p.id === today) todayPost = p;
  }

  return { counts, today, todayPost: todayPost ? serializePost(todayPost) : null };
}

export async function handleSocialPosts(req, res) {
  setSocialCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const auth = checkAdminKey(req);
  if (!auth.ok) {
    res.status(401).json({ error: auth.error });
    return;
  }

  try {
    if (req.method === 'GET') {
      const action = req.query?.action || 'list';

      if (action === 'list') {
        const limit = Math.min(Number(req.query?.limit) || 30, 100);
        const posts = await listPosts(limit);
        const serialized = posts.map(serializePost);
        res.status(200).json({
          posts: serialized,
          stats: computeStats(posts),
        });
        return;
      }

      if (action === 'config') {
        const config = await getConfig();
        res.status(200).json({ config });
        return;
      }

      if (action === 'get' && req.query?.postId) {
        const post = await getPostByDate(req.query.postId);
        if (!post) {
          res.status(404).json({ error: 'Post not found.' });
          return;
        }
        res.status(200).json({ post: serializePost(post) });
        return;
      }

      res.status(400).json({ error: `Unknown GET action: ${action}` });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { action, postId, updates, force } = req.body ?? {};

    if (action === 'generate') {
      const result = await generateDailySocialPost({
        force: !!force,
        generatedBy: 'manual',
      });
      res.status(200).json({
        post: serializePost(result.post),
        skipped: result.skipped,
        reason: result.reason,
      });
      return;
    }

    if (action === 'approve' && postId) {
      const post = await savePost(postId, {
        status: 'approved',
        approvedAt: Timestamp.now(),
      });
      res.status(200).json({ post: serializePost(post) });
      return;
    }

    if (action === 'reject' && postId) {
      const post = await savePost(postId, { status: 'rejected' });
      res.status(200).json({ post: serializePost(post) });
      return;
    }

    if (action === 'markPosted' && postId) {
      const post = await savePost(postId, {
        status: 'posted',
        postedAt: Timestamp.now(),
      });
      res.status(200).json({ post: serializePost(post) });
      return;
    }

    if (action === 'update' && postId && updates) {
      const post = await patchPostCaptions(postId, updates);
      res.status(200).json({ post: serializePost(post) });
      return;
    }

    if (action === 'resendNotify' && postId) {
      const post = await resendPostNotification(postId);
      res.status(200).json({ post: serializePost(post) });
      return;
    }

    if (action === 'testSms') {
      const config = await getConfig();
      const phone = req.body?.phone || config.notifyPhone;
      const result = await sendTestSms(phone);
      res.status(200).json({ ok: true, result });
      return;
    }

    if (action === 'updateConfig') {
      const { notifyPhone, notifyEnabled, scheduleHour, adminBaseUrl } = req.body ?? {};
      const patch = {};
      if (notifyPhone !== undefined) patch.notifyPhone = String(notifyPhone);
      if (notifyEnabled !== undefined) patch.notifyEnabled = !!notifyEnabled;
      if (scheduleHour !== undefined) patch.scheduleHour = Number(scheduleHour);
      if (adminBaseUrl !== undefined) patch.adminBaseUrl = String(adminBaseUrl);
      const config = await saveConfig(patch);
      res.status(200).json({ config });
      return;
    }

    res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    console.error('[pmSocialPosts]', e);
    res.status(500).json({ error: e.message || 'Request failed' });
  }
}
