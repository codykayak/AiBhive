import { createHmac, randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';

const PROFILE_COL = 'employee_portal_profiles';
const SCOPES = ['openid', 'profile', 'offline_access', 'User.Read', 'Mail.Send'];

function oauthConfig() {
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID || process.env.OUTLOOK_CLIENT_ID || '';
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET || process.env.OUTLOOK_CLIENT_SECRET || '';
  const redirectUri =
    process.env.OUTLOOK_REDIRECT_URI ||
    `${process.env.PUBLIC_API_ORIGIN || 'https://aibhive.com'}/api/employee-portal/outlook/callback`;
  const tenant = process.env.MICROSOFT_GRAPH_TENANT || 'common';
  return { clientId, clientSecret, redirectUri, tenant, ready: Boolean(clientId && clientSecret) };
}

function profileRef(db, uid) {
  return db.collection(PROFILE_COL).doc(uid);
}

function stateSecret() {
  return process.env.OUTLOOK_STATE_SECRET || process.env.CRON_SECRET || 'dev-outlook-state';
}

function signState(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', stateSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyState(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expect = createHmac('sha256', stateSecret()).update(body).digest('base64url');
  if (sig !== expect) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function tokenUrl(tenant) {
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
}

function authorizeUrl(tenant) {
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`;
}

async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri, tenant } = oauthConfig();
  const res = await fetch(tokenUrl(tenant), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || 'token exchange failed');
  return data;
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret, tenant } = oauthConfig();
  const res = await fetch(tokenUrl(tenant), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: SCOPES.join(' '),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || 'refresh failed');
  return data;
}

export function outlookPublicStatus(profile) {
  const om = profile?.outlook || {};
  return {
    configured: oauthConfig().ready,
    connected: Boolean(om.refreshToken),
    connectedEmail: om.connectedEmail || '',
    connectedAt: om.connectedAt || null,
  };
}

export function buildOutlookAuthUrl({ uid, email }) {
  const { clientId, redirectUri, ready, tenant } = oauthConfig();
  if (!ready) throw new Error('Outlook / Microsoft Graph OAuth is not configured (client id/secret).');
  const state = signState({
    uid,
    email,
    exp: Date.now() + 15 * 60 * 1000,
    nonce: randomBytes(8).toString('hex'),
  });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    response_mode: 'query',
    state,
    prompt: 'consent',
  });
  return `${authorizeUrl(tenant)}?${params}`;
}

export async function saveOutlookTokens(db, uid, tokens, email) {
  const patch = {
    outlook: {
      refreshToken: tokens.refresh_token || tokens.refreshToken,
      accessToken: tokens.access_token || null,
      accessTokenExpiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
      connectedEmail: email || '',
      connectedAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  };
  if (!patch.outlook.refreshToken) {
    const prev = await profileRef(db, uid).get();
    const existing = prev.exists ? prev.data()?.outlook?.refreshToken : null;
    if (existing) patch.outlook.refreshToken = existing;
  }
  await profileRef(db, uid).set(patch, { merge: true });
}

async function getAccessToken(db, uid) {
  const snap = await profileRef(db, uid).get();
  const om = snap.exists ? snap.data()?.outlook : null;
  if (!om?.refreshToken) return null;
  if (om.accessToken && om.accessTokenExpiresAt && om.accessTokenExpiresAt > Date.now() + 60_000) {
    return om.accessToken;
  }
  const data = await refreshAccessToken(om.refreshToken);
  await profileRef(db, uid).set(
    {
      outlook: {
        accessToken: data.access_token,
        accessTokenExpiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
        refreshToken: data.refresh_token || om.refreshToken,
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
    { merge: true },
  );
  return data.access_token;
}

export async function sendOutlookMail(db, uid, { to, subject, body }) {
  const toAddr = String(to || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddr)) {
    throw Object.assign(new Error('Valid recipient email required on the lead.'), { status: 400 });
  }
  const access = await getAccessToken(db, uid);
  if (!access) {
    throw Object.assign(new Error('Connect your Outlook account in the employee portal first.'), { status: 503 });
  }
  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: String(subject || '').slice(0, 200),
        body: { contentType: 'Text', content: String(body || '').slice(0, 8000) },
        toRecipients: [{ emailAddress: { address: toAddr } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.error?.message || `sendMail failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status === 401 ? 503 : 502 });
  }
  return { ok: true, to: toAddr };
}

export function registerOutlookMailRoutes(app, db, requireEmployee) {
  app.get('/api/employee-portal/outlook/status', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const snap = await profileRef(db, user.uid).get();
    const profile = snap.exists ? snap.data() : {};
    return res.json({
      ...outlookPublicStatus(profile),
      oauthReady: oauthConfig().ready,
    });
  });

  app.post('/api/employee-portal/outlook/connect', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    try {
      const url = buildOutlookAuthUrl({ uid: user.uid, email: user.email || '' });
      return res.json({ url });
    } catch (e) {
      return res.status(503).json({ error: e.message || 'Outlook OAuth not configured' });
    }
  });

  app.get('/api/employee-portal/outlook/callback', async (req, res) => {
    const code = String(req.query.code || '');
    const stateRaw = String(req.query.state || '');
    const payload = verifyState(stateRaw);
    if (!code || !payload?.uid) {
      return res.status(400).send('Invalid or expired Outlook connection. Return to the employee portal and try again.');
    }
    try {
      const tokens = await exchangeCode(code);
      await saveOutlookTokens(db, payload.uid, tokens, payload.email);
      const dest = `${process.env.PUBLIC_WEB_ORIGIN || 'https://aibhive.com'}/employee?outlook=connected`;
      return res.redirect(302, dest);
    } catch (e) {
      return res.status(500).send(e.message || 'Outlook connection failed');
    }
  });

  app.post('/api/employee-portal/outlook/disconnect', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    await profileRef(db, user.uid).set({ outlook: FieldValue.delete() }, { merge: true });
    return res.json({ ok: true });
  });
}
