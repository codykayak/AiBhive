/** Outbound pacing — reduce carrier spam flags. */

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isWithinSendWindow(business) {
  const tz = business.sendTimezone || 'America/Los_Angeles';
  let hour;
  try {
    hour = Number(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(new Date()),
    );
  } catch {
    hour = new Date().getHours();
  }
  const start = business.sendWindowStart ?? 9;
  const end = business.sendWindowEnd ?? 18;
  return hour >= start && hour < end;
}

export function randomDelayMs(business) {
  const min = (business.minDelayMinutes ?? 5) * 60 * 1000;
  const max = (business.maxDelayMinutes ?? 14) * 60 * 1000;
  if (max <= min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function getSentTodayLocal(business) {
  return Number(business?.smsSentByDay?.[todayKey()] || 0);
}

export function canSendOutbound(business) {
  if (business.automationEnabled === false) {
    return { ok: false, reason: 'automation_off' };
  }
  if (!isWithinSendWindow(business)) {
    return { ok: false, reason: 'outside_hours' };
  }
  const sent = getSentTodayLocal(business);
  const limit = Number(business.dailySmsLimit || 25);
  if (sent >= limit) {
    return { ok: false, reason: 'daily_cap', sent, limit };
  }
  return { ok: true, sent, limit, suggested: business.dailySmsSuggested || Math.min(25, limit) };
}

/** Inbound Grok replies: any hour, extra headroom above cold outbound cap. */
export function canSendReplySms(business) {
  if (business.agentEnabled === false) {
    return { ok: false, reason: 'agent_off' };
  }
  const sent = getSentTodayLocal(business);
  const limit = Number(business.dailySmsLimit || 25);
  const replyCap = limit + Math.max(10, Math.ceil(limit * 0.4));
  if (sent >= replyCap) {
    return { ok: false, reason: 'daily_cap', sent, limit: replyCap };
  }
  return { ok: true, sent, limit: replyCap };
}

export function pickNextLead(leads) {
  const pool = (leads || []).filter(
    (l) =>
      l.phone &&
      !l.optedOut &&
      !l.agentPaused &&
      l.status !== 'dead' &&
      (l.status === 'new' || l.status === undefined),
  );
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function personalizeOutbound(business, lead) {
  let body = business.greeting || business.outboundTemplate || 'Hi — following up.';
  const first = lead?.name?.trim().split(/\s+/)[0];
  if (first && !body.toLowerCase().includes(first.toLowerCase())) {
    body = body.replace(/^Hi,?\s*/i, `Hi ${first}, `);
  }
  if (lead?.propertyAddress && body.length < 280) {
    body = `${body} Re: ${lead.propertyAddress}`.slice(0, 480);
  }
  return body.slice(0, 480);
}
