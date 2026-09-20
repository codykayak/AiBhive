import type { Business, Lead } from './types';

const dayKey = () => new Date().toISOString().slice(0, 10);

export function getSentToday(businessId: string, counts: Record<string, Record<string, number>>) {
  return counts[businessId]?.[dayKey()] || 0;
}

function hourInTimezone(business: Business) {
  const tz = business.sendTimezone || 'America/Los_Angeles';
  try {
    return Number(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(new Date()),
    );
  } catch {
    return new Date().getHours();
  }
}

export function isWithinSendWindow(business: Business) {
  const hour = hourInTimezone(business);
  const start = business.sendWindowStart ?? 9;
  const end = business.sendWindowEnd ?? 18;
  return hour >= start && hour < end;
}

export function canSendNow(business: Business, sentToday: number) {
  if (business.automationEnabled === false) return { ok: false, reason: 'automation_off' };
  if (!isWithinSendWindow(business)) return { ok: false, reason: 'outside_hours' };
  const limit = business.dailySmsLimit ?? 25;
  if (sentToday >= limit) return { ok: false, reason: 'daily_cap', sentToday, limit };
  return { ok: true, sentToday, limit };
}

export function randomDelayMs(business: Business) {
  const min = (business.minDelayMinutes ?? 6) * 60 * 1000;
  const max = (business.maxDelayMinutes ?? 15) * 60 * 1000;
  return min + Math.floor(Math.random() * Math.max(1, max - min));
}

export function pickNextLead(leads: Lead[]) {
  const pool = leads.filter(
    (l) =>
      l.phone &&
      l.propertyAddress?.trim() &&
      !l.optedOut &&
      !l.agentPaused &&
      l.status !== 'dead' &&
      (!l.status || l.status === 'new'),
  );
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export { personalizeOutbound } from './outboundMessage';
export { dayKey };
