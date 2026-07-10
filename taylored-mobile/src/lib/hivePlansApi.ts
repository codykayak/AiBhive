import * as WebBrowser from 'expo-web-browser';
import { getOrCreateHiveUserId } from './hiveApi';

const HIVE_API_BASE = 'https://aibhive.com';

export type HivePlan = {
  id: string;
  name: string;
  priceUsd: number;
  interval: string | null;
  tagline: string;
  highlights: string[];
  monthlyAllowanceUsd: number;
  creditOnPurchaseUsd: number;
};

export async function fetchHivePlans(): Promise<{ plans: HivePlan[]; currencyName?: string } | null> {
  try {
    const res = await fetch(`${HIVE_API_BASE}/api/hive/plans`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function openPlanCheckout(planId: string): Promise<boolean> {
  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(
      `${HIVE_API_BASE}/api/hive/account/${encodeURIComponent(userId)}/plan-checkout`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      }
    );
    const data = await res.json();
    if (data.checkoutUrl) {
      await WebBrowser.openBrowserAsync(data.checkoutUrl);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
