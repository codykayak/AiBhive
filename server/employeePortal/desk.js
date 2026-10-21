import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getDefaultBusiness, DEFAULT_BUSINESSES } from '../leadAgent/businessDefaults.js';
import { defaultWorkspaceUid } from '../leadAgent/workspaceAccess.js';
import { normalizePhone, sendLeadSms } from '../leadAgent/smsProvider.js';
import { personalizeOutbound } from '../leadAgent/outboundMessage.js';
import { canSendOutbound } from '../leadAgent/automation.js';
import { incrementDailySms } from '../leadAgent/inboundHandler.js';
import { registerOwnerOutboundTouch } from '../leadAgent/outreachSequence.js';
import {
  DEFAULT_ESCALATION_OPS,
  buildImFreeNowOverride,
  mergeEscalationOps,
  resolveCallbackOffer,
} from '../leadAgent/escalationOps.js';
import { calendarPublicStatus } from './googleCalendar.js';
import { outlookPublicStatus, sendOutlookMail } from './outlookMail.js';
import { clearRagCache } from '../leadAgent/ragKnowledge.js';
import { leadAgentVoiceWebhookPath } from '../leadAgent/inboundVoice.js';
import { resolveMacroreiGrokVoicePhone } from '../macroreiVoiceInstructions.js';
import { twilioApiKeySid, twilioApiSecret } from '../twilioEnv.js';

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

function normalizePropertyAddressKey(address) {
  return String(address || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .slice(0, 160);
}

function queuePriority(lead) {
  const status = lead.status || 'new';
  if (status === 'callback' && lead.callbackAt) {
    const t = new Date(lead.callbackAt).getTime();
    if (!Number.isNaN(t) && t <= Date.now()) return 0;
    if (!Number.isNaN(t) && t > Date.now()) return 300;
    return 100;
  }
  if (status === 'callback') return 50;
  if (status === 'new') return 200;
  return 500;
}

function compareQueueLeads(a, b) {
  const pa = queuePriority(a);
  const pb = queuePriority(b);
  if (pa !== pb) return pa - pb;
  if (a.status === 'callback' && b.status === 'callback' && a.callbackAt && b.callbackAt) {
    const ta = new Date(a.callbackAt).getTime();
    const tb = new Date(b.callbackAt).getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
  }
  return (a.name || '').localeCompare(b.name || '');
}

function serializeLead(id, data) {
  const phones = Array.isArray(data.phones)
    ? data.phones.map((p) => normalizePhone(p)).filter((p) => p.replace(/\D/g, '').length >= 10)
    : [];
  const primary = String(data.phone || phones[0] || '');
  const mergedPhones = phones.length ? phones : primary ? [normalizePhone(primary)] : [];
  const dialPhoneIndex = Math.min(
    Math.max(0, Number(data.dialPhoneIndex || 0)),
    Math.max(0, mergedPhones.length - 1),
  );
  return {
    id,
    name: String(data.name || ''),
    phone: mergedPhones[dialPhoneIndex] || primary,
    phones: mergedPhones,
    dialPhoneIndex,
    propertyAddress: String(data.propertyAddress || data.notes || ''),
    email: String(data.email || data.ownerEmail || '').trim().toLowerCase(),
    status: data.status || 'new',
    optedOut: Boolean(data.optedOut),
    textCount: data.textCount == null ? null : Number(data.textCount),
    lastTextBody: data.lastTextBody ? String(data.lastTextBody) : '',
    emailCount: data.emailCount == null ? null : Number(data.emailCount),
    lastEmailBody: data.lastEmailBody ? String(data.lastEmailBody).slice(0, 200) : '',
    lastContactAt: stamp(data.lastContactAt),
    lastCallDisposition: data.lastCallDisposition ? String(data.lastCallDisposition) : '',
    lastCallNotes: data.lastCallNotes ? String(data.lastCallNotes).slice(0, 200) : '',
    needsHuman: Boolean(data.needsHuman),
    grokVoiceInterest: Boolean(data.grokVoiceInterest),
    lastEmployeeEmail: data.lastEmployeeEmail ? String(data.lastEmployeeEmail) : '',
    callCount: data.callCount == null ? null : Number(data.callCount),
    callbackAt: stamp(data.callbackAt),
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
    outreachMaxOwnerTouches: Number(business.outreachMaxOwnerTouches ?? 2),
    outreachMinHoursBetweenTouches: Number(business.outreachMinHoursBetweenTouches ?? 48),
    outreachRelativeCooldownHours: Number(business.outreachRelativeCooldownHours ?? 72),
    outreachRelativeSearchEnabled: business.outreachRelativeSearchEnabled !== false,
    followUpOutboundTemplate: String(business.followUpOutboundTemplate || '').slice(0, 320),
    relativeOutboundTemplate: String(business.relativeOutboundTemplate || '').slice(0, 320),
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

function deskCallLogsRef(db, businessId) {
  return businessRef(db, businessId).collection('desk_call_logs');
}

function serializeCallLog(id, data) {
  return {
    id,
    leadId: String(data.leadId || ''),
    leadName: String(data.leadName || ''),
    leadPhone: String(data.leadPhone || ''),
    propertyAddress: String(data.propertyAddress || '').slice(0, 280),
    disposition: String(data.disposition || ''),
    notes: data.notes ? String(data.notes).slice(0, 500) : '',
    channel: String(data.channel || 'manual'),
    durationSec: data.durationSec == null ? null : Number(data.durationSec),
    employeeEmail: String(data.employeeEmail || ''),
    employeeUid: String(data.employeeUid || ''),
    at: stamp(data.at),
  };
}

async function listDeskCallLogs(db, businessId, limit = 120) {
  const ref = deskCallLogsRef(db, businessId);
  try {
    const snap = await ref.orderBy('at', 'desc').limit(limit).get();
    return snap.docs.map((d) => serializeCallLog(d.id, d.data() || {}));
  } catch {
    const snap = await ref.limit(Math.min(limit, 300)).get();
    return snap.docs
      .map((d) => serializeCallLog(d.id, d.data() || {}))
      .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
      .slice(0, limit);
  }
}

function hourInTimezone(iso, timeZone) {
  if (!iso) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date(iso));
    const h = parts.find((p) => p.type === 'hour');
    return h ? Number(h.value) : null;
  } catch {
    return new Date(iso).getHours();
  }
}

function dayInTimezone(iso, timeZone) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

function computeCallTracking(logs, timeZone) {
  const tz = timeZone || 'America/Los_Angeles';
  const today = dayInTimezone(new Date().toISOString(), tz);
  const byDisposition = {};
  const byAgent = {};
  const hourlyToday = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  let durationTotal = 0;
  let durationCount = 0;
  let todayCalls = 0;
  let todayTalked = 0;

  for (const log of logs) {
    const disp = log.disposition || 'unknown';
    byDisposition[disp] = (byDisposition[disp] || 0) + 1;

    const logDay = dayInTimezone(log.at, tz);
    if (logDay === today) {
      todayCalls += 1;
      if (disp === 'talked') todayTalked += 1;
      const h = hourInTimezone(log.at, tz);
      if (h != null && h >= 0 && h < 24) hourlyToday[h].count += 1;
    }

    const email = log.employeeEmail || 'floor';
    if (!byAgent[email]) byAgent[email] = { calls: 0, talked: 0, callbacks: 0 };
    byAgent[email].calls += 1;
    if (disp === 'talked') byAgent[email].talked += 1;
    if (disp === 'callback') byAgent[email].callbacks += 1;

    if (log.durationSec != null && log.durationSec > 0) {
      durationTotal += log.durationSec;
      durationCount += 1;
    }
  }

  const attempts = Object.entries(byDisposition).reduce(
    (sum, [k, v]) => sum + (k === 'skipped' ? 0 : Number(v)),
    0,
  );
  const connected = (byDisposition.talked || 0) + (byDisposition.callback || 0);

  return {
    timezone: tz,
    today,
    todayCalls,
    todayTalked,
    totalLogged: logs.length,
    byDisposition,
    byAgent: Object.entries(byAgent)
      .map(([email, stats]) => ({ email, ...stats }))
      .sort((a, b) => b.calls - a.calls),
    hourlyToday,
    avgDurationSec: durationCount ? Math.round(durationTotal / durationCount) : null,
    connectRatePct: attempts ? Math.round((connected / attempts) * 100) : null,
  };
}

async function appendDeskCallLog(db, user, businessId, lead, payload) {
  const doc = {
    leadId: lead.id,
    leadName: lead.name || '',
    leadPhone: lead.phone || '',
    propertyAddress: lead.propertyAddress || '',
    disposition: payload.disposition,
    notes: payload.notes || '',
    channel: payload.channel || 'manual',
    durationSec: payload.durationSec == null ? null : Number(payload.durationSec),
    employeeEmail: user.email || '',
    employeeUid: user.uid || '',
    at: FieldValue.serverTimestamp(),
  };
  const ref = await deskCallLogsRef(db, businessId).add(doc);
  return { id: ref.id, ...serializeCallLog(ref.id, { ...doc, at: new Date() }) };
}

async function listLeads(db, businessId) {
  const snap = await leadsRef(db, businessId).limit(800).get();
  return snap.docs
    .map((d) => serializeLead(d.id, d.data() || {}))
    .sort(compareQueueLeads);
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
  const apiKey = twilioApiKeySid();
  const apiSecret = twilioApiSecret();
  const appSid = process.env.TWILIO_TWIML_APP_SID || '';
  const from = process.env.TWILIO_FROM_NUMBER || '';
  const smsReady = Boolean(accountSid && process.env.TWILIO_AUTH_TOKEN && from);
  const voiceReady = Boolean(accountSid && apiKey && apiSecret && appSid && from);
  return { smsReady, voiceReady, from };
}

function mintVoiceToken(identity) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = twilioApiKeySid();
  const apiSecret = twilioApiSecret();
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
  if (result.sent && (lead.leadRole || 'owner') === 'owner') {
    const biz = await loadBusiness(db, businessId);
    await registerOwnerOutboundTouch(db, defaultWorkspaceUid(), businessId, lead.id, { via: 'employee-desk' }, biz);
  }
}

function buildOwnerEmailBody(business, lead) {
  const address = String(lead.propertyAddress || 'your property').trim();
  const name = String(lead.name || '').trim();
  const hi = name ? `Hi ${name.split(/\s+/)[0]},` : 'Hi,';
  const tpl =
    business?.greeting ||
    "I'm Cody, a real estate investor in Eugene. I'm reaching out about the property at {address} — would you consider selling, or is there a best time to talk?";
  const body = `${hi}\n\n${tpl.replace(/\{address\}/gi, address)}\n\nThank you,\nCody`;
  return body.slice(0, 8000);
}

function smsDeepLink(to, body) {
  const phone = normalizePhone(to);
  const q = encodeURIComponent(String(body || '').slice(0, 480));
  return `sms:${phone}?body=${q}`;
}

/** @returns {'twilio'|'phone'} */
function resolveOutboundSmsChannel(business, requested) {
  const line = voiceConfig();
  const provider = business?.smsProvider || 'phone';
  if (requested === 'phone') return 'phone';
  if (requested === 'twilio') return 'twilio';
  if (provider === 'twilio' && line.smsReady) return 'twilio';
  return 'phone';
}

function assertTwilioSmsReady(business, requestedChannel) {
  const channel = resolveOutboundSmsChannel(business, requestedChannel === 'twilio' ? 'twilio' : 'auto');
  if (channel !== 'twilio') return;
  const line = voiceConfig();
  if (!line.smsReady) {
    const err = new Error(
      'Twilio SMS is not available on the server (A2P denied or env missing). Use “Text from phone” or set smsProvider to phone in the Lead Agent app.',
    );
    err.status = 503;
    throw err;
  }
}

async function sendDeskOutboundSms({ business, lead, body, channel }) {
  const mode = resolveOutboundSmsChannel(business, channel);
  if (mode === 'twilio') {
    assertTwilioSmsReady(business, 'twilio');
    const result = await sendLeadSms({ business, to: lead.phone, body, preferServerTwilio: true });
    if (!result.sent) {
      throw new Error('Twilio could not send this message.');
    }
    return { mode: 'twilio', result };
  }
  return {
    mode: 'phone',
    result: { sent: false, provider: 'phone', pendingDeviceSend: true },
    smsUrl: smsDeepLink(lead.phone, body),
    body,
    phone: lead.phone,
  };
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
    const callFeed = await listDeskCallLogs(db, businessId, 100);
    const callTracking = computeCallTracking(callFeed, business.sendTimezone || 'America/Los_Angeles');
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
      callFeed,
      callTracking,
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
      grokSmsAgent: Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
      outlook: outlookPublicStatus(profileSnap.exists ? profileSnap.data() : {}),
    });
  });

  app.get('/api/employee-portal/escalation-settings', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.query.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const business = await loadBusiness(db, businessId);
    const ops = mergeEscalationOps(business);
    const preview = resolveCallbackOffer(business);
    return res.json({
      businessId,
      escalationOps: ops,
      previewReply: preview.reply,
      previewMode: preview.mode,
      grokSmsAgent: Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
      savedBy: business.escalationOpsUpdatedBy || null,
      savedAt: stamp(business.escalationOpsUpdatedAt),
      googleCalendar: calendarPublicStatus(business),
    });
  });

  app.post('/api/employee-portal/escalation-settings/im-free-now', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const business = await loadBusiness(db, businessId);
    const ops = mergeEscalationOps(business);
    const tz = ops.schedulingTimezone || 'America/Los_Angeles';
    const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    const todayOverride = buildImFreeNowOverride(dateKey, ops);
    const nextOps = { ...ops, todayOverride, allowImmediateCallback: true };
    await businessRef(db, businessId).set(
      {
        escalationOps: nextOps,
        escalationOpsUpdatedBy: user.email || '',
        escalationOpsUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    const fresh = await loadBusiness(db, businessId);
    const preview = resolveCallbackOffer(fresh);
    return res.json({
      ok: true,
      escalationOps: mergeEscalationOps(fresh),
      previewReply: preview.reply,
      previewMode: preview.mode,
    });
  });

  app.put('/api/employee-portal/escalation-settings', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const incoming = req.body?.escalationOps;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ error: 'escalationOps object required' });
    }
    const patch = {
      escalationOps: {
        ...DEFAULT_ESCALATION_OPS,
        ...incoming,
        weeklyAvailability: {
          ...DEFAULT_ESCALATION_OPS.weeklyAvailability,
          ...(incoming.weeklyAvailability || {}),
        },
        schedulingPhrases: {
          ...DEFAULT_ESCALATION_OPS.schedulingPhrases,
          ...(incoming.schedulingPhrases || {}),
        },
        notifyPhones: Array.isArray(incoming.notifyPhones) ? incoming.notifyPhones.slice(0, 12) : [],
        activeNotifyPhoneId: String(incoming.activeNotifyPhoneId || ''),
      },
      escalationOpsUpdatedBy: user.email || '',
      escalationOpsUpdatedAt: FieldValue.serverTimestamp(),
    };
    await businessRef(db, businessId).set(patch, { merge: true });
    const business = await loadBusiness(db, businessId);
    return res.json({
      ok: true,
      escalationOps: mergeEscalationOps(business),
      previewReply: resolveCallbackOffer(business).reply,
    });
  });

  app.post('/api/employee-portal/rag-refresh', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    clearRagCache(businessId);
    return res.json({ ok: true, businessId, refreshedAt: new Date().toISOString() });
  });

  app.post('/api/employee-portal/desk/text-next', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const business = await loadBusiness(db, businessId);
    const quota = canSendOutbound(business);
    if (!quota.ok) return res.status(429).json({ error: quota.reason || 'Cannot text right now', quota });
    const channel = String(req.body?.channel || 'auto');
    const leads = await listLeads(db, businessId);
    const lead = nextOpenLead(leads);
    if (!lead) return res.json({ done: true, reason: 'no_leads' });
    const body = String(req.body?.body || personalizeOutbound(business, lead)).slice(0, 480);
    try {
      const dispatch = await sendDeskOutboundSms({ business, lead, body, channel });
      if (dispatch.mode === 'phone') {
        return res.json({
          done: false,
          lead,
          body,
          pendingDevice: true,
          smsUrl: dispatch.smsUrl,
          phone: dispatch.phone,
          mode: 'phone',
        });
      }
      await recordOutbound(db, user, businessId, lead, body, dispatch.result);
      const today = await bumpDay(db, user.uid, { texts: 1, lastLeadId: lead.id, lastDisposition: 'texted' });
      return res.json({ done: false, lead, body, result: dispatch.result, mode: 'twilio', today });
    } catch (e) {
      return res.status(e.status || 503).json({ error: e.message || 'Send failed' });
    }
  });

  app.post('/api/employee-portal/desk/import', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const incoming = Array.isArray(req.body?.leads) ? req.body.leads.slice(0, 2000) : [];
    const existing = await listLeads(db, businessId);
    const seen = new Set(existing.map((l) => String(l.phone || '')));
    const seenAddresses = new Set(existing.map((l) => normalizePropertyAddressKey(l.propertyAddress)));
    let imported = 0;
    let duplicates = 0;
    let duplicateAddresses = 0;
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
      const rawPhones = Array.isArray(item?.phones) ? item.phones : [item?.phone];
      const phones = rawPhones
        .map((p) => normalizePhone(p))
        .filter((p) => p.replace(/\D/g, '').length >= 10)
        .slice(0, 8);
      const phone = phones[0] || normalizePhone(item?.phone);
      const propertyAddress = String(item?.propertyAddress || '').trim().slice(0, 500);
      const email = String(item?.email || '').trim().toLowerCase().slice(0, 200);
      if (phone.replace(/\D/g, '').length < 10 || !propertyAddress) {
        skipped += 1;
        continue;
      }
      const addressKey = normalizePropertyAddressKey(propertyAddress);
      if (seen.has(phone)) {
        duplicates += 1;
        continue;
      }
      if (addressKey && seenAddresses.has(addressKey)) {
        duplicateAddresses += 1;
        continue;
      }
      seen.add(phone);
      if (addressKey) seenAddresses.add(addressKey);
      const id = randomUUID();
      batch.set(leadsRef(db, businessId).doc(id), {
        name: String(item?.name || '').slice(0, 200),
        phone,
        phones,
        dialPhoneIndex: 0,
        propertyAddress,
        email,
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
    return res.json({ imported, duplicates, duplicateAddresses, skipped, total: incoming.length });
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
    const callLogs = (await listDeskCallLogs(db, businessId, 80)).filter((c) => c.leadId === snap.id).slice(0, 30);
    return res.json({
      lead: serializeLead(snap.id, { ...snap.data(), textCount }),
      messages,
      textCount,
      inboundCount: messages.filter((m) => m.direction === 'inbound').length,
      callLogs,
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
    const channel = String(req.body?.channel || 'auto');
    const sent = [];
    const phoneDrafts = [];
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
        const dispatch = await sendDeskOutboundSms({ business: fresh, lead, body, channel });
        if (dispatch.mode === 'phone') {
          phoneDrafts.push({
            leadId,
            name: lead.name,
            phone: lead.phone,
            body,
            smsUrl: dispatch.smsUrl,
            pendingDevice: true,
          });
          continue;
        }
        await recordOutbound(db, user, businessId, lead, body, dispatch.result);
        sent.push({ leadId, name: lead.name, phone: lead.phone, mode: 'twilio' });
      } catch (e) {
        failed.push({ leadId, error: e.message || 'send failed' });
      }
    }
    const today = await bumpDay(db, user.uid, {
      texts: sent.length,
      lastLeadId: sent.at(-1)?.leadId || phoneDrafts.at(-1)?.leadId || null,
      lastDisposition: sent.length ? 'texted' : null,
    });
    return res.json({ sent, phoneDrafts, failed, today });
  });

  app.post('/api/employee-portal/desk/device-sent', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    const leadId = String(req.body?.leadId || '');
    const body = String(req.body?.body || '').slice(0, 480);
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    const snap = await leadsRef(db, businessId).doc(leadId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Lead not found' });
    const business = await loadBusiness(db, businessId);
    const quota = canSendOutbound(business);
    if (!quota.ok) return res.status(429).json({ error: quota.reason || 'Daily SMS cap', quota });
    const lead = serializeLead(snap.id, snap.data() || {});
    const msgBody = body || personalizeOutbound(business, lead).slice(0, 480);
    await recordOutbound(db, user, businessId, lead, msgBody, { sent: true, provider: 'phone' });
    const today = await bumpDay(db, user.uid, { texts: 1, lastLeadId: leadId, lastDisposition: 'texted' });
    return res.json({ ok: true, leadId, today, provider: 'phone' });
  });

  app.put('/api/employee-portal/desk/sms-provider', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    const smsProvider = String(req.body?.smsProvider || 'phone');
    if (!['phone', 'twilio'].includes(smsProvider)) {
      return res.status(400).json({ error: 'smsProvider must be phone or twilio' });
    }
    await businessRef(db, businessId).set(
      { smsProvider, smsProviderUpdatedBy: user.email || '', smsProviderUpdatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    const business = await loadBusiness(db, businessId);
    const line = voiceConfig();
    return res.json({
      ok: true,
      smsProvider: business.smsProvider || smsProvider,
      twilioSmsReady: line.smsReady,
    });
  });

  app.post('/api/employee-portal/desk/send-email', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    const leadId = String(req.body?.leadId || '');
    const subject = String(req.body?.subject || '').trim().slice(0, 200);
    const body = String(req.body?.body || '').trim().slice(0, 8000);
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    if (!body) return res.status(400).json({ error: 'Email body required' });
    const ref = leadsRef(db, businessId).doc(leadId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Lead not found' });
    const lead = serializeLead(snap.id, snap.data() || {});
    const to = String(req.body?.to || lead.email || '').trim().toLowerCase();
    if (!to) {
      return res.status(400).json({
        error: 'This lead has no email on file. Add an email column to your import or enter an address on the dialer.',
      });
    }
    const subj =
      subject ||
      `Regarding ${lead.propertyAddress || 'your property'}`.slice(0, 200);
    try {
      await sendOutlookMail(db, user.uid, { to, subject: subj, body });
    } catch (e) {
      return res.status(e.status || 502).json({ error: e.message || 'Could not send email' });
    }
    await ref.collection('messages').add({
      direction: 'outbound',
      body,
      channel: 'email',
      subject: subj,
      provider: 'outlook',
      at: FieldValue.serverTimestamp(),
      via: 'employee-desk',
      employeeEmail: user.email || '',
    });
    await ref.set(
      {
        emailCount: FieldValue.increment(1),
        lastEmailBody: body.slice(0, 200),
        lastContactAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastEmployeeEmail: user.email || '',
      },
      { merge: true },
    );
    const today = await bumpDay(db, user.uid, { lastLeadId: leadId });
    if (to !== lead.email) {
      await ref.set({ email: to, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    return res.json({ ok: true, to, subject: subj, today });
  });

  app.post('/api/employee-portal/desk/call-log', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    const leadId = String(req.body?.leadId || '');
    const disposition = String(req.body?.disposition || 'talked').slice(0, 40);
    const notes = String(req.body?.notes || '').trim().slice(0, 500);
    const channel = String(req.body?.channel || 'manual').slice(0, 32);
    const durationRaw = req.body?.durationSec;
    const durationSec =
      durationRaw == null || durationRaw === '' ? null : Math.min(7200, Math.max(0, Number(durationRaw)));
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    const allowed = new Set(['talked', 'voicemail', 'no_answer', 'callback', 'skipped']);
    if (!allowed.has(disposition)) return res.status(400).json({ error: 'Unknown disposition' });
    const ref = leadsRef(db, businessId).doc(leadId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Lead not found' });
    const data = snap.data() || {};
    const lead = serializeLead(snap.id, data);
    const phoneList = lead.phones?.length ? lead.phones : lead.phone ? [lead.phone] : [];
    const phoneUsedIndex = Math.min(
      Math.max(0, Number(data.dialPhoneIndex || 0)),
      Math.max(0, phoneList.length - 1),
    );
    const phoneUsed = phoneList[phoneUsedIndex] || lead.phone;
    let dialPhoneIndex = phoneUsedIndex;
    let tryAlternatePhone = false;
    const cycleDispositions = new Set(['no_answer', 'voicemail']);
    if (cycleDispositions.has(disposition) && dialPhoneIndex + 1 < phoneList.length) {
      dialPhoneIndex += 1;
      tryAlternatePhone = true;
    }
    const prevStatus = data.status || 'new';
    let status = disposition === 'callback' ? 'callback' : disposition;
    if (tryAlternatePhone) {
      status = prevStatus === 'callback' ? 'callback' : 'new';
    }
    const leadPatch = {
      status,
      lastCallDisposition: disposition,
      lastContactAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastEmployeeEmail: user.email || '',
      dialPhoneIndex,
      phone: phoneList[dialPhoneIndex] || lead.phone,
    };
    if (notes) leadPatch.lastCallNotes = notes;
    const callbackAtRaw = req.body?.callbackAt;
    if (disposition === 'callback' && callbackAtRaw) {
      const cb = new Date(callbackAtRaw);
      if (!Number.isNaN(cb.getTime())) leadPatch.callbackAt = cb.toISOString();
    } else if (disposition === 'callback' && !data.callbackAt) {
      const defaultCb = new Date(Date.now() + 60 * 60_000);
      leadPatch.callbackAt = defaultCb.toISOString();
    }
    if (disposition === 'talked') leadPatch.callbackAt = FieldValue.delete();
    if (disposition !== 'skipped') leadPatch.callCount = FieldValue.increment(1);
    await ref.set(leadPatch, { merge: true });
    const callLog =
      disposition === 'skipped'
        ? null
        : await appendDeskCallLog(db, user, businessId, { ...lead, phone: phoneUsed }, {
            disposition,
            notes,
            channel,
            durationSec,
          });
    const today = await bumpDay(db, user.uid, {
      calls: disposition === 'skipped' ? 0 : 1,
      lastLeadId: leadId,
      lastDisposition: disposition,
    });
    let autoEmailSent = false;
    if (req.body?.autoEmailOnVoicemail && disposition === 'voicemail' && data.email) {
      const business = await loadBusiness(db, businessId);
      const emailBody = buildOwnerEmailBody(business, lead);
      const subj = `Regarding ${lead.propertyAddress || 'your property'}`.slice(0, 200);
      try {
        await sendOutlookMail(db, user.uid, { to: data.email, subject: subj, body: emailBody });
        await ref.collection('messages').add({
          direction: 'outbound',
          body: emailBody,
          channel: 'email',
          subject: subj,
          provider: 'outlook',
          automated: true,
          at: FieldValue.serverTimestamp(),
          via: 'employee-desk-voicemail',
          employeeEmail: user.email || '',
        });
        await ref.set(
          {
            emailCount: FieldValue.increment(1),
            lastEmailBody: emailBody.slice(0, 200),
          },
          { merge: true },
        );
        autoEmailSent = true;
      } catch (e) {
        console.warn('[desk] auto email on voicemail', e.message);
      }
    }
    const updatedLead = serializeLead(snap.id, {
      ...data,
      ...leadPatch,
      phones: phoneList.length ? phoneList : data.phones,
    });
    return res.json({
      ok: true,
      today,
      status,
      callLog,
      tryAlternatePhone,
      dialPhoneIndex,
      lead: updatedLead,
      autoEmailSent,
    });
  });

  app.get('/api/employee-portal/desk/calls', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.query.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const business = await loadBusiness(db, businessId);
    const limit = Math.min(200, Math.max(20, Number(req.query.limit) || 100));
    const callFeed = await listDeskCallLogs(db, businessId, limit);
    const callTracking = computeCallTracking(callFeed, business.sendTimezone || 'America/Los_Angeles');
    return res.json({ callFeed, callTracking, syncedAt: new Date().toISOString() });
  });

  app.post('/api/employee-portal/desk/link-twilio', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const businessId = String(req.body?.businessId || 'macrorei');
    if (!getDefaultBusiness(businessId)) return res.status(404).json({ error: 'Unknown list' });
    const line = voiceConfig();
    if (!line.smsReady) {
      return res.status(503).json({
        error:
          'Server Twilio is not configured yet. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to .env.local (local) or Cloud Run (production), then restart.',
        line,
      });
    }
    await businessRef(db, businessId).set(
      {
        smsProvider: 'twilio',
        twilioFrom: line.from,
        updatedAt: FieldValue.serverTimestamp(),
        linkedBy: user.email || '',
      },
      { merge: true },
    );
    return res.json({
      ok: true,
      businessId,
      smsProvider: 'twilio',
      from: line.from,
      linkedAt: new Date().toISOString(),
    });
  });

  app.get('/api/employee-portal/desk/voice-token', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const line = voiceConfig();
    if (!line.voiceReady) {
      return res.json({
        ready: false,
        smsReady: line.smsReady,
        hint: 'Set TWILIO_sk_key, TWILIO_API_SECRET, and TWILIO_TWIML_APP_SID (voice URL → /api/employee-portal/voice/twiml) to call from the laptop.',
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

export { listDeskCallLogs, loadBusiness, leadsRef };
