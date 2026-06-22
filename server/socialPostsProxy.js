/**
 * Proxies AutoPoster requests to the Firebase socialPosts function.
 * SOCIAL_ADMIN_API_KEY stays server-side only; clients use Google auth via verifyAdmin.
 */

function getSocialApiUrl() {
  const url = process.env.SOCIAL_API_URL || process.env.VITE_SOCIAL_API_URL;
  if (!url) {
    throw new Error('SOCIAL_API_URL is not configured on the server.');
  }
  return url.replace(/\/$/, '');
}

function getSocialAdminKey() {
  const key = process.env.SOCIAL_ADMIN_API_KEY;
  if (!key) {
    throw new Error('SOCIAL_ADMIN_API_KEY is not configured on the server.');
  }
  return key;
}

export async function proxySocialPostsRequest(req) {
  const base = getSocialApiUrl();
  const adminKey = getSocialAdminKey();

  if (req.method === 'GET') {
    const url = new URL(base);
    for (const [key, value] of Object.entries(req.query || {})) {
      if (value != null && value !== '') url.searchParams.set(key, String(value));
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Social-Admin-Key': adminKey,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  if (req.method === 'POST') {
    const res = await fetch(base, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Social-Admin-Key': adminKey,
      },
      body: JSON.stringify(req.body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  return { status: 405, data: { error: 'Method not allowed' } };
}
