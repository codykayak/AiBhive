/**
 * AiBhive subscription plans and token pricing.
 * Token usage is billed at raw API cost × TOKEN_MARKUP (20% markup = 1.2×).
 */

/** 20% markup on all Hive-metered token/API usage */
export const TOKEN_MARKUP = Number(process.env.HIVE_TOKEN_MARKUP ?? 1.2);

export const PLAN_IDS = ['free', 'starter', 'pro', 'unlimited'];

/** Features that never consume Hive token allowance (BYOK or on-device). */
export const FREE_FEATURES = new Set([
  'osint_on_device',
  'job_tracker',
  'resume_local',
  'byok_chat',
  'byok_intel_synthesis',
  'google_dorks_browser',
  'toolkit_browse',
]);

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceUsd: 0,
    interval: null,
    creditOnPurchaseUsd: 0,
    monthlyAllowanceUsd: 0,
    softCapUsd: 0,
    tagline: 'Do, build & research on-device. Bring your own AI keys.',
    highlights: [
      'Job tracker & resume tools',
      'On-device OSINT (DNS, certs, tech stack, dorks)',
      'Build & chat with your own API keys',
      'No Hive token charges',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceUsd: 5,
    interval: 'once',
    creditOnPurchaseUsd: 5,
    monthlyAllowanceUsd: 0,
    softCapUsd: 5,
    tagline: '$5 credit pool — tracked usage, Hive Cloud & AI when you need it.',
    highlights: [
      'Everything in Free',
      '$5 Hive credit (pay-as-you-go)',
      'Full usage tracking in app',
      'Hive Cloud intel (Firecrawl / SerpAPI)',
      'Token usage at cost + 20%',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceUsd: 20,
    interval: 'month',
    creditOnPurchaseUsd: 0,
    monthlyAllowanceUsd: 20,
    softCapUsd: 25,
    tagline: '$20/month — generous AI & cloud research allowance.',
    highlights: [
      'Everything in Free',
      '$20/mo marked-up token allowance',
      'Hive Cloud intel included',
      'Priority builds & usage dashboard',
      'Overage at cost + 20%',
    ],
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    priceUsd: 50,
    interval: 'month',
    creditOnPurchaseUsd: 0,
    monthlyAllowanceUsd: 75,
    softCapUsd: 120,
    tagline: '$50/month — nearly unlimited for power users.',
    highlights: [
      'Everything in Pro',
      '$75/mo marked-up allowance (fair-use ~$120)',
      'Best for teams & heavy research',
      'Custom tool builds included in allowance',
      'Overage at cost + 20%',
    ],
  },
};

export function getPlan(planId) {
  return PLANS[planId] ?? PLANS.free;
}

export function applyTokenMarkup(rawCostUsd) {
  const raw = Math.max(0, Number(rawCostUsd) || 0);
  if (raw === 0) return 0;
  return Math.round(raw * TOKEN_MARKUP * 10000) / 10000;
}

export function listPlansForClient() {
  return PLAN_IDS.map((id) => {
    const p = PLANS[id];
    return {
      id: p.id,
      name: p.name,
      priceUsd: p.priceUsd,
      interval: p.interval,
      tagline: p.tagline,
      highlights: p.highlights,
      monthlyAllowanceUsd: p.monthlyAllowanceUsd,
      creditOnPurchaseUsd: p.creditOnPurchaseUsd,
    };
  });
}

export function isFreeFeature(featureId) {
  return FREE_FEATURES.has(featureId);
}

export function computeUsageBudget(user) {
  const plan = getPlan(user.planId ?? 'free');
  const allowance = Number(user.monthlyAllowanceUsd ?? plan.monthlyAllowanceUsd) || 0;
  const used = Number(user.monthlyUsageUsd) || 0;
  const allowanceRemaining = Math.max(0, allowance - used);
  const credits = Number(user.creditBalanceUsd) || 0;
  return {
    planId: plan.id,
    planName: plan.name,
    monthlyAllowanceUsd: allowance,
    monthlyUsageUsd: used,
    allowanceRemainingUsd: allowanceRemaining,
    creditBalanceUsd: credits,
    totalRemainingUsd: allowanceRemaining + credits,
    softCapUsd: plan.softCapUsd,
    lifetimeUsageUsd: Number(user.lifetimeUsageUsd) || 0,
    periodStart: user.periodStart ?? null,
    periodEnd: user.periodEnd ?? null,
  };
}
