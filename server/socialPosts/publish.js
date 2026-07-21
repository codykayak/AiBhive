import { Timestamp } from 'firebase-admin/firestore';
import { getCompanySocialCredentials } from './companies.js';
import { getPostByDate, parsePostDocId, savePost } from './store.js';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

async function graphRequest(method, path, params) {
  const url = new URL(`${GRAPH_API}${path}`);
  if (method === 'GET') {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Graph API error (${res.status})`);
    }
    return data;
  }

  const body = new URLSearchParams(params);
  const res = await fetch(url.toString(), { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Graph API error (${res.status})`);
  }
  return data;
}

function buildFacebookMessage(post) {
  const { caption, link } = post.facebook || {};
  let message = String(caption || '').trim();
  if (link && !message.includes(link)) message = `${message}\n\n${link}`.trim();
  return message;
}

function buildInstagramCaption(post) {
  const parts = [post.instagram?.caption || ''];
  const tags = post.instagram?.hashtags?.join(' ');
  if (tags && !parts[0].includes(tags)) parts.push(tags);
  const link = post.instagram?.link || post.facebook?.link;
  if (link && !parts.join('\n').includes(link)) parts.push(link);
  return parts.filter(Boolean).join('\n\n').trim();
}

export async function publishToFacebook(post, credentials) {
  const { pageId, accessToken } = credentials;
  if (!pageId || !accessToken) {
    throw new Error('Facebook Page ID and page access token are required in your profile.');
  }
  if (!post.facebook?.imageUrl) {
    throw new Error('Facebook image is missing. Regenerate the post first.');
  }

  const data = await graphRequest('POST', `/${pageId}/photos`, {
    url: post.facebook.imageUrl,
    caption: buildFacebookMessage(post),
    access_token: accessToken,
  });

  const platformPostId = data.post_id || data.id;
  let postUrl = platformPostId ? `https://www.facebook.com/${platformPostId}` : null;

  if (platformPostId) {
    try {
      const meta = await graphRequest('GET', `/${platformPostId}`, {
        fields: 'permalink_url',
        access_token: accessToken,
      });
      postUrl = meta.permalink_url || postUrl;
    } catch {
      // permalink lookup is optional
    }
  }

  return {
    status: 'posted',
    platformPostId,
    postUrl,
    postedAt: new Date().toISOString(),
  };
}

export async function publishToInstagram(post, credentials) {
  const { accountId, accessToken } = credentials;
  if (!accountId || !accessToken) {
    throw new Error('Instagram business account ID and access token are required in your profile.');
  }
  if (!post.instagram?.imageUrl) {
    throw new Error('Instagram image is missing. Regenerate the post first.');
  }

  const container = await graphRequest('POST', `/${accountId}/media`, {
    image_url: post.instagram.imageUrl,
    caption: buildInstagramCaption(post),
    access_token: accessToken,
  });

  const published = await graphRequest('POST', `/${accountId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });

  let postUrl = null;
  try {
    const meta = await graphRequest('GET', `/${published.id}`, {
      fields: 'permalink',
      access_token: accessToken,
    });
    postUrl = meta.permalink || null;
  } catch {
    postUrl = null;
  }

  return {
    status: 'posted',
    platformPostId: published.id,
    postUrl,
    postedAt: new Date().toISOString(),
  };
}

export async function publishSocialPost(post, company, platforms = ['facebook', 'instagram']) {
  const keys = getCompanySocialCredentials(company);
  const results = {};

  for (const platform of platforms) {
    try {
      if (platform === 'facebook') {
        results.facebook = await publishToFacebook(post, keys.facebook);
      } else if (platform === 'instagram') {
        results.instagram = await publishToInstagram(post, keys.instagram);
      }
    } catch (e) {
      results[platform] = {
        status: 'failed',
        error: e.message,
        postedAt: new Date().toISOString(),
      };
    }
  }

  return results;
}

export async function publishAndSavePost(postId, company, platforms) {
  const { companyId, dateKey } = parsePostDocId(postId);
  const post = await getPostByDate(company?.id || companyId, dateKey);
  if (!post) throw new Error('Post not found.');

  const results = await publishSocialPost(post, company, platforms);
  const publishStatus = { ...(post.publishStatus || {}), ...results };

  const requested = platforms.filter((p) => p === 'facebook' || p === 'instagram');
  const allPosted = requested.every((p) => publishStatus[p]?.status === 'posted');
  const anyPosted = requested.some((p) => publishStatus[p]?.status === 'posted');

  const patch = {
    publishStatus,
    updatedAt: Timestamp.now(),
  };
  if (allPosted) {
    patch.status = 'posted';
    patch.postedAt = Timestamp.now();
  } else if (anyPosted) {
    patch.status = 'partially_posted';
  }

  return savePost(postId, patch);
}
