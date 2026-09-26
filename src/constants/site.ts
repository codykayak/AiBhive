/** Canonical public site URL — must match production domain. */
export const SITE_URL = 'https://aibhive.com';

export const SITE_NAME = 'AiBhive';

/** Homepage hero + default meta description — property, real estate, operations (not an app builder). */
export const SITE_TAGLINE =
  'AiBhive deploys autonomous AI agents for property, real estate, and operations—multifamily resident and leasing automation, investor speed-to-lead, missed-call SMS, field service intelligence, and enterprise workflows that keep revenue moving after hours.';

/** Default Open Graph / Twitter share image (absolute URL). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const DEFAULT_SEO = {
  title: 'AiBhive — AI Agents for Property, Real Estate & Operations',
  description: SITE_TAGLINE,
  keywords:
    'AiBhive, real estate AI automation, property management AI, multifamily AI, ManyDoors AI, lead generation agents, phone SMS automation, MacroREI, field service AI, AiBhive Pros, enterprise agentic AI, digital employees, workflow automation',
} as const;

/** Legacy share titles — used to detect stale prerender / duplicate shell meta. */
export const LEGACY_APP_FACTORY_OG_MARKERS = ['AI App Factory', 'Community Apps & Enterprise Agentic AI'] as const;

export const ORGANIZATION_SCHEMA = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
  logo: `${SITE_URL}/favicon.svg`,
  sameAs: ['https://github.com/codykayak/AiBhive'] as string[],
} as const;
