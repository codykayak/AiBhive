/** Canonical public site URL — must match production domain. */
export const SITE_URL = 'https://aibhive.com';

export const SITE_NAME = 'AiBhive';

export const SITE_TAGLINE =
  'AiBhive is an AI app factory and agentic automation platform: build mobile apps, web apps, and business dashboards in plain English (Bhive Builder), browse community tools (Hive Apps), research with archive scraping and OCR (Research Lab), and deploy custom AI workflows for real estate, operations, and enterprise teams.';

/** Default Open Graph / Twitter share image (absolute URL). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const DEFAULT_SEO = {
  title: 'AiBhive — AI App Factory, Community Apps & Enterprise Agentic AI',
  description: SITE_TAGLINE,
  keywords:
    'AiBhive, Bhive Builder, AI app builder, Hive Apps, Research Lab, Living Knowledge Plants and Medicine, Fable Scrape, OCR Lab, real estate AI automation, agentic AI, no-code apps, AiBhive Pros, AiBhive Diagnose, field service AI, transcription, voice cloning, enterprise AI workflows',
} as const;

export const ORGANIZATION_SCHEMA = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
  logo: `${SITE_URL}/favicon.svg`,
  sameAs: ['https://github.com/codykayak/AiBhive'] as string[],
} as const;
