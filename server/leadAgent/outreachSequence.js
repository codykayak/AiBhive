import { FieldValue } from 'firebase-admin/firestore';
import { canSendOutbound, randomDelayMs } from './automation.js';
import {
  personalizeFollowUpOutbound,
  personalizeOutbound,
  personalizeRelativeOutbound,
  resolvePropertyAddress,
} from './outboundMessage.js';
import { sendLeadSms } from './smsProvider.js';
import { incrementDailySms } from './inboundHandler.js';
import { runRelativeLookup } from './relativeLookup.js';

export const OUTREACH_STAGES = [
  'new',
  'touch_1',
  'touch_2',
  'awaiting_reply',
  'relative_search',
  'relative_outreach',
  'replied',
  'opted_out',
  'needs_human',
];

export function outreachConfig(business) {
  return {
    maxOwnerTouches: Number(business?.outreachMaxOwnerTouches ?? 2),
    relativeCooldownHours: Number(business?.outreachRelativeCooldownHours ?? 72),
    relativeSearchEnabled: business?.outreachRelativeSearchEnabled !== false,
    minHoursBetweenTouches: Number(business?.outreachMinHoursBetweenTouches ?? 48),
  };
}

function leadsCol(db, uid, businessId) {
  return db.collection('lead_agent_workspaces').doc(uid).collection('businesses').doc(businessId).collection('leads');
}

function messagesCol(db, uid, businessId, leadId) {
  return leadsCol(db, uid, businessId).doc(leadId).collection('messages');
}

export async function countInboundMessages(db, uid, businessId, leadId) {
  const snap = await messagesCol(db, uid, businessId, leadId).where('direction', '==', 'inbound').limit(1).get();
  return snap.size;
}

export function ownerTouchCount(lead) {
  return Number(lead?.ownerTouchCount ?? lead?.textCount ?? 0);
}

export function hoursSince(isoOrDate) {
  if (!isoOrDate) return Infinity;
  const t = typeof isoOrDate === 'string' ? Date.parse(isoOrDate) : isoOrDate?.toDate?.() ? isoOrDate.toDate().getTime() : NaN;
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60);
}

export function buildOutboundBody(business, lead, touchIndex) {
  if (touchIndex <= 1) return personalizeOutbound(business, lead);
  return personalizeFollowUpOutbound(business, lead, touchIndex);
}

export async function registerOwnerOutboundTouch(db, uid, businessId, leadId, meta = {}, business = null) {
  const ref = leadsCol(db, uid, businessId).doc(leadId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const lead = snap.data();
  const cfg = outreachConfig(business || {});
  const prev = ownerTouchCount(lead);
  const next = prev + 1;
  let outreachStage = lead.outreachStage || 'new';
  if (next >= 1) outreachStage = 'touch_1';
  if (next >= cfg.maxOwnerTouches) outreachStage = 'awaiting_reply';
  if (lead.ownerReplied) outreachStage = 'replied';
  await ref.set(
    {
      ownerTouchCount: next,
      outreachStage,
      lastOwnerOutboundAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...meta,
    },
    { merge: true },
  );
}

export async function markOwnerReplied(db, uid, businessId, leadId) {
  await leadsCol(db, uid, businessId)
    .doc(leadId)
    .set(
      {
        ownerReplied: true,
        outreachStage: 'replied',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

async function recordMessage(db, uid, businessId, leadId, body, result, extra = {}) {
  await messagesCol(db, uid, businessId, leadId).add({
    direction: 'outbound',
    body,
    provider: result.provider || 'twilio',
    at: FieldValue.serverTimestamp(),
    automated: true,
    ...extra,
  });
}

export async function sendOwnerTouch(db, uid, businessId, business, leadDoc) {
  const lead = { id: leadDoc.id, ...leadDoc.data() };
  if (lead.optedOut || lead.agentPaused || lead.ownerReplied) {
    return { skipped: true, reason: 'inactive' };
  }
  const cfg = outreachConfig(business);
  const touches = ownerTouchCount(lead);
  if (touches >= cfg.maxOwnerTouches) return { skipped: true, reason: 'max_touches' };
  if (touches > 0 && hoursSince(lead.lastOwnerOutboundAt) < cfg.minHoursBetweenTouches) {
    return { skipped: true, reason: 'touch_cooldown' };
  }
  const quota = canSendOutbound(business);
  if (!quota.ok) return { skipped: true, reason: quota.reason };

  const touchIndex = touches + 1;
  const body = buildOutboundBody(business, lead, touchIndex);
  const result = await sendLeadSms({ business, to: lead.phone, body, preferServerTwilio: true });
  if (!result.sent) return { skipped: true, reason: 'send_failed', result };

  await recordMessage(db, uid, businessId, lead.id, body, result, { outreachTouch: touchIndex });
  await registerOwnerOutboundTouch(db, uid, businessId, lead.id, {}, business);
  if (result.sent) await incrementDailySms(db, uid, businessId);
  await leadsCol(db, uid, businessId).doc(lead.id).set(
    {
      status: 'texted',
      textCount: FieldValue.increment(1),
      lastTextBody: body.slice(0, 180),
      lastContactAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { sent: true, leadId: lead.id, touchIndex, body };
}

async function ensureRelativeChildLeads(db, uid, businessId, parentLead, contacts) {
  const parentId = parentLead.id;
  const address = resolvePropertyAddress(parentLead);
  const created = [];
  for (const c of contacts) {
    if (!c.phone) continue;
    const existing = await leadsCol(db, uid, businessId).where('phone', '==', c.phone).limit(1).get();
    if (!existing.empty) continue;
    const id = db.collection('_').doc().id;
    await leadsCol(db, uid, businessId).doc(id).set({
      name: c.name || '',
      phone: c.phone,
      propertyAddress: address,
      notes: `Relative of ${parentLead.name || 'owner'} — ${c.relationship || 'associate'}`,
      status: 'new',
      leadRole: 'relative',
      parentLeadId: parentId,
      relationship: c.relationship || '',
      textCount: 0,
      ownerTouchCount: 0,
      outreachStage: 'new',
      agentPaused: false,
      optedOut: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    created.push(id);
  }
  return created;
}

export async function runRelativeSearchForLead(db, uid, businessId, business, leadDoc) {
  const lead = { id: leadDoc.id, ...leadDoc.data() };
  const ref = leadsCol(db, uid, businessId).doc(lead.id);
  await ref.set({ outreachStage: 'relative_search', relativeSearchStatus: 'running', updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  const lookup = await runRelativeLookup(lead, business);
  if (!lookup.ok || !lookup.contacts?.length) {
    await ref.set(
      {
        outreachStage: 'needs_human',
        relativeSearchStatus: 'failed',
        relativeSearchError: lookup.error || 'no_contacts',
        needsHuman: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: false, error: lookup.error || 'no_contacts' };
  }

  await ref.set(
    {
      relativeContacts: lookup.contacts,
      relativeSearchStatus: 'done',
      outreachStage: 'relative_outreach',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  const childIds = await ensureRelativeChildLeads(db, uid, businessId, lead, lookup.contacts);
  return { ok: true, contacts: lookup.contacts.length, childLeadIds: childIds };
}

export async function sendRelativeTouch(db, uid, businessId, business, leadDoc) {
  const lead = { id: leadDoc.id, ...leadDoc.data() };
  if (lead.leadRole !== 'relative' || lead.optedOut || lead.relativeTextSent) {
    return { skipped: true, reason: 'not_eligible' };
  }
  const quota = canSendOutbound(business);
  if (!quota.ok) return { skipped: true, reason: quota.reason };

  const parentSnap = lead.parentLeadId
    ? await leadsCol(db, uid, businessId).doc(lead.parentLeadId).get()
    : null;
  const parent = parentSnap?.exists ? { id: parentSnap.id, ...parentSnap.data() } : lead;

  const body = personalizeRelativeOutbound(business, parent, lead);
  const result = await sendLeadSms({ business, to: lead.phone, body, preferServerTwilio: true });
  if (!result.sent) return { skipped: true, reason: 'send_failed' };

  await recordMessage(db, uid, businessId, lead.id, body, result, { relativeOutreach: true });
  if (result.sent) await incrementDailySms(db, uid, businessId);
  await leadsCol(db, uid, businessId).doc(lead.id).set(
    {
      relativeTextSent: true,
      status: 'texted',
      textCount: FieldValue.increment(1),
      lastTextBody: body.slice(0, 180),
      lastContactAt: FieldValue.serverTimestamp(),
      outreachStage: 'touch_1',
    },
    { merge: true },
  );
  return { sent: true, leadId: lead.id, body };
}

export async function pickLeadsForOutreachTick(db, uid, businessId, business, limit = 8) {
  const cfg = outreachConfig(business);
  const snap = await leadsCol(db, uid, businessId).limit(400).get();
  const owners = snap.docs.filter((d) => {
    const L = d.data();
    return (L.leadRole || 'owner') === 'owner' && !L.optedOut && !L.ownerReplied;
  });

  const toText = [];
  const forRelativeSearch = [];
  const relatives = snap.docs.filter((d) => d.data().leadRole === 'relative' && !d.data().relativeTextSent);

  for (const doc of owners) {
    const L = doc.data();
    const touches = ownerTouchCount(L);
    const inbound = await countInboundMessages(db, uid, businessId, doc.id);
    if (inbound > 0) {
      await markOwnerReplied(db, uid, businessId, doc.id);
      continue;
    }
    if (touches < cfg.maxOwnerTouches) {
      toText.push(doc);
      continue;
    }
    if (
      cfg.relativeSearchEnabled &&
      touches >= cfg.maxOwnerTouches &&
      (L.relativeSearchStatus || 'pending') !== 'done' &&
      (L.relativeSearchStatus || 'pending') !== 'running' &&
      hoursSince(L.lastOwnerOutboundAt) >= cfg.relativeCooldownHours
    ) {
      forRelativeSearch.push(doc);
    }
  }

  return {
    ownerTouches: toText.slice(0, limit),
    relativeSearches: forRelativeSearch.slice(0, 2),
    relatives: relatives.slice(0, Math.max(0, limit - 2)),
    waitMs: randomDelayMs(business),
  };
}

export async function runOutreachTick(db, uid, businessId, business, opts = {}) {
  const limit = Math.min(15, Number(opts.limit) || 8);
  const batch = await pickLeadsForOutreachTick(db, uid, businessId, business, limit);
  const results = { ownerSent: [], relativeSearch: [], relativeSent: [], skipped: [] };

  for (const doc of batch.ownerTouches) {
    const r = await sendOwnerTouch(db, uid, businessId, business, doc);
    if (r.sent) results.ownerSent.push(r);
    else results.skipped.push({ leadId: doc.id, ...r });
    if (!canSendOutbound(business).ok) break;
  }

  const freshBusiness = opts.reloadBusiness ? await opts.reloadBusiness() : business;
  for (const doc of batch.relativeSearches) {
    const r = await runRelativeSearchForLead(db, uid, businessId, freshBusiness, doc);
    results.relativeSearch.push({ leadId: doc.id, ...r });
  }

  for (const doc of batch.relatives) {
    const r = await sendRelativeTouch(db, uid, businessId, freshBusiness, doc);
    if (r.sent) results.relativeSent.push(r);
    else results.skipped.push({ leadId: doc.id, ...r });
    if (!canSendOutbound(freshBusiness).ok) break;
  }

  return { ok: true, ...results, waitMs: batch.waitMs };
}
