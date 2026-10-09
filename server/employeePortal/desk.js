import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getDefaultBusiness, DEFAULT_BUSINESSES } from '../leadAgent/businessDefaults.js';
import { defaultWorkspaceUid } from '../leadAgent/workspaceAccess.js';
import { normalizePhone, sendLeadSms } from '../leadAgent/smsProvider.js';
import { personalizeOutbound } from '../leadAgent/outboundMessage.js';
import { canSendOutbound } from '../leadAgent/automation.js';
import { incrementDailySms } from '../leadAgent/inboundHandler.js';
import { leadAgentVoiceWebhookPath } from '../leadAgent/inboundVoice.js';
import { resolveMacroreiGrokVoicePhone } from '../macroreiVoiceInstructions.js';

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
    textCount: data.textCount == null ? null : Number(data.textCount),
    lastTextBody: data.lastTextBody ? String(data.lastTextBody) : '',
    lastContactAt: stamp(data.lastContactAt),
    lastCallDisposition: data.lastCallDisposition ? String(data.lastCallDisposition) : '',
    lastCallNotes: data.lastCallNotes ? String(data.lastCallNotes).slice(0, 200) : '',
    needsHuman: Boolean(data.needsHuman),
    grokVoiceInterest: Boolean(data.grokVoiceInterest),
    lastEmployeeEmail: data.lastEmployeeEmail ? String(data.lastEmployeeEmail) : '',
  };
}

function isOpenLeadRow(lead) {
  return !lead.optedOut && (lead.status === 'new' || lead.status === 'callback');
}

function computeDeskAnalytics(leads) {
  const byStatus = {};
  for (const l of leads) {
    const s = l.status || 'new';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  const open = leads.filter(isOpenLeadRow);
  const texted = leads.filter((l) => (l.textCount || 0) > 0 || l.status === 'texted');
  return {
    total: leads.length,
    open: open.length,
    optedOut: leads.filter((l) => l.optedOut).length,
    texted: texted.length,
    notTexted: leads.length - texted.length,
    needsHuman: leads.filter((l) => l.needsHuman).length,
    replied: leads.filter((l) => l.status === 'replied').length,
    callbacks: leads.filter((l) => l.status === 'callback').length,
    byStatus,
  };
}

function buildTuningSnapshot(business) {
  return {
    agentEnabled: business.agentEnabled !== false,
    automationEnabled: business.automationEnabled !== false,
    smsProvider: business.smsProvider || 'phone',
    dailySmsLimit: Number(business.dailySmsLimit || 40),
    dailySmsSuggested: Number(business.dailySmsSuggested || 25),
    sendWindowStart: Number(business.sendWindowStart ?? 9),
    sendWindowEnd: Number(business.sendWindowEnd ?? 18),
    sendTimezone: business.sendTimezone || 'America/Los_Angeles',
    minDelayMinutes: Number(business.minDelayMinutes ?? 6),
    maxDelayMinutes: Number(business.maxDelayMinutes ?? 15),
    escalationKeywords: Array.isArray(business.escalationKeywords) ? business.escalationKeywords : [],
    escalationMessage: String(business.escalationMessage || '').slice(0, 280),
    outboundTemplate: String(business.outboundTemplate || business.greeting || '').slice(0, 320),
  };
}

function buildInfraSnapshot(businessId, line) {
  const uid = defaultWorkspaceUid();
  const grok = businessId === 'macrorei' ? resolveMacroreiGrokVoicePhone() : null;
  return {
    twilioSmsReady: line.smsReady,
    twilioVoiceReady: line.voiceReady,
    twilioFrom: line.from || '',
    grokVoiceLine: grok,
    returnCallWebhookPath: leadAgentVoiceWebhookPath(businessId, uid),
    smsWebhookPath: `/api/lead-agent/twilio/inbound?businessId=${encodeURIComponent(businessId)}&uid=${encodeURIComponent(uid)}`,
    employeeVoiceTwimlPath: '/api/employee-portal/voice/twiml',
    workspaceUid: uid,
  };
}

function stamp(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

async function listLeads(db, businessId) {
  const snap = await leadsRef(db, businessId).limit(800).get();
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

async function recordOutbound(db, user, businessId, lead, body, result) {
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
    {
      status: 'texted',
      textCount: FieldValue.increment(1),
      lastTextBody: String(body || '').slice(0, 180),
      lastContactAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  if (result.sent) await incrementDailySms(db, defaultWorkspaceUid(), businessId);
}

function assertSmsReady(business) {
  const line = voiceConfig();
  if (!line.smsReady && business.smsProvider !== 'twilio') {
    const err = new Error(
      'Laptop texting needs the company Twilio number (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).',
    );
    err.status = 503;
    throw err;
  }
}

export function registerEmployeeDeskRoutes(app, db, requireEmployee) {
  app.get('/api/employee-portal/desk', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.query.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const business = await loadBusiness(db, businessId);
    const leads = await listLeads(db, businessId);
    const open = leads.filter(isOpenLeadRow);
    const profileSnap = await db.collection(PROFILE_COL).doc(user.uid).get();
    const quota = canSendOutbound(business);
    const line = voiceConfig();
    const analytics = computeDeskAnalytics(leads);
    const recentActivity = [...leads]
      .filter((l) => l.lastContactAt)
      .sort((a, b) => String(b.lastContactAt).localeCompare(String(a.lastContactAt)))
      .slice(0, 20)
      .map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        status: l.status,
        lastContactAt: l.lastContactAt,
        lastCallDisposition: l.lastCallDisposition,
        textCount: l.textCount,
      }));
    return res.json({
      syncedAt: new Date().toISOString(),
      business: {
        id: business.id,
        name: business.name,
        tagline: business.tagline,
        phoneDisplay: business.phoneDisplay || '',
        greeting: business.greeting || '',
        website: business.website || '',
        brandColor: business.brandColor || '',
      },
      businesses: DEFAULT_BUSINESSES.map((b) => ({ id: b.id, name: b.name })),
      leads: leads.slice(0, 500),
      analytics,
      tuning: buildTuningSnapshot(business),
      infrastructure: buildInfraSnapshot(businessId, line),
      recentActivity,
      queue: {
        total: leads.length,
        remaining: open.length,
        position: open.length ? 1 : 0,
        current: nextOpenLead(leads),
        openPreview: open.slice(0, 80).map((l) => ({
          id: l.id,
          name: l.name,
          phone: l.phone,
          propertyAddress: l.propertyAddress,
          status: l.status,
          textCount: l.textCount,
        })),
      },
      quota: {
        ok: quota.ok !== false,
        reason: quota.reason || null,
        sent: Number(quota.sent || 0),
        limit: Number(quota.limit || business.dailySmsLimit || 40),
        suggested: Number(business.dailySmsSuggested || 25),
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
    try {
      assertSmsReady(business);
    } catch (e) {
      return res.status(e.status || 503).json({ error: e.message });
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
    await recordOutbound(db, user, businessId, lead, body, result);
    const today = await bumpDay(db, user.uid, { texts: 1, lastLeadId: lead.id, lastDisposition: 'texted' });
    return res.json({ done: false, lead, body, result, today });
  });

  app.post('/api/employee-portal/desk/import', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const incoming = Array.isArray(req.body?.leads) ? req.body.leads.slice(0, 2000) : [];
    const existing = await listLeads(db, businessId);
    const seen = new Set(existing.map((l) => String(l.phone || '')));
    let imported = 0;
    let duplicates = 0;
    let skipped = 0;
    let batch = db.batch();
    let pending = 0;
    const flush = async () => {
      if (!pending) return;
      await batch.commit();
      batch = db.batch();
      pending = 0;
    };
    for (const item of incoming) {
      const phone = normalizePhone(item?.phone);
      const propertyAddress = String(item?.propertyAddress || '').trim().slice(0, 500);
      if (phone.replace(/\D/g, '').length < 10 || !propertyAddress) {
        skipped += 1;
        continue;
      }
      if (seen.has(phone)) {
        duplicates += 1;
        continue;
      }
      seen.add(phone);
      const id = randomUUID();
      batch.set(leadsRef(db, businessId).doc(id), {
        name: String(item?.name || '').slice(0, 200),
        phone,
        propertyAddress,
        notes: propertyAddress,
        status: 'new',
        textCount: 0,
        talkedTo: false,
        agentPaused: false,
        optedOut: false,
        importedBy: user.email || '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      imported += 1;
      pending += 1;
      if (pending >= 400) await flush();
    }
    await flush();
    return res.json({ imported, duplicates, skipped, total: incoming.length });
  });

  app.get('/api/employee-portal/desk/leads/:leadId', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.query.businessId || 'macrorei');
    const ref = leadsRef(db, businessId).doc(req.params.leadId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Lead not found' });
    let messagesSnap;
    try {
      messagesSnap = await ref.collection('messages').orderBy('at', 'asc').limit(200).get();
    } catch {
      messagesSnap = await ref.collection('messages').limit(200).get();
    }
    const messages = messagesSnap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        direction: data.direction || 'outbound',
        body: String(data.body || ''),
        at: stamp(data.at),
        employeeEmail: data.employeeEmail || '',
        provider: data.provider || '',
      };
    });
    const textCount = messages.filter((m) => m.direction === 'outbound').length;
    if (Number(snap.data()?.textCount || 0) !== textCount) {
      await ref.set({ textCount, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    return res.json({
      lead: serializeLead(snap.id, { ...snap.data(), textCount }),
      messages,
      textCount,
      inboundCount: messages.filter((m) => m.direction === 'inbound').length,
    });
  });

  app.post('/api/employee-portal/desk/text-selected', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const ids = Array.isArray(req.body?.leadIds) ? req.body.leadIds.map(String).slice(0, 25) : [];
    if (!ids.length) return res.status(400).json({ error: 'Select at least one lead' });
    const business = await loadBusiness(db, businessId);
    const quota = canSendOutbound(business);
    if (!quota.ok) return res.status(429).json({ error: quota.reason || 'Cannot text right now', quota });
    try {
      assertSmsReady(business);
    } catch (e) {
      return res.status(e.status || 503).json({ error: e.message });
    }
    const sent = [];
    const failed = [];
    for (const leadId of ids) {
      const snap = await leadsRef(db, businessId).doc(leadId).get();
      if (!snap.exists) {
        failed.push({ leadId, error: 'missing' });
        continue;
      }
      const lead = serializeLead(snap.id, snap.data() || {});
      if (lead.optedOut) {
        failed.push({ leadId, error: 'opted out' });
        continue;
      }
      const fresh = await loadBusiness(db, businessId);
      const nextQuota = canSendOutbound(fresh);
      if (!nextQuota.ok) {
        failed.push({ leadId, error: nextQuota.reason || 'daily cap' });
        break;
      }
      const body = personalizeOutbound(fresh, lead).slice(0, 480);
      try {
        const result = await sendLeadSms({ business: fresh, to: lead.phone, body, preferServerTwilio: true });
        if (!result.sent && result.pendingDeviceSend) {
          failed.push({ leadId, error: 'twilio not configured' });
          break;
        }
        await recordOutbound(db, user, businessId, lead, body, result);
        sent.push({ leadId, name: lead.name, phone: lead.phone });
      } catch (e) {
        failed.push({ leadId, error: e.message || 'send failed' });
      }
    }
    const today = await bumpDay(db, user.uid, {
      texts: sent.length,
      lastLeadId: sent.at(-1)?.leadId || null,
      lastDisposition: 'texted',
    });
    return res.json({ sent, failed, today });
  });

  app.post('/api/employee-portal/desk/call-log', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    const leadId = String(req.body?.leadId || '');
    const disposition = String(req.body?.disposition || 'talked').slice(0, 40);
    const notes = String(req.body?.notes || '').trim().slice(0, 500);
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    const allowed = new Set(['talked', 'voicemail', 'no_answer', 'callback', 'skipped']);
    if (!allowed.has(disposition)) return res.status(400).json({ error: 'Unknown disposition' });
    const ref = leadsRef(db, businessId).doc(leadId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Lead not found' });
    const status = disposition === 'callback' ? 'callback' : disposition;
    const leadPatch = {
      status,
      lastCallDisposition: disposition,
      lastContactAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastEmployeeEmail: user.email || '',
    };
    if (notes) leadPatch.lastCallNotes = notes;
    await ref.set(leadPatch, { merge: true });
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
