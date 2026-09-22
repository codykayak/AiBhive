import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyHiveAuth } from '../hiveAuth.js';
import { DEFAULT_BUSINESSES, getDefaultBusiness } from './businessDefaults.js';
import { generateFirstOutbound, generateSmsReply } from './grokAgent.js';
import { isOptOutMessage, normalizePhone, sendLeadSms } from './smsProvider.js';
import { buildWorkModeGuide } from '../macroreiVoiceInstructions.js';
import { resolveLeadAgentUser } from './deviceAuth.js';
import { renderLeadAgentMobileAuthPage } from './mobileAuthHtml.js';
import { clearRagCache, getWebsiteRagContext } from './ragKnowledge.js';
import {
  defaultWorkspaceUid,
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  resolveWorkspaceContext,
  roleMeets,
} from './workspaceAccess.js';
import {
  canSendOutbound,
  pickNextLead,
  personalizeOutbound,
  randomDelayMs,
} from './automation.js';
import { processInboundSms, incrementDailySms as incrementDailySmsShared } from './inboundHandler.js';

const COL = 'lead_agent_workspaces';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function businessRef(db, uid, businessId) {
  return db.collection(COL).doc(uid).collection('businesses').doc(businessId);
}

function leadsRef(db, uid, businessId) {
  return businessRef(db, uid, businessId).collection('leads');
}

function messagesRef(db, uid, businessId, leadId) {
  return leadsRef(db, uid, businessId).doc(leadId).collection('messages');
}

function wsUid(user) {
  return user.workspaceUid || user.uid;
}

async function requireAuth(req, res, db, { minRole = 'viewer' } = {}) {
  const raw = await resolveLeadAgentUser(req, verifyHiveAuth);
  if (!raw) {
    res.status(401).json({ error: 'Sign in required or set X-Lead-Agent-Secret on the phone app' });
    return null;
  }
  const ctx = await resolveWorkspaceContext(db, raw);
  if (!ctx?.workspaceUid) {
    res.status(403).json({ error: 'No workspace access' });
    return null;
  }
  if (!roleMeets(ctx.role, minRole)) {
    res.status(403).json({ error: 'Insufficient permissions for this action', role: ctx.role, need: minRole });
    return null;
  }
  return { ...raw, workspaceUid: ctx.workspaceUid, role: ctx.role, isOwner: ctx.isOwner };
}

function mergeBusiness(defaults, stored) {
  return { ...defaults, ...stored, id: stored?.id || defaults?.id };
}

async function getBusinessDoc(db, uid, businessId) {
  const snap = await businessRef(db, uid, businessId).get();
  const defaults = getDefaultBusiness(businessId) || {};
  if (!snap.exists) return mergeBusiness(defaults, { id: businessId, ...defaults });
  return mergeBusiness(defaults, { id: businessId, ...snap.data() });
}

async function incrementDailySms(db, uid, businessId) {
  return incrementDailySmsShared(db, uid, businessId);
}

async function canSendSms(business) {
  const limit = Number(business.dailySmsLimit || 50);
  const sentToday = Number(business?.smsSentByDay?.[todayKey()] || 0);
  return { allowed: sentToday < limit, sentToday, limit, suggested: business.dailySmsSuggested || Math.min(25, limit) };
}

export function registerLeadAgentRoutes(app, db) {
  const auth = (req, res, opts) => requireAuth(req, res, db, opts);

  /** Google sign-in for mobile app (redirects back with ?idToken=) */
  app.get('/api/lead-agent/auth/mobile', (req, res) => {
    const redirect = String(req.query.redirect || 'leadagent://auth').slice(0, 500);
    res.type('html').send(renderLeadAgentMobileAuthPage(redirect));
  });

  app.get('/api/lead-agent/workspace/me', async (req, res) => {
    const user = await auth(req, res);
    if (!user) return;
    const members = await listTeamMembers(db, wsUid(user));
    const joinUrl = `${req.protocol}://${req.get('host')}/api/lead-agent/auth/mobile`;
    return res.json({
      workspaceUid: wsUid(user),
      role: user.role,
      email: user.email,
      device: Boolean(user.device),
      defaultWorkspaceUid: defaultWorkspaceUid(),
      joinUrl,
      inviteMessage: `Join our MacroREI marketing list on Lead Agent — sign in with Google: ${joinUrl}`,
      ...members,
    });
  });

  app.post('/api/lead-agent/workspace/invite', async (req, res) => {
    const user = await auth(req, res, { minRole: 'owner' });
    if (!user) return;
    try {
      const invited = await inviteTeamMember(
        db,
        wsUid(user),
        user.role,
        req.body?.email,
        req.body?.role || 'viewer',
      );
      const joinUrl = `${req.protocol}://${req.get('host')}/api/lead-agent/auth/mobile`;
      return res.json({
        ok: true,
        ...invited,
        joinUrl,
        message: `Ask them to install Lead Agent, sign in with Google (${invited.email}), then open MacroREI leads.`,
      });
    } catch (e) {
      return res.status(400).json({ error: e.message || 'invite failed' });
    }
  });

  app.delete('/api/lead-agent/workspace/members/:email', async (req, res) => {
    const user = await auth(req, res, { minRole: 'owner' });
    if (!user) return;
    try {
      const result = await removeTeamMember(db, wsUid(user), user.role, req.params.email);
      return res.json(result);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'remove failed' });
    }
  });

  /** Public health for mobile app connectivity check */
  app.get('/api/lead-agent/health', (_req, res) => {
    res.json({
      ok: true,
      grok: Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
      defaults: DEFAULT_BUSINESSES.map((b) => ({ id: b.id, name: b.name })),
    });
  });

  app.get('/api/lead-agent/defaults', (_req, res) => {
    res.json({ businesses: DEFAULT_BUSINESSES });
  });

  /** Call forwarding + Grok voice setup (MacroREI test run) */
  app.get('/api/lead-agent/work-mode/:businessId', (req, res) => {
    const { businessId } = req.params;
    if (businessId === 'macrorei') {
      return res.json(buildWorkModeGuide());
    }
    return res.status(404).json({
      error: 'Work mode guide not configured for this business yet.',
      businessId,
    });
  });

  app.get('/api/lead-agent/businesses', async (req, res) => {
    const user = await auth(req, res);
    if (!user) return;
    const snap = await db.collection(COL).doc(wsUid(user)).collection('businesses').get();
    const stored = snap.docs.map((d) => d.data());
    const byId = new Map(stored.map((b) => [b.id, b]));
    const merged = DEFAULT_BUSINESSES.map((d) => mergeBusiness(d, byId.get(d.id) || {}));
    for (const b of stored) {
      if (!DEFAULT_BUSINESSES.some((d) => d.id === b.id)) merged.push(b);
    }
    return res.json({ businesses: merged });
  });

  app.put('/api/lead-agent/businesses/:businessId', async (req, res) => {
    const user = await auth(req, res, { minRole: 'owner' });
    if (!user) return;
    const { businessId } = req.params;
    const body = req.body || {};
    const defaults = getDefaultBusiness(businessId) || {};
    const payload = {
      ...defaults,
      ...body,
      id: businessId,
      updatedAt: FieldValue.serverTimestamp(),
    };
    delete payload.twilioToken;
    if (body.twilioToken) payload.twilioTokenSet = true;
    await businessRef(db, wsUid(user), businessId).set(payload, { merge: true });
    if (body.twilioToken) {
      await businessRef(db, wsUid(user), businessId).collection('secrets').doc('twilio').set(
        { token: body.twilioToken, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
    const merged = await getBusinessDoc(db, wsUid(user), businessId);
    return res.json({ business: { ...merged, twilioToken: undefined } });
  });

  app.get('/api/lead-agent/businesses/:businessId/leads', async (req, res) => {
    const user = await auth(req, res);
    if (!user) return;
    const { businessId } = req.params;
    const snap = await leadsRef(db, wsUid(user), businessId).orderBy('updatedAt', 'desc').limit(500).get();
    return res.json({ leads: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  });

  app.put('/api/lead-agent/businesses/:businessId/leads/:leadId', async (req, res) => {
    const user = await auth(req, res, { minRole: 'editor' });
    if (!user) return;
    const { businessId, leadId } = req.params;
    const body = req.body || {};
    const phone = normalizePhone(body.phone);
    await leadsRef(db, wsUid(user), businessId).doc(leadId).set(
      {
        ...body,
        phone,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: body.createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    const snap = await leadsRef(db, wsUid(user), businessId).doc(leadId).get();
    return res.json({ lead: { id: snap.id, ...snap.data() } });
  });

  app.post('/api/lead-agent/businesses/:businessId/leads/import', async (req, res) => {
    const user = await auth(req, res, { minRole: 'editor' });
    if (!user) return;
    const { businessId } = req.params;
    const items = Array.isArray(req.body?.leads) ? req.body.leads : [];
    let imported = 0;
    for (const item of items.slice(0, 500)) {
      const phone = normalizePhone(item.phone);
      if (phone.replace(/\D/g, '').length < 10) continue;
      const id = String(item.id || randomUUID());
      await leadsRef(db, wsUid(user), businessId).doc(id).set(
        {
          name: String(item.name || '').slice(0, 200),
          phone,
          propertyAddress: String(item.propertyAddress || item.notes || '').slice(0, 500),
          notes: String(item.notes || item.propertyAddress || '').slice(0, 2000),
          status: item.status || 'new',
          talkedTo: Boolean(item.talkedTo),
          agentPaused: Boolean(item.agentPaused),
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: item.createdAt || FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      imported++;
    }
    return res.json({ imported, total: items.length });
  });

  app.get('/api/lead-agent/businesses/:businessId/leads/:leadId/messages', async (req, res) => {
    const user = await auth(req, res);
    if (!user) return;
    const { businessId, leadId } = req.params;
    const snap = await messagesRef(db, wsUid(user), businessId, leadId).orderBy('at', 'asc').limit(200).get();
    return res.json({ messages: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  });

  app.post('/api/lead-agent/businesses/:businessId/leads/:leadId/send', async (req, res) => {
    const user = await auth(req, res, { minRole: 'editor' });
    if (!user) return;
    const { businessId, leadId } = req.params;
    const business = await getBusinessDoc(db, wsUid(user), businessId);
    const quota = await canSendSms(business);
    if (!quota.allowed) {
      return res.status(429).json({ error: 'Daily SMS limit reached', ...quota });
    }
    const leadSnap = await leadsRef(db, wsUid(user), businessId).doc(leadId).get();
    if (!leadSnap.exists) return res.status(404).json({ error: 'Lead not found' });
    const lead = leadSnap.data();
    if (lead.agentPaused || lead.optedOut) {
      return res.status(400).json({ error: lead.optedOut ? 'Lead opted out' : 'Agent paused for lead' });
    }
    const body = req.body?.body || (await generateFirstOutbound({ business, lead }));
    const result = await sendLeadSms({ business, to: lead.phone, body });
    await messagesRef(db, wsUid(user), businessId, leadId).add({
      direction: 'outbound',
      body,
      provider: result.provider || business.smsProvider,
      at: FieldValue.serverTimestamp(),
      automated: Boolean(req.body?.automated),
    });
    await leadsRef(db, wsUid(user), businessId).doc(leadId).set(
      { status: 'texted', lastContactAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    if (result.sent) await incrementDailySms(db, wsUid(user), businessId);
    return res.json({ ...result, body, quota: { ...quota, sentToday: quota.sentToday + (result.sent ? 1 : 0) } });
  });

  app.post('/api/lead-agent/businesses/:businessId/inbound', async (req, res) => {
    const user = await auth(req, res, { minRole: 'editor' });
    if (!user) return;
    const { businessId } = req.params;
    const business = await getBusinessDoc(db, wsUid(user), businessId);
    try {
      const result = await processInboundSms(db, wsUid(user), businessId, business, req.body || {});
      if (result.reply) await incrementDailySms(db, wsUid(user), businessId);
      return res.json(result);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'inbound failed' });
    }
  });

  /** Phone app: plan next outbound (server-side lead list) */
  app.post('/api/lead-agent/businesses/:businessId/outbound-next', async (req, res) => {
    const user = await auth(req, res, { minRole: 'editor' });
    if (!user) return;
    const { businessId } = req.params;
    const business = await getBusinessDoc(db, wsUid(user), businessId);
    const quota = canSendOutbound(business);
    if (!quota.ok) return res.status(429).json({ error: quota.reason, ...quota });

    const localLeads = Array.isArray(req.body?.leads) ? req.body.leads : null;
    let lead = localLeads ? pickNextLead(localLeads, business) : null;
    if (!lead) {
      const snap = await leadsRef(db, wsUid(user), businessId).where('status', '==', 'new').limit(50).get();
      const fromDb = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lead = pickNextLead(fromDb, business);
    }
    if (!lead) return res.json({ done: true, reason: 'no_leads', quota });

    const body = req.body?.body || personalizeOutbound(business, lead);
    return res.json({
      done: false,
      leadId: lead.id,
      phone: lead.phone,
      body,
      waitMs: randomDelayMs(business),
      quota,
    });
  });

  app.post('/api/lead-agent/device/refresh-rag/:businessId', async (req, res) => {
    const user = await auth(req, res, { minRole: 'owner' });
    if (!user) return;
    clearRagCache(req.params.businessId);
    const text = await getWebsiteRagContext(req.params.businessId);
    return res.json({ ok: true, chars: text.length });
  });

  /** Device reports outbound SMS sent via cell (increments quota) */
  app.post('/api/lead-agent/businesses/:businessId/device-sent', async (req, res) => {
    const user = await auth(req, res, { minRole: 'editor' });
    if (!user) return;
    const { businessId } = req.params;
    const { leadId, body, to } = req.body || {};
    await incrementDailySms(db, wsUid(user), businessId);
    if (leadId) {
      await messagesRef(db, wsUid(user), businessId, leadId).add({
        direction: 'outbound',
        body,
        provider: 'phone',
        at: FieldValue.serverTimestamp(),
        automated: Boolean(req.body?.automated),
      });
      await leadsRef(db, wsUid(user), businessId).doc(leadId).set(
        { status: 'texted', lastContactAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
    const business = await getBusinessDoc(db, wsUid(user), businessId);
    const quota = await canSendSms(business);
    return res.json({ ok: true, to: normalizePhone(to), quota });
  });

  /** Twilio inbound webhook (optional) */
  app.post('/api/lead-agent/twilio/inbound', async (req, res) => {
    const secret = process.env.LEAD_AGENT_TWILIO_WEBHOOK_SECRET;
    if (secret && req.headers['x-lead-agent-secret'] !== secret) {
      return res.status(403).send('Forbidden');
    }
    const from = normalizePhone(req.body?.From);
    const body = req.body?.Body || '';
    const businessId = req.query.businessId || 'macrorei';
    const uid = req.query.uid;
    if (!uid) return res.status(400).send('uid required');
    req.headers.authorization = req.headers.authorization || '';
    // Internal forward — reuse inbound handler logic inline
    const business = await getBusinessDoc(db, uid, businessId);
    let leadId;
    const q = await leadsRef(db, uid, businessId).where('phone', '==', from).limit(1).get();
    let lead = null;
    if (!q.empty) {
      leadId = q.docs[0].id;
      lead = q.docs[0].data();
    } else {
      leadId = db.collection('_').doc().id;
      lead = { phone: from, status: 'replied' };
      await leadsRef(db, uid, businessId).doc(leadId).set({ ...lead, createdAt: FieldValue.serverTimestamp() });
    }
    await messagesRef(db, uid, businessId, leadId).add({ direction: 'inbound', body, at: FieldValue.serverTimestamp() });
    const historySnap = await messagesRef(db, uid, businessId, leadId).orderBy('at', 'asc').limit(30).get();
    const history = historySnap.docs.map((d) => {
      const m = d.data();
      return { role: m.direction === 'outbound' ? 'assistant' : 'user', text: m.body };
    });
    const ai = await generateSmsReply({ business, lead, history, inbound: body });
    if (ai.reply && !isOptOutMessage(body)) {
      res.set('Content-Type', 'text/xml');
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(ai.reply)}</Message></Response>`);
    }
    res.set('Content-Type', 'text/xml');
    return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  });
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
