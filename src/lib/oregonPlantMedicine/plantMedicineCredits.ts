import { getOrCreateWebHiveUserId } from '../hiveWebUser';
import { MIN_RECHARGE_USD } from './branding';

export async function startLivingKnowledgeCreditsCheckout(
  amountUsd = MIN_RECHARGE_USD,
): Promise<string> {
  const userId = getOrCreateWebHiveUserId();
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://aibhive.com/hive-apps/run/example-oregon-plant-medicine';

  const res = await fetch(`/api/hive/account/${encodeURIComponent(userId)}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amountUsd,
      successUrl: `${base}?credits=added`,
      cancelUrl: base,
    }),
  });

  const data = (await res.json()) as { checkoutUrl?: string; error?: string };
  if (!res.ok || !data.checkoutUrl) {
    throw new Error(data.error || 'Could not start checkout');
  }
  return data.checkoutUrl;
}
