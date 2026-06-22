const DEFAULT_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:5001/demo/us-central1/socialPosts'
  : '';

const STORAGE_KEY = 'social:adminKey';

export const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', aspect: 'landscape', charLimit: 63206 },
  { id: 'instagram', label: 'Instagram', aspect: 'portrait', charLimit: 2200 },
  { id: 'x', label: 'X', aspect: 'landscape', charLimit: 280 },
];

export function getSocialApiUrl() {
  const url = import.meta.env.VITE_SOCIAL_API_URL || DEFAULT_URL;
  if (!url) {
    throw new Error('VITE_SOCIAL_API_URL is not configured. Set it in autoposter/admin/.env.local.');
  }
  return url.replace(/\/$/, '');
}

export function getStoredAdminKey() {
  try { return sessionStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

export function setStoredAdminKey(key) {
  try {
    if (key) sessionStorage.setItem(STORAGE_KEY, key);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

async function request(method, { action, body, query } = {}) {
  const key = getStoredAdminKey();
  if (!key) throw new Error('Enter your Social Admin API key in settings.');

  const url = new URL(getSocialApiUrl());
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Social-Admin-Key': key },
    body: method === 'POST' ? JSON.stringify({ action, ...body }) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const listSocialPosts = (limit = 30) =>
  request('GET', { query: { action: 'list', limit: String(limit) } });
export const getSocialConfig = () => request('GET', { query: { action: 'config' } });
export const generateSocialPost = (force = false) =>
  request('POST', { action: 'generate', body: { force } });
export const approveSocialPost = (postId) => request('POST', { action: 'approve', body: { postId } });
export const rejectSocialPost = (postId) => request('POST', { action: 'reject', body: { postId } });
export const markSocialPostPosted = (postId) => request('POST', { action: 'markPosted', body: { postId } });
export const updateSocialCaptions = (postId, updates) =>
  request('POST', { action: 'update', body: { postId, updates } });
export const updateSocialConfig = (config) => request('POST', { action: 'updateConfig', body: config });
export const resendSocialNotify = (postId) => request('POST', { action: 'resendNotify', body: { postId } });
export const sendTestSms = (phone) => request('POST', { action: 'testSms', body: { phone } });

export function copyPostBundle(post, platform) {
  const p = post[platform];
  if (!p) return '';
  const lines = [p.caption];
  if (p.link && !p.caption?.includes(p.link)) lines.push('', p.link);
  if (platform === 'instagram' && p.hashtags?.length) {
    const tagLine = p.hashtags.join(' ');
    if (!p.caption?.includes(tagLine)) lines.push('', tagLine);
  }
  return lines.join('\n').trim();
}

export function copyAllPlatforms(post) {
  return PLATFORMS.map((pl) => `=== ${pl.label.toUpperCase()} ===\n${copyPostBundle(post, pl.id)}`).join('\n\n');
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

export function formatPostDate(dateStr) {
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return dateStr; }
}
