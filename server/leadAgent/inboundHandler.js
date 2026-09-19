import { FieldValue } from 'firebase-admin/firestore';
import { generateSmsReply } from './grokAgent.js';
import { sendLeadSms, normalizePhone } from './smsProvider.js';
import { canSendReplySms, getSentTodayLocal, todayKey } from './automation.js';

export async function processInboundSms(db, uid, businessId, business, { from, body: inbound, leadId: explicitLeadId }) {
  const phone = normalizePhone(from);
  if (!phone || !inbound) throw new Error('from and body required');

  let leadId = explicitLeadId;
  let lead = null;
  const leadsRef = (bid, lid) =>
    db.collection('lead_agent_workspaces').doc(uid).collection('businesses').doc(bid).collection('leads').doc(lid);
  const messagesRef = (bid, lid) => leadsRef(bid, lid).collection('messages');

  if (!leadId) {
    const q = await db
      .collection('lead_agent_workspaces')
      .doc(uid)
      .collection('businesses')
      .doc(businessId)
      .collection('leads')
      .where('phone', '==', phone)
      .limit(1)
      .get();
    if (!q.empty) {
      leadId = q.docs[0].id;
      lead = q.docs[0].data();
    }
  } else {
    const snap = await leadsRef(businessId, leadId).get();
    lead = snap.exists ? snap.data() : null;
  }
  if (!leadId) {
    leadId = db.collection('_').doc().id;
    lead = { phone, name: '', status: 'replied', agentPaused: false, optedOut: false };
    await leadsRef(businessId, leadId).set({
      ...lead,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await messagesRef(businessId, leadId).add({
    direction: 'inbound',
    body: inbound,
    at: FieldValue.serverTimestamp(),
  });

  const historySnap = await messagesRef(businessId, leadId).orderBy('at', 'asc').limit(30).get();
  const history = historySnap.docs.map((d) => {
    const m = d.data();
    return { role: m.direction === 'outbound' ? 'assistant' : 'user', text: m.body };
  });

  const ai = await generateSmsReply({ business, lead, history, inbound });
  const updates = {
    status: 'replied',
    lastContactAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (ai.optedOut) updates.optedOut = true;
  if (ai.escalated) updates.needsHuman = true;
  await leadsRef(businessId, leadId).set(updates, { merge: true });

  let outbound = null;
  if (ai.reply && !ai.paused) {
    const quota = canSendReplySms(business);
    if (quota.ok) {
      outbound = await sendLeadSms({ business, to: phone, body: ai.reply });
      await messagesRef(businessId, leadId).add({
        direction: 'outbound',
        body: ai.reply,
        provider: outbound.provider || business.smsProvider,
        at: FieldValue.serverTimestamp(),
        automated: true,
        escalated: ai.escalated,
      });
    }
  }

  return { leadId, reply: ai.reply, outbound, escalated: ai.escalated, optedOut: ai.optedOut };
}

export async function incrementDailySms(db, uid, businessId) {
  const key = `smsSentByDay.${todayKey()}`;
  await db
    .collection('lead_agent_workspaces')
    .doc(uid)
    .collection('businesses')
    .doc(businessId)
    .set({ [key]: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export { canSendReplySms, canSendOutbound, getSentTodayLocal, todayKey } from './automation.js';
