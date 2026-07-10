/**
 * AiBhive subscription plans and Hive credit pricing.
 * Internal TOKEN_MARKUP applies server-side; never surface markup language to users.
 */

/** Internal multiplier for Hive-metered usage (not shown to users) */
export const TOKEN_MARKUP = Number(process.env.HIVE_TOKEN_MARKUP ?? 1.3);

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
    tagline: 'Explore on-device tools and bring your own AI keys.',
    highlights: [
      'Browse Research Lab guides and community demos',
      'On-device OSINT (DNS, certs, tech stack, dorks)',
      'Job tracker & resume tools',
      'Build & chat with your own API keys (BYOK)',
      'Publish discoveries to the community library when signed in',
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
    tagline: 'Pay as you go — 5 Hive credits to run Research Lab tools immediately.',
    highlights: [
      'Everything in Free',
      '5 Hive credits (1 credit ≈ $1 of platform AI & processing)',
      'Fable Scrape, OCR, translation & Grok analysis',
      'Hive Cloud search (Firecrawl / SerpAPI) when you need it',
      'Full usage tracking in your account',
      'Publish findings to the communal research library',
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
    tagline: 'Best for active researchers — monthly Hive credits that renew.',
    highlights: [
      'Everything in Starter',
      '$20/mo Hive credit allowance that renews each month',
      'Priority Research Lab capacity for scrapes & OCR batches',
      'Hive Cloud intel included in your monthly pool',
      'Ideal for weekly archive digs and multi-agent harvests',
      'Publish & remix community library sources at scale',
      'Additional usage billed in Hive credits when you exceed the pool',
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
    tagline: 'Power users & labs — the largest monthly Hive credit pool.',
    highlights: [
      'Everything in Pro',
      '$75/mo Hive credit allowance for heavy research pipelines',
      'Built for teams, dissertations, and multi-domain investigations',
      'Custom tool builds can draw from your monthly pool',
      'Highest fair-use headroom for start-to-finish agent stacks',
      'Community library publishing for shared scholarly corpora',
      'Additional usage billed in Hive credits beyond the pool',
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
