const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', aspect: 'landscape', charLimit: 63206 },
  { id: 'instagram', label: 'Instagram', aspect: 'portrait', charLimit: 2200 },
  { id: 'x', label: 'X', aspect: 'landscape', charLimit: 280 },
];

function getApiUrl() {
  return `${API_BASE}/api/autoposter`;
}

async function request(method, user, { action, body, query } = {}) {
  if (!user) throw new Error('Sign in with Google to continue.');

  const token = await user.getIdToken();
  const url = new URL(getApiUrl(), window.location.origin);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: method === 'POST' ? JSON.stringify({ action, ...body }) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Access denied. Your Google account is not on the admin allowlist.');
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const listSocialPosts = (user, limit = 30) =>
  request('GET', user, { query: { action: 'list', limit: String(limit) } });
export const getSocialConfig = (user) => request('GET', user, { query: { action: 'config' } });
export const generateSocialPost = (user, force = false) =>
  request('POST', user, { action: 'generate', body: { force } });
export const approveSocialPost = (user, postId) =>
  request('POST', user, { action: 'approve', body: { postId } });
export const rejectSocialPost = (user, postId) =>
  request('POST', user, { action: 'reject', body: { postId } });
export const markSocialPostPosted = (user, postId) =>
  request('POST', user, { action: 'markPosted', body: { postId } });
export const updateSocialCaptions = (user, postId, updates) =>
  request('POST', user, { action: 'update', body: { postId, updates } });
export const updateSocialConfig = (user, config) =>
  request('POST', user, { action: 'updateConfig', body: config });
export const resendSocialNotify = (user, postId) =>
  request('POST', user, { action: 'resendNotify', body: { postId } });
export const sendTestSms = (user, phone) =>
  request('POST', user, { action: 'testSms', body: { phone } });

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
