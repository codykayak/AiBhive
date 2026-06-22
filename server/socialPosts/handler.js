import { Timestamp } from 'firebase-admin/firestore';
import { generateDailySocialPost, resendPostNotification } from './generator.js';
import { sendTestSms } from './notify.js';
import {
  getConfig,
  getPostByDate,
  listPosts,
  patchPostCaptions,
  saveConfig,
  savePost,
  serializePost,
} from './store.js';
import { todayDateKey } from './topics.js';

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

export async function handleSocialPostsRequest(req) {
  if (req.method === 'GET') {
    const action = req.query?.action || 'list';

    if (action === 'list') {
      const limit = Math.min(Number(req.query?.limit) || 30, 100);
      const posts = await listPosts(limit);
      const serialized = posts.map(serializePost);
      return {
        status: 200,
        data: { posts: serialized, stats: computeStats(posts) },
      };
    }

    if (action === 'config') {
      const config = await getConfig();
      return { status: 200, data: { config } };
    }

    if (action === 'get' && req.query?.postId) {
      const post = await getPostByDate(req.query.postId);
      if (!post) {
        return { status: 404, data: { error: 'Post not found.' } };
      }
      return { status: 200, data: { post: serializePost(post) } };
    }

    return { status: 400, data: { error: `Unknown GET action: ${action}` } };
  }

  if (req.method !== 'POST') {
    return { status: 405, data: { error: 'Method not allowed' } };
  }

  const { action, postId, updates, force } = req.body ?? {};

  if (action === 'generate') {
    const result = await generateDailySocialPost({
      force: !!force,
      generatedBy: 'manual',
    });
    return {
      status: 200,
      data: {
        post: serializePost(result.post),
        skipped: result.skipped,
        reason: result.reason,
      },
    };
  }

  if (action === 'approve' && postId) {
    const post = await savePost(postId, {
      status: 'approved',
      approvedAt: Timestamp.now(),
    });
    return { status: 200, data: { post: serializePost(post) } };
  }

  if (action === 'reject' && postId) {
    const post = await savePost(postId, { status: 'rejected' });
    return { status: 200, data: { post: serializePost(post) } };
  }

  if (action === 'markPosted' && postId) {
    const post = await savePost(postId, {
      status: 'posted',
      postedAt: Timestamp.now(),
    });
    return { status: 200, data: { post: serializePost(post) } };
  }

  if (action === 'update' && postId && updates) {
    const post = await patchPostCaptions(postId, updates);
    return { status: 200, data: { post: serializePost(post) } };
  }

  if (action === 'resendNotify' && postId) {
    const post = await resendPostNotification(postId);
    return { status: 200, data: { post: serializePost(post) } };
  }

  if (action === 'testSms') {
    const config = await getConfig();
    const phone = req.body?.phone || config.notifyPhone;
    const result = await sendTestSms(phone);
    return { status: 200, data: { ok: true, result } };
  }

  if (action === 'updateConfig') {
    const { notifyPhone, notifyEnabled, scheduleHour, adminBaseUrl } = req.body ?? {};
    const patch = {};
    if (notifyPhone !== undefined) patch.notifyPhone = String(notifyPhone);
    if (notifyEnabled !== undefined) patch.notifyEnabled = !!notifyEnabled;
    if (scheduleHour !== undefined) patch.scheduleHour = Number(scheduleHour);
    if (adminBaseUrl !== undefined) patch.adminBaseUrl = String(adminBaseUrl);
    const config = await saveConfig(patch);
    return { status: 200, data: { config } };
  }

  return { status: 400, data: { error: `Unknown action: ${action}` } };
}
