import { createHmac, randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getDefaultBusiness, DEFAULT_BUSINESSES } from '../leadAgent/businessDefaults.js';
import { defaultWorkspaceUid } from '../leadAgent/workspaceAccess.js';
import { normalizePhone, sendLeadSms } from '../leadAgent/smsProvider.js';
import { personalizeOutbound } from '../leadAgent/outboundMessage.js';
import { canSendOutbound } from '../leadAgent/automation.js';
import { incrementDailySms } from '../leadAgent/inboundHandler.js';

const COL = 'lead_agent_workspaces';
const PROFILE_COL = 'employee_portal_profiles';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function businessRef(db, businessId) {
  return db.collection(COL).doc(defaultWorkspaceUid()).collection('businesses').doc(businessId);
}

function leadsRef(db, businessId) {
  return businessRef(db, businessId).collection('leads');
}

function mergeBusiness(businessId) {
  const defaults = getDefaultBusiness(businessId) || DEFAULT_BUSINESSES[0];
  return defaults;
}

async function loadBusiness(db, businessId) {
  const defaults = mergeBusiness(businessId);
  const snap = await businessRef(db, businessId).get();
  return { ...defaults, ...(snap.exists ? snap.data() : {}), id: businessId };
}

function leadScore(data) {
  const status = data.status || 'new';
  const open = status === 'new' || status === 'callback' ? 0 : 1;
  return open;
}

function serializeLead(id, data) {
  return {
    id,
    name: String(data.name || ''),
    phone: String(data.phone || ''),
    propertyAddress: String(data.propertyAddress || data.notes || ''),
    status: data.status || 'new',
    optedOut: Boolean(data.optedOut),
  };
}

async function listLeads(db, businessId) {
  const snap = await leadsRef(db, businessId).limit(400).get();
  return snap.docs
    .map((d) => serializeLead(d.id, d.data() || {}))
    .sort((a, b) => leadScore(a) - leadScore(b) || a.name.localeCompare(b.name));
}

function nextOpenLead(leads) {
  return leads.find((l) => l.phone && !l.optedOut && (l.status === 'new' || l.status === 'callback')) || null;
}

function dayStats(profile) {
  const day = todayKey();
  const bucket = profile?.deskDays?.[day] || {};
  return {
    date: day,
    calls: Number(bucket.calls || 0),
    texts: Number(bucket.texts || 0),
    lastLeadId: bucket.lastLeadId || null,
    lastDisposition: bucket.lastDisposition || null,
  };
}

function voiceConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const apiKey = process.env.TWILIO_API_KEY || '';
  const apiSecret = process.env.TWILIO_API_SECRET || '';
  const appSid = process.env.TWILIO_TWIML_APP_SID || '';
  const from = process.env.TWILIO_FROM_NUMBER || '';
  const smsReady = Boolean(accountSid && process.env.TWILIO_AUTH_TOKEN && from);
  const voiceReady = Boolean(accountSid && apiKey && apiSecret && appSid && from);
  return { smsReady, voiceReady, from };
}

function mintVoiceToken(identity) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const appSid = process.env.TWILIO_TWIML_APP_SID;
  if (!accountSid || !apiKey || !apiSecret || !appSid) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256', cty: 'twilio-fpa;v=1' })).toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({
      jti: `${apiKey}-${now}-${randomBytes(4).toString('hex')}`,
      iss: apiKey,
      sub: accountSid,
      nbf: now,
      exp: now + 3600,
      grants: {
        identity: String(identity || 'employee').slice(0, 80),
        voice: {
          incoming: { allow: false },
          outgoing: { application_sid: appSid },
        },
      },
    }),
  ).toString('base64url');
  const sig = createHmac('sha256', apiSecret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

async function bumpDay(db, uid, patch) {
  const day = todayKey();
  const ref = db.collection(PROFILE_COL).doc(uid);
  const snap = await ref.get();
  const prev = snap.exists ? snap.data()?.deskDays?.[day] || {} : {};
  const next = {
    calls: Number(prev.calls || 0) + Number(patch.calls || 0),
    texts: Number(prev.texts || 0) + Number(patch.texts || 0),
    lastLeadId: patch.lastLeadId || prev.lastLeadId || null,
    lastDisposition: patch.lastDisposition || prev.lastDisposition || null,
  };
  await ref.set(
    { deskDays: { [day]: next }, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return { date: day, ...next };
}

export function registerEmployeeDeskRoutes(app, db, requireEmployee) {
  app.get('/api/employee-portal/desk', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.query.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const business = await loadBusiness(db, businessId);
    const leads = await listLeads(db, businessId);
    const open = leads.filter((l) => !l.optedOut && (l.status === 'new' || l.status === 'callback'));
    const profileSnap = await db.collection(PROFILE_COL).doc(user.uid).get();
    const quota = canSendOutbound(business);
    const line = voiceConfig();
    return res.json({
      business: {
        id: business.id,
        name: business.name,
        tagline: business.tagline,
        phoneDisplay: business.phoneDisplay || '',
        greeting: business.greeting || '',
      },
      businesses: DEFAULT_BUSINESSES.map((b) => ({ id: b.id, name: b.name })),
      leads: leads.slice(0, 80),
      queue: {
        total: leads.length,
        remaining: open.length,
        position: open.length ? 1 : 0,
        current: nextOpenLead(leads),
      },
      quota: {
        ok: quota.ok !== false,
        reason: quota.reason || null,
        sent: Number(quota.sent || 0),
        limit: Number(quota.limit || business.dailySmsLimit || 40),
      },
      today: dayStats(profileSnap.exists ? profileSnap.data() : {}),
      line,
    });
  });

  app.post('/api/employee-portal/desk/text-next', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const business = await loadBusiness(db, businessId);
    const quota = canSendOutbound(business);
    if (!quota.ok) return res.status(429).json({ error: quota.reason || 'Cannot text right now', quota });
    const line = voiceConfig();
    if (!line.smsReady && business.smsProvider !== 'twilio') {
      return res.status(503).json({
        error: 'Laptop texting needs the company Twilio number (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).',
      });
    }
    const leads = await listLeads(db, businessId);
    const lead = nextOpenLead(leads);
    if (!lead) return res.json({ done: true, reason: 'no_leads' });
    const body = String(req.body?.body || personalizeOutbound(business, lead)).slice(0, 480);
    const result = await sendLeadSms({
      business,
      to: lead.phone,
      body,
      preferServerTwilio: true,
    });
    if (!result.sent && result.pendingDeviceSend) {
      return res.status(503).json({
        error: 'This list is still set to send from a phone. Turn on the company Twilio line to text from a laptop.',
        pendingDeviceSend: true,
      });
    }
    const uid = defaultWorkspaceUid();
    await leadsRef(db, businessId)
      .doc(lead.id)
      .collection('messages')
      .add({
        direction: 'outbound',
        body,
        provider: result.provider || 'twilio',
        at: FieldValue.serverTimestamp(),
        automated: true,
        via: 'employee-desk',
        employeeEmail: user.email || '',
      });
    await leadsRef(db, businessId).doc(lead.id).set(
      { status: 'texted', lastContactAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    if (result.sent) await incrementDailySms(db, uid, businessId);
    const today = await bumpDay(db, user.uid, { texts: 1, lastLeadId: lead.id, lastDisposition: 'texted' });
    return res.json({ done: false, lead, body, result, today });
  });

  app.post('/api/employee-portal/desk/call-log', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    const leadId = String(req.body?.leadId || '');
    const disposition = String(req.body?.disposition || 'talked').slice(0, 40);
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    const allowed = new Set(['talked', 'voicemail', 'no_answer', 'callback', 'skipped']);
    if (!allowed.has(disposition)) return res.status(400).json({ error: 'Unknown disposition' });
    const ref = leadsRef(db, businessId).doc(leadId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Lead not found' });
    const status = disposition === 'callback' ? 'callback' : disposition;
    await ref.set(
      {
        status,
        lastCallDisposition: disposition,
        lastContactAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastEmployeeEmail: user.email || '',
      },
      { merge: true },
    );
    const today = await bumpDay(db, user.uid, {
      calls: disposition === 'skipped' ? 0 : 1,
      lastLeadId: leadId,
      lastDisposition: disposition,
    });
    return res.json({ ok: true, today, status });
  });

  app.get('/api/employee-portal/desk/voice-token', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const line = voiceConfig();
    if (!line.voiceReady) {
      return res.json({
        ready: false,
        smsReady: line.smsReady,
        hint: 'Set TWILIO_API_KEY, TWILIO_API_SECRET, and TWILIO_TWIML_APP_SID (voice URL → /api/employee-portal/voice/twiml) to call from the laptop.',
      });
    }
    const identity = String(user.email || user.uid).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 60);
    return res.json({ ready: true, token: mintVoiceToken(identity), from: line.from, smsReady: line.smsReady });
  });

  app.post('/api/employee-portal/voice/twiml', (req, res) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    if (accountSid && req.body?.AccountSid && req.body.AccountSid !== accountSid) {
      return res.status(403).type('text/plain').send('Forbidden');
    }
    const to = normalizePhone(req.body?.To || req.query?.To || '');
    const from = process.env.TWILIO_FROM_NUMBER || '';
    if (!to || !from) {
      res.type('text/xml');
      return res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Missing call destination.</Say></Response>');
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${from}"><Number>${to}</Number></Dial></Response>`;
    res.type('text/xml').send(xml);
  });
}
