import { Timestamp } from 'firebase-admin/firestore';
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  saveCompany,
  sanitizeCompany,
} from './companies.js';
import { generateDailySocialPost, resendPostNotification } from './generator.js';
import { sendTestSms } from './notify.js';
import { publishAndSavePost } from './publish.js';
import {
  getConfig,
  getPostByDate,
  listPosts,
  parsePostDocId,
  patchPostCaptions,
  saveConfig,
  savePost,
  serializePost,
} from './store.js';
import { todayDateKey } from './topics.js';
import { WORKFLOW_PIPELINE } from './workflow.js';
import {
  getUserProfile,
  saveUserProfile,
  sanitizeUserProfile,
} from './userProfile.js';

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
    if (p.date === today || p.id?.endsWith(`_${today}`)) todayPost = p;
  }

  return { counts, today, todayPost: todayPost ? serializePost(todayPost) : null };
}

function resolveCompanyId(req) {
  return req.query?.companyId || req.body?.companyId || 'aibhive';
}

export async function handleSocialPostsRequest(req, authUser) {
  if (req.method === 'GET') {
    const action = req.query?.action || 'list';

    if (action === 'companies') {
      const companies = await listCompanies();
      return {
        status: 200,
        data: { companies: companies.map(sanitizeCompany) },
      };
    }

    if (action === 'company' && req.query?.companyId) {
      const company = await getCompany(req.query.companyId);
      if (!company) return { status: 404, data: { error: 'Company not found.' } };
      return { status: 200, data: { company: sanitizeCompany(company) } };
    }

    if (action === 'profile' && authUser?.uid) {
      const profile = await getUserProfile(authUser.uid);
      return { status: 200, data: { profile: sanitizeUserProfile(profile) } };
    }

    if (action === 'list') {
      const companyId = resolveCompanyId(req);
      const limit = Math.min(Number(req.query?.limit) || 30, 100);
      const posts = await listPosts(companyId, limit);
      const serialized = posts.map(serializePost);
      return {
        status: 200,
        data: { posts: serialized, stats: computeStats(posts), companyId },
      };
    }

    if (action === 'config') {
      const config = await getConfig();
      return { status: 200, data: { config, pipeline: WORKFLOW_PIPELINE } };
    }

    if (action === 'workflow') {
      const companyId = resolveCompanyId(req);
      const config = await getConfig();
      const company = await getCompany(companyId);
      const profile = authUser?.uid
        ? sanitizeUserProfile(await getUserProfile(authUser.uid))
        : null;
      return {
        status: 200,
        data: {
          pipeline: WORKFLOW_PIPELINE,
          config,
          company: company ? sanitizeCompany(company) : null,
          profile,
        },
      };
    }

    if (action === 'get' && req.query?.postId) {
      const companyId = resolveCompanyId(req);
      const { dateKey } = parsePostDocId(req.query.postId);
      const post = await getPostByDate(companyId, dateKey);
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
  const companyId = resolveCompanyId(req);

  if (action === 'createCompany') {
    const company = await createCompany({ name: req.body?.name });
    return { status: 200, data: { company: sanitizeCompany(company) } };
  }

  if (action === 'updateCompany' && companyId) {
    const { action: _a, companyId: _c, ...patch } = req.body ?? {};
    const company = await saveCompany(companyId, patch);
    return { status: 200, data: { company: sanitizeCompany(company) } };
  }

  if (action === 'deleteCompany' && companyId) {
    await deleteCompany(companyId);
    return { status: 200, data: { ok: true } };
  }

  if (action === 'generate') {
    const company = await getCompany(companyId);
    if (!company) return { status: 404, data: { error: 'Company not found.' } };
    const dateStr = req.body?.date;
    const date = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(`${dateStr}T12:00:00`)
      : undefined;
    const result = await generateDailySocialPost({
      companyId,
      company,
      date,
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
    let post = await savePost(postId, {
      status: 'approved',
      approvedAt: Timestamp.now(),
    });

    const company = await getCompany(post.companyId || companyId);
    if (company?.autoPublishOnApprove) {
      post = await publishAndSavePost(postId, company, ['facebook', 'instagram']);
    }

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
    const post = await resendPostNotification(postId, companyId);
    return { status: 200, data: { post: serializePost(post) } };
  }

  if (action === 'testSms') {
    const config = await getConfig();
    const company = await getCompany(companyId);
    const phone = req.body?.phone || company?.notifyPhone || config.notifyPhone;
    const result = await sendTestSms(phone);
    return { status: 200, data: { ok: true, result } };
  }

  if (action === 'updateProfile' && authUser?.uid) {
    const { action: _a, ...profileUpdates } = req.body ?? {};
    const profile = await saveUserProfile(authUser.uid, authUser.email, profileUpdates);
    return { status: 200, data: { profile: sanitizeUserProfile(profile) } };
  }

  if (action === 'publish' && postId) {
    const company = await getCompany(companyId);
    if (!company) return { status: 404, data: { error: 'Company not found.' } };
    const platforms = Array.isArray(req.body?.platforms)
      ? req.body.platforms.filter((p) => p === 'facebook' || p === 'instagram')
      : ['facebook', 'instagram'];
    if (!platforms.length) {
      return { status: 400, data: { error: 'Specify platforms: facebook and/or instagram.' } };
    }
    const post = await publishAndSavePost(postId, company, platforms);
    return { status: 200, data: { post: serializePost(post) } };
  }

  if (action === 'updateConfig') {
    const {
      notifyPhone,
      notifyEnabled,
      scheduleHour,
      adminBaseUrl,
      socialLinks,
      textModel,
      imageModel,
    } = req.body ?? {};
    const patch = {};
    if (notifyPhone !== undefined) patch.notifyPhone = String(notifyPhone);
    if (notifyEnabled !== undefined) patch.notifyEnabled = !!notifyEnabled;
    if (scheduleHour !== undefined) patch.scheduleHour = Number(scheduleHour);
    if (adminBaseUrl !== undefined) patch.adminBaseUrl = String(adminBaseUrl);
    if (socialLinks !== undefined) patch.socialLinks = socialLinks;
    if (textModel !== undefined) patch.textModel = String(textModel);
    if (imageModel !== undefined) patch.imageModel = String(imageModel);
    const config = await saveConfig(patch);
    return { status: 200, data: { config } };
  }

  return { status: 400, data: { error: `Unknown action: ${action}` } };
}
