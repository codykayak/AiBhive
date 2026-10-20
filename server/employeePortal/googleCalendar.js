import { createHmac, randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { defaultWorkspaceUid } from '../leadAgent/workspaceAccess.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const STATE_TTL_MS = 15 * 60 * 1000;

function oauthConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${process.env.PUBLIC_API_ORIGIN || 'https://aibhive.com'}/api/employee-portal/google-calendar/callback`;
  return { clientId, clientSecret, redirectUri, ready: Boolean(clientId && clientSecret) };
}

function businessDocRef(db, businessId) {
  const uid = defaultWorkspaceUid();
  return db.collection('lead_agent_workspaces').doc(uid).collection('businesses').doc(businessId);
}

function stateSecret() {
  return process.env.GOOGLE_CALENDAR_STATE_SECRET || process.env.CRON_SECRET || 'dev-calendar-state';
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

async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = oauthConfig();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || 'token exchange failed');
  return data;
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = oauthConfig();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || 'refresh failed');
  return data.access_token;
}

export function calendarPublicStatus(business) {
  const gc = business?.googleCalendar || {};
  return {
    configured: oauthConfig().ready,
    connected: Boolean(gc.refreshToken),
    calendarId: gc.calendarId || 'primary',
    connectedEmail: gc.connectedEmail || '',
    connectedAt: gc.connectedAt || null,
  };
}

export function buildGoogleCalendarAuthUrl({ uid, businessId, email }) {
  const { clientId, redirectUri, ready } = oauthConfig();
  if (!ready) throw new Error('Google Calendar OAuth is not configured on the server (client id/secret).');
  const state = signState({
    uid,
    businessId,
    email,
    exp: Date.now() + STATE_TTL_MS,
    nonce: randomBytes(8).toString('hex'),
  });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function saveGoogleCalendarTokens(db, businessId, tokens, email) {
  await businessDocRef(db, businessId).set(
    {
      googleCalendar: {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token || null,
        accessTokenExpiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
        calendarId: 'primary',
        connectedEmail: email || '',
        connectedAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
    { merge: true },
  );
}

export async function listGoogleCalendars(db, businessId, business) {
  const gc = business?.googleCalendar;
  if (!gc?.refreshToken) return [];
  const access = await refreshAccessToken(gc.refreshToken);
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer', {
    headers: { Authorization: `Bearer ${access}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || 'calendar list failed');
  return (data.items || []).map((c) => ({ id: c.id, summary: c.summary, primary: Boolean(c.primary) }));
}

export async function setGoogleCalendarId(db, businessId, calendarId) {
  await businessDocRef(db, businessId).set(
    {
      googleCalendar: {
        calendarId: String(calendarId || 'primary'),
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
    { merge: true },
  );
}

export async function createEscalationCalendarEvent(db, businessId, business, lead, context = {}) {
  const gc = business?.googleCalendar;
  if (!gc?.refreshToken) return { ok: false, reason: 'calendar_not_connected' };
  const access = await refreshAccessToken(gc.refreshToken);
  const tz = business?.escalationOps?.schedulingTimezone || 'America/Los_Angeles';
  const startIso = context.scheduledCallbackAt || new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const name = lead?.name || 'Lead';
  const phone = lead?.phone || '';
  const addr = lead?.propertyAddress || lead?.notes || '';
  const summary = `MacroREI callback: ${name}`.slice(0, 120);
  const description = [
    `Phone: ${phone}`,
    addr ? `Property: ${addr}` : '',
    context.inbound ? `They said: ${context.inbound}` : '',
    `Lead id: ${lead?.id || context.leadId || ''}`,
    'Created by AiBhive employee portal escalation.',
  ]
    .filter(Boolean)
    .join('\n');

  const event = {
    summary,
    description,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    reminders: { useDefault: true },
  };

  const calId = encodeURIComponent(gc.calendarId || 'primary');
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn('[googleCalendar] create event', data.error?.message || res.status);
    return { ok: false, reason: data.error?.message || 'create_failed' };
  }
  const leadId = lead?.id || context.leadId;
  if (leadId) {
    await businessDocRef(db, businessId)
      .collection('leads')
      .doc(leadId)
      .set(
        {
          googleCalendarEventId: data.id,
          googleCalendarEventLink: data.htmlLink || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }
  return { ok: true, eventId: data.id, htmlLink: data.htmlLink };
}

export function registerGoogleCalendarRoutes(app, db, requireEmployee) {
  app.get('/api/employee-portal/google-calendar/status', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.query.businessId || 'macrorei');
    const snap = await businessDocRef(db, businessId).get();
    const business = snap.exists ? snap.data() : {};
    let calendars = [];
    if (business.googleCalendar?.refreshToken) {
      try {
        calendars = await listGoogleCalendars(db, businessId, business);
      } catch (e) {
        calendars = [];
      }
    }
    return res.json({
      ...calendarPublicStatus(business),
      oauthReady: oauthConfig().ready,
      calendars,
    });
  });

  app.post('/api/employee-portal/google-calendar/connect', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    try {
      const url = buildGoogleCalendarAuthUrl({
        uid: user.uid,
        businessId,
        email: user.email || '',
      });
      return res.json({ url });
    } catch (e) {
      return res.status(503).json({ error: e.message || 'Calendar OAuth not configured' });
    }
  });

  app.get('/api/employee-portal/google-calendar/callback', async (req, res) => {
    const code = String(req.query.code || '');
    const stateRaw = String(req.query.state || '');
    const payload = verifyState(stateRaw);
    if (!code || !payload) {
      return res.status(400).send('Invalid or expired calendar connection. Go back to the employee portal and try again.');
    }
    try {
      const tokens = await exchangeCode(code);
      if (!tokens.refresh_token) {
        return res.status(400).send('Google did not return a refresh token. Revoke app access and connect again with consent.');
      }
      await saveGoogleCalendarTokens(db, payload.businessId, tokens, payload.email);
      const dest = `${process.env.PUBLIC_WEB_ORIGIN || 'https://aibhive.com'}/employee?calendar=connected`;
      return res.redirect(302, dest);
    } catch (e) {
      return res.status(500).send(e.message || 'Calendar connection failed');
    }
  });

  app.put('/api/employee-portal/google-calendar/calendar-id', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    const calendarId = String(req.body?.calendarId || 'primary');
    await setGoogleCalendarId(db, businessId, calendarId);
    return res.json({ ok: true, calendarId });
  });

  app.post('/api/employee-portal/google-calendar/disconnect', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    await businessDocRef(db, businessId).set({ googleCalendar: FieldValue.delete() }, { merge: true });
    return res.json({ ok: true });
  });
}

export { verifyState };
