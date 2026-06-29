/** Canonical public site URL — must match production domain. */
export const SITE_URL = 'https://aibhive.com';

export const SITE_NAME = 'AiBhive';

export const SITE_TAGLINE =
  'AiBhive is an AI app factory and agentic automation platform: build mobile apps, web apps, and business dashboards in plain English (Bhive Builder), browse community tools, and deploy custom AI workflows for real estate, operations, and enterprise teams.';

export const DEFAULT_SEO = {
  title: 'AiBhive — AI App Factory, Community Apps & Enterprise Agentic AI',
  description: SITE_TAGLINE,
  keywords:
    'AiBhive, Bhive Builder, AI app builder, real estate AI automation, no-code apps, agentic AI, Hive Apps, community app pool, enterprise AI workflows',
} as const;

export const ORGANIZATION_SCHEMA = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
  logo: `${SITE_URL}/favicon.svg`,
} as const;
