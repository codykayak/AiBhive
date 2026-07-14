import type { TradePackId } from '../../../aibhive-diagnose/lib/packs/types';
import type { DiagnoseWebAccount, DiagnoseWebJob, DiagnoseWebMessage } from './types';
import { DiagnoseAuthError, DiagnoseCreditsError } from './types';

const PACK_KEY = 'diagnose_web_pack';
const JOBS_KEY = 'diagnose_web_jobs';
const SESSION_PREFIX = 'diagnose_web_session_';

export function loadActivePackId(): TradePackId {
  const raw = localStorage.getItem(PACK_KEY);
  if (
    raw === 'pool' ||
    raw === 'electrical' ||
    raw === 'property' ||
    raw === 'plumbing' ||
    raw === 'hvac' ||
    raw === 'fiber'
  ) {
    return raw;
  }
  return 'property';
}

export function saveActivePackId(packId: TradePackId) {
  localStorage.setItem(PACK_KEY, packId);
}

export function loadJobs(): DiagnoseWebJob[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiagnoseWebJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: DiagnoseWebJob[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function sessionKey(packId: TradePackId, jobId?: string) {
  return `${SESSION_PREFIX}${packId}${jobId ? `_${jobId}` : ''}`;
}

export function loadChatSession(packId: TradePackId, jobId?: string): DiagnoseWebMessage[] {
  try {
    const raw = localStorage.getItem(sessionKey(packId, jobId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiagnoseWebMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatSession(packId: TradePackId, messages: DiagnoseWebMessage[], jobId?: string) {
  localStorage.setItem(sessionKey(packId, jobId), JSON.stringify(messages.slice(-80)));
}

export async function fetchDiagnoseAccount(idToken: string): Promise<DiagnoseWebAccount> {
  const res = await fetch('/api/diagnose-web/account', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new DiagnoseAuthError(data.error || 'Could not load account');
  const account = data.account || {};
  const usage = account.usage || {};
  return {
    hiveUserId: data.hiveUserId,
    creditBalanceUsd: Number(account.creditBalanceUsd) || 0,
    totalRemainingUsd:
      typeof usage.totalRemainingUsd === 'number' ? usage.totalRemainingUsd : Number(account.creditBalanceUsd) || 0,
    welcomeCreditUsd: Number(data.welcomeCreditUsd) || 2,
  };
}

export async function startCreditsCheckout(idToken: string, amountUsd = 10): Promise<string> {
  const res = await fetch('/api/diagnose-web/checkout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amountUsd,
      successUrl: `${window.location.origin}/diagnose/app/account?credits=added`,
      cancelUrl: `${window.location.origin}/diagnose/app/account`,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Checkout failed');
  return data.checkoutUrl as string;
}

export type ChatAttachment = {
  base64: string;
  mimeType: string;
  previewUrl: string;
};

export async function sendDiagnoseChat(opts: {
  idToken: string;
  systemPrompt: string;
  localContext: string;
  userText: string;
  packId: TradePackId;
  messages: DiagnoseWebMessage[];
  attachment?: ChatAttachment | null;
}): Promise<{
  reply: string;
  source: 'grok';
  chargedUsd?: number;
  creditBalanceUsd?: number;
}> {
  const res = await fetch('/api/diagnose-web/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt: opts.systemPrompt,
      localContext: opts.localContext,
      userText: opts.userText,
      packId: opts.packId,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      attachment: opts.attachment
        ? { base64: opts.attachment.base64, mimeType: opts.attachment.mimeType }
        : null,
    }),
  });
  const data = await res.json();
  if (res.status === 401) throw new DiagnoseAuthError(data.error);
  if (res.status === 402) {
    throw new DiagnoseCreditsError(data.error || 'Hive credits depleted', data.amountUsd);
  }
  if (!res.ok) throw new Error(data.error || 'Diagnose request failed');
  return {
    reply: data.reply,
    source: 'grok',
    chargedUsd: data.chargedUsd,
    creditBalanceUsd: data.account?.creditBalanceUsd,
  };
}

export function fileToAttachment(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve({
        base64,
        mimeType: file.type || 'image/jpeg',
        previewUrl: result,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
