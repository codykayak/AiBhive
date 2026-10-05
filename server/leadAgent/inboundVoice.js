import { FieldValue } from 'firebase-admin/firestore';
import { normalizePhone } from './smsProvider.js';
import { resolveMacroreiGrokVoicePhone } from '../macroreiVoiceInstructions.js';
import { defaultWorkspaceUid } from './workspaceAccess.js';

export function twimlEscape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function resolveGrokVoiceLine(businessId) {
  if (businessId === 'macrorei' || !businessId) return resolveMacroreiGrokVoicePhone();
  return resolveMacroreiGrokVoicePhone();
}

export function buildInboundReturnCallTwiml({
  grokE164,
  leadName = '',
  ringTimeout = 45,
  twilioFromE164 = '',
}) {
  const grok = normalizePhone(grokE164);
  const from = normalizePhone(twilioFromE164);
  if (grok && from && grok === from) {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${twimlEscape(
      'Voice routing is misconfigured on the server. Please text us and we will call you back.',
    )}</Say></Response>`;
  }

  const first = String(leadName || '')
    .trim()
    .split(/\s+/)[0];
  const greet = first
    ? `Hi ${first}, thanks for calling back. Connecting you to our Macro R E I assistant now.`
    : 'Thanks for calling back. Connecting you to our Macro R E I assistant now.';

  if (!grok || grok.replace(/\D/g, '').length < 10) {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${twimlEscape(
      'Thanks for calling Macro Real Estate Investing. We will return your call shortly. Goodbye.',
    )}</Say></Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${twimlEscape(
    greet,
  )}</Say><Dial answerOnBridge="true" timeout="${ringTimeout}"><Number>${twimlEscape(grok)}</Number></Dial><Say voice="Polly.Joanna">${twimlEscape(
    'Sorry, our assistant did not pick up. We will call you back soon. Goodbye.',
  )}</Say></Response>`;
}

export async function recordInboundReturnCall(db, uid, businessId, fromPhone, meta = {}) {
  const phone = normalizePhone(fromPhone);
  if (!phone || !db || !uid || !businessId) return { leadId: null, lead: null };

  const leadsCol = db
    .collection('lead_agent_workspaces')
    .doc(uid)
    .collection('businesses')
    .doc(businessId)
    .collection('leads');

  const q = await leadsCol.where('phone', '==', phone).limit(1).get();
  let leadId;
  let lead = null;
  if (!q.empty) {
    leadId = q.docs[0].id;
    lead = q.docs[0].data();
  } else {
    leadId = db.collection('_').doc().id;
    lead = { phone, name: '', status: 'replied', agentPaused: false, optedOut: false };
    await leadsCol.doc(leadId).set({
      ...lead,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await leadsCol.doc(leadId).collection('messages').add({
    direction: 'inbound',
    channel: 'voice',
    body: meta.summary || 'Return phone call — bridged to Grok voice',
    at: FieldValue.serverTimestamp(),
    callSid: meta.callSid || '',
    via: 'twilio-grok-voice',
  });

  await leadsCol.doc(leadId).set(
    {
      status: 'replied',
      lastContactAt: FieldValue.serverTimestamp(),
      lastInboundCallAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { leadId, lead };
}

export function leadAgentVoiceWebhookPath(businessId = 'macrorei', uid) {
  const ws = uid || defaultWorkspaceUid();
  return `/api/lead-agent/twilio/voice/inbound?businessId=${encodeURIComponent(businessId)}&uid=${encodeURIComponent(ws)}`;
}

export function assertLeadAgentTwilioWebhook(req) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  if (accountSid && req.body?.AccountSid && req.body.AccountSid !== accountSid) return false;
  const secret = process.env.LEAD_AGENT_TWILIO_WEBHOOK_SECRET;
  if (secret && req.headers['x-lead-agent-secret'] !== secret) return false;
  return true;
}
