import AsyncStorage from '@react-native-async-storage/async-storage';
import { postInbound, reportDeviceSent } from './api';
import { canSendNow, dayKey, personalizeOutbound, pickNextLead, randomDelayMs } from './localAutomation';
import { ensureSmsPermissions } from './permissions';
import { sendSmsNative, subscribeInbound, pollInbound } from './sms';
import { normalizePhone } from './api';
import type { Business, Lead } from './types';

const RUNNING_KEY = 'leadagent.automation.running';
const COUNTS_KEY = 'leadagent.smsCounts';

type Handlers = {
  onLog: (line: string) => void;
  getBusiness: () => Business | null;
  getLeads: () => Lead[];
  upsertLead: (lead: Lead) => Promise<void>;
};

let timer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let unsubSms: (() => void) | null = null;
let running = false;
const seenInbound = new Set<string>();

async function handleInbound(h: Handlers, from: string, body: string) {
  const business = h.getBusiness();
  if (!business || !running || business.agentEnabled === false) return;
  const dedupeKey = `${from}:${body.slice(0, 80)}:${Math.floor(Date.now() / 60000)}`;
  if (seenInbound.has(dedupeKey)) return;
  seenInbound.add(dedupeKey);
  h.onLog(`Inbound ${from}`);
  try {
    const lead = h.getLeads().find((l) => normalizePhone(l.phone) === normalizePhone(from));
    const res = await postInbound(business.id, from, body, lead?.id);
    if (res.reply) {
      await sendSmsNative(from, res.reply);
      h.onLog(`Grok → ${from}`);
      if (lead) {
        await h.upsertLead({
          ...lead,
          status: 'replied',
          lastContactAt: new Date().toISOString(),
          needsHuman: Boolean(res.escalated),
          optedOut: Boolean(res.optedOut),
        });
      }
    }
  } catch (e) {
    h.onLog(`Grok failed (Settings: API URL + device secret): ${e}`);
  }
}

async function loadCounts(): Promise<Record<string, Record<string, number>>> {
  const raw = await AsyncStorage.getItem(COUNTS_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function bumpCount(businessId: string) {
  const counts = await loadCounts();
  const dk = dayKey();
  if (!counts[businessId]) counts[businessId] = {};
  counts[businessId][dk] = (counts[businessId][dk] || 0) + 1;
  await AsyncStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  return counts[businessId][dk];
}

export async function getSentTodayForBusiness(businessId: string) {
  const counts = await loadCounts();
  return counts[businessId]?.[dayKey()] || 0;
}

async function scheduleNext(h: Handlers) {
  if (!running) return;
  const business = h.getBusiness();
  if (!business) {
    h.onLog('Select a business first.');
    return;
  }
  const sentToday = await getSentTodayForBusiness(business.id);
  const gate = canSendNow(business, sentToday);
  if (!gate.ok) {
    h.onLog(`Waiting: ${gate.reason} (sent ${sentToday}/${gate.limit ?? business.dailySmsLimit})`);
    timer = setTimeout(() => scheduleNext(h), 60_000);
    return;
  }
  const lead = pickNextLead(h.getLeads());
  if (!lead) {
    h.onLog('No new leads to text.');
    timer = setTimeout(() => scheduleNext(h), 120_000);
    return;
  }
  const waitMs = randomDelayMs(business);
  h.onLog(`Next to ${lead.phone} in ${Math.round(waitMs / 60000)} min…`);
  timer = setTimeout(async () => {
    if (!running) return;
    try {
      const ok = await ensureSmsPermissions();
      if (!ok) {
        h.onLog('SMS permission denied — enable Send SMS in Android settings.');
        scheduleNext(h);
        return;
      }
      const body = personalizeOutbound(business, lead);
      await sendSmsNative(lead.phone, body);
      await bumpCount(business.id);
      try {
        await reportDeviceSent(business.id, lead.id, lead.phone, body);
      } catch {
        /* server optional */
      }
      await h.upsertLead({
        ...lead,
        status: 'texted',
        lastContactAt: new Date().toISOString(),
      });
      h.onLog(`Sent to ${lead.phone}`);
    } catch (e) {
      h.onLog(`Send failed: ${e}`);
    }
    scheduleNext(h);
  }, waitMs);
}

export async function startAutomation(h: Handlers) {
  if (running) return;
  running = true;
  await AsyncStorage.setItem(RUNNING_KEY, '1');
  h.onLog('Automation started — keep app open & screen on.');
  unsubSms = subscribeInbound(async ({ from, body }) => {
    await handleInbound(h, from, body);
  });
  pollTimer = setInterval(async () => {
    if (!running) return;
    const batch = await pollInbound();
    for (const msg of batch) {
      await handleInbound(h, msg.from, msg.body);
    }
  }, 12_000);
  scheduleNext(h);
}

export async function stopAutomation() {
  running = false;
  if (timer) clearTimeout(timer);
  timer = null;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  unsubSms?.();
  unsubSms = null;
  seenInbound.clear();
  await AsyncStorage.setItem(RUNNING_KEY, '0');
}

export async function isAutomationRunning() {
  return (await AsyncStorage.getItem(RUNNING_KEY)) === '1';
}

export function automationIsActive() {
  return running;
}

/** Send one outbound SMS now (test / manual). */
export async function sendNextLeadNow(h: Handlers) {
  const business = h.getBusiness();
  if (!business) throw new Error('Select MacroREI first.');
  const lead = pickNextLead(h.getLeads());
  if (!lead) throw new Error('No new leads with phone + property address.');
  const ok = await ensureSmsPermissions();
  if (!ok) throw new Error('SMS permission denied.');
  const body = personalizeOutbound(business, lead);
  await sendSmsNative(lead.phone, body);
  await bumpCount(business.id);
  try {
    await reportDeviceSent(business.id, lead.id, lead.phone, body);
  } catch {
    /* optional */
  }
  await h.upsertLead({ ...lead, status: 'texted', lastContactAt: new Date().toISOString() });
  h.onLog(`Sent now → ${lead.phone}`);
  return { lead, body };
}
