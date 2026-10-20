import { FieldValue } from 'firebase-admin/firestore';
import { sendLeadSms, normalizePhone } from './smsProvider.js';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const DEFAULT_ESCALATION_OPS = {
  escalationNotifyPhone: '',
  escalationNotifyLabel: 'Owner mobile',
  notifyPhones: [],
  activeNotifyPhoneId: '',
  schedulingTimezone: 'America/Los_Angeles',
  /** If true, offer "call in ~15 min" when within window */
  allowImmediateCallback: true,
  immediateCallbackMinutes: 15,
  /** Weekly default: hour (0-23) earliest same-day callback after job */
  weeklyAvailability: {
    sun: { dayOff: true, afterHour: 9, untilHour: 18 },
    mon: { dayOff: false, afterHour: 15, untilHour: 19 },
    tue: { dayOff: false, afterHour: 15, untilHour: 19 },
    wed: { dayOff: false, afterHour: 15, untilHour: 19 },
    thu: { dayOff: false, afterHour: 15, untilHour: 19 },
    fri: { dayOff: false, afterHour: 15, untilHour: 19 },
    sat: { dayOff: true, afterHour: 10, untilHour: 17 },
  },
  schedulingPhrases: {
    immediate:
      'Give me a second — can I call you in about {minutes} minutes? If that works, just reply yes.',
    laterToday:
      "I'm on the road for a bit — can I call you around {time}? Does that work for you?",
    nextWindow:
      "I'm tied up until about {time} today — can I call you then? Reply yes or suggest another time.",
  },
  useSchedulingReplies: true,
};

export function resolveActiveNotifyPhone(ops) {
  const list = Array.isArray(ops.notifyPhones) ? ops.notifyPhones : [];
  const active = list.find((p) => p.id === ops.activeNotifyPhoneId);
  if (active?.e164) return { phone: normalizePhone(active.e164), label: active.label || '' };
  if (ops.escalationNotifyPhone) {
    return { phone: normalizePhone(ops.escalationNotifyPhone), label: ops.escalationNotifyLabel || '' };
  }
  return { phone: '', label: '' };
}

export function mergeEscalationOps(business) {
  const d = DEFAULT_ESCALATION_OPS;
  const merged = {
    ...d,
    ...(business?.escalationOps || {}),
    weeklyAvailability: {
      ...d.weeklyAvailability,
      ...(business?.escalationOps?.weeklyAvailability || {}),
    },
    schedulingPhrases: {
      ...d.schedulingPhrases,
      ...(business?.escalationOps?.schedulingPhrases || {}),
    },
    todayOverride: business?.escalationOps?.todayOverride || business?.escalationTodayOverride || null,
  };
  const list = Array.isArray(merged.notifyPhones) ? [...merged.notifyPhones] : [];
  if (!list.length && merged.escalationNotifyPhone) {
    list.push({
      id: 'legacy',
      label: merged.escalationNotifyLabel || 'Primary',
      e164: merged.escalationNotifyPhone,
    });
    merged.activeNotifyPhoneId = merged.activeNotifyPhoneId || 'legacy';
  }
  merged.notifyPhones = list;
  const active = resolveActiveNotifyPhone(merged);
  merged.escalationNotifyPhone = active.phone;
  merged.escalationNotifyLabel = active.label;
  return merged;
}

export function buildImFreeNowOverride(dateKey, ops = {}) {
  return {
    date: dateKey,
    dayOff: true,
    immediate: true,
    afterHour: 9,
    untilHour: Number(ops.untilHour || 20),
  };
}

function zonedParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const wdRaw = String(get('weekday') || '');
  const wdMap = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };
  const dayKey = wdMap[wdRaw] || 'mon';
  return {
    dayKey,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

function formatTimePt(hour, minute = 0) {
  const h = hour % 24;
  const m = minute % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
}

/**
 * Decide callback offer for owner SMS + internal scheduled time.
 */
export function resolveCallbackOffer(business, now = new Date()) {
  const ops = mergeEscalationOps(business);
  const tz = ops.schedulingTimezone || 'America/Los_Angeles';
  const { dayKey, hour, minute, dateKey } = zonedParts(now, tz);

  let dayOff = false;
  let afterHour = 9;
  let untilHour = 18;
  let immediate = ops.allowImmediateCallback;

  const override = ops.todayOverride;
  if (override && String(override.date) === dateKey) {
    dayOff = Boolean(override.dayOff);
    if (override.afterHour != null) afterHour = Number(override.afterHour);
    if (override.untilHour != null) untilHour = Number(override.untilHour);
    if (override.immediate != null) immediate = Boolean(override.immediate);
  } else {
    const w = ops.weeklyAvailability?.[dayKey] || ops.weeklyAvailability.mon;
    dayOff = Boolean(w?.dayOff);
    afterHour = Number(w?.afterHour ?? 15);
    untilHour = Number(w?.untilHour ?? 19);
  }

  if (dayOff && immediate) {
    const mins = Number(ops.immediateCallbackMinutes || 15);
    const reply = (ops.schedulingPhrases.immediate || DEFAULT_ESCALATION_OPS.schedulingPhrases.immediate).replace(
      /\{minutes\}/g,
      String(mins),
    );
    const at = new Date(now.getTime() + mins * 60 * 1000);
    return { mode: 'immediate', reply, scheduledCallbackAt: at.toISOString(), canCallNow: true };
  }

  if (!dayOff && immediate && hour >= afterHour && hour < untilHour) {
    const mins = Number(ops.immediateCallbackMinutes || 15);
    const reply = (ops.schedulingPhrases.immediate || '').replace(/\{minutes\}/g, String(mins));
    const at = new Date(now.getTime() + mins * 60 * 1000);
    return { mode: 'immediate', reply, scheduledCallbackAt: at.toISOString(), canCallNow: true };
  }

  let targetHour = afterHour;
  if (hour >= afterHour && hour < untilHour) {
    targetHour = hour;
    const bump = minute > 45 ? 1 : 0;
    targetHour = Math.min(untilHour - 1, targetHour + bump);
  } else if (hour >= untilHour) {
    return {
      mode: 'tomorrow',
      reply:
        "Thanks for getting back to me — I'll have Cody reach out on the next business day. What's the best number to call?",
      scheduledCallbackAt: null,
      canCallNow: false,
    };
  }

  const timeLabel = formatTimePt(targetHour, hour < afterHour ? 0 : 30);
  const reply = (hour < afterHour ? ops.schedulingPhrases.laterToday : ops.schedulingPhrases.nextWindow)
    .replace(/\{time\}/g, timeLabel)
    .replace(/\{minutes\}/g, String(ops.immediateCallbackMinutes || 15));

  const scheduled = new Date(now);
  scheduled.setHours(targetHour, hour < afterHour ? 0 : 30, 0, 0);

  return {
    mode: hour < afterHour ? 'later_today' : 'next_window',
    reply,
    scheduledCallbackAt: scheduled.toISOString(),
    canCallNow: false,
    proposedTimeLabel: timeLabel,
  };
}

export async function notifyEscalationContacts(db, uid, businessId, business, lead, context = {}) {
  const ops = mergeEscalationOps(business);
  const { phone, label } = resolveActiveNotifyPhone(ops);
  if (!phone) return { sent: false, reason: 'no_escalation_notify_phone' };

  const name = lead?.name || lead?.phone || 'Lead';
  const addr = lead?.propertyAddress || lead?.notes || '';
  const when = context.scheduledCallbackAt
    ? new Date(context.scheduledCallbackAt).toLocaleString('en-US', {
        timeZone: ops.schedulingTimezone,
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'ASAP';
  const body = [
    'MacroREI ESCALATION',
    label ? `Route: ${label}` : '',
    name,
    addr ? addr.slice(0, 80) : '',
    lead?.phone || '',
    context.inbound ? `They said: "${String(context.inbound).slice(0, 120)}"` : '',
    `Callback target: ${when}`,
    `Lead id: ${lead?.id || context.leadId || '—'}`,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 480);

  const result = await sendLeadSms({
    business,
    to: phone,
    body,
    preferServerTwilio: true,
  });
  return { sent: Boolean(result.sent), to: phone.replace(/\d{4}$/, '****'), result };
}

export async function applyEscalationToLead(db, uid, businessId, leadId, payload) {
  await db
    .collection('lead_agent_workspaces')
    .doc(uid)
    .collection('businesses')
    .doc(businessId)
    .collection('leads')
    .doc(leadId)
    .set(
      {
        needsHuman: true,
        escalationAt: FieldValue.serverTimestamp(),
        escalationState: payload.mode || 'escalated',
        scheduledCallbackAt: payload.scheduledCallbackAt || null,
        escalationInboundSnippet: String(payload.inbound || '').slice(0, 280),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export function buildEscalationSmsReply(business, offer) {
  const custom = business?.escalationMessage;
  if (custom && !business?.escalationOps?.useSchedulingReplies) {
    return custom;
  }
  return offer.reply || custom || 'Thanks — our team will reach out shortly.';
}

export function schedulingPromptBlock(business) {
  const ops = mergeEscalationOps(business);
  const offer = resolveCallbackOffer(business);
  return [
    'CALLBACK SCHEDULING (use when lead wants to talk, is interested, or asks for a call):',
    `- Timezone: ${ops.schedulingTimezone}`,
    `- Prefer this reply style (adapt naturally, one SMS): "${offer.reply}"`,
    '- Confirm time in plain language (e.g. 4:30 PM). Do not book without their yes.',
    '- If they propose a time, accept if reasonable else counter with next available window.',
    ops.notifyPhones?.length
      ? `- After escalation, alert SMS goes to active notify line (${ops.escalationNotifyLabel || 'primary'}).`
      : '- Set escalation notify phone in the employee portal so Cody gets text alerts.',
  ]
    .filter(Boolean)
    .join('\n');
}
