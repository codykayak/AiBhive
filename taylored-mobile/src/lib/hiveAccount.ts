import * as WebBrowser from 'expo-web-browser';
import { getOrCreateHiveUserId } from './hiveApi';

const HIVE_API_BASE = 'https://aibhive.com';

export type UsageBudget = {
  planId: string;
  planName: string;
  monthlyAllowanceUsd: number;
  monthlyUsageUsd: number;
  allowanceRemainingUsd: number;
  creditBalanceUsd: number;
  totalRemainingUsd: number;
  softCapUsd: number;
  lifetimeUsageUsd: number;
  periodStart: string | null;
  periodEnd: string | null;
};

export type HiveAccount = {
  userId: string;
  planId?: string;
  creditBalanceUsd: number;
  totalSpentUsd: number;
  buildCount: number;
  monthlyUsageUsd?: number;
  monthlyAllowanceUsd?: number;
  lifetimeUsageUsd?: number;
  usage?: UsageBudget;
  recentActivity: Array<{
    id: string;
    type: string;
    amountUsd: number;
    summary: string;
    createdAt: string;
  }>;
};

export type PaywallResult =
  | { ok: true; creditBalanceUsd: number }
  | { ok: false; needPayment: true; amountUsd: number; checkoutUrl?: string };

export async function fetchHiveAccount(): Promise<HiveAccount | null> {
  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/account/${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.account as HiveAccount;
  } catch {
    return null;
  }
}

/** Ensure user can pay for build; opens Stripe checkout if needed. */
export async function ensureCreditsForTask(
  taskId: string,
  amountUsd: number
): Promise<PaywallResult> {
  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/tasks/${taskId}/prepare-pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amountUsd }),
    });
    const data = await res.json();
    if (res.ok && data.ready) {
      return { ok: true, creditBalanceUsd: data.creditBalanceUsd ?? 0 };
    }
    if (data.checkoutUrl) {
      await WebBrowser.openBrowserAsync(data.checkoutUrl);
      return { ok: false, needPayment: true, amountUsd, checkoutUrl: data.checkoutUrl };
    }
    return { ok: false, needPayment: true, amountUsd };
  } catch {
    // Server not deployed yet — allow approve (legacy)
    return { ok: true, creditBalanceUsd: 0 };
  }
}

export async function openAddCredits(amountUsd = 10): Promise<void> {
  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/account/${encodeURIComponent(userId)}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUsd }),
    });
    const data = await res.json();
    if (data.checkoutUrl) await WebBrowser.openBrowserAsync(data.checkoutUrl);
  } catch {
    // ignore
  }
}
