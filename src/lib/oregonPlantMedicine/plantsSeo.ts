import {
  AIBHIVE_PLANTS_APP_NAME,
  LIVING_KNOWLEDGE_SEO_DESCRIPTION,
  PLANTS_APK_DOWNLOAD_URL,
  PLANTS_PUBLIC_PATH,
} from './branding';

/** Shared WebApplication node for all /plants routes. */
export function plantsWebAppJsonLd(): Record<string, unknown> {
  return {
    '@type': 'WebApplication',
    name: AIBHIVE_PLANTS_APP_NAME,
    alternateName: 'AiBhive Plant ID and Holistic Remedies',
    description: LIVING_KNOWLEDGE_SEO_DESCRIPTION,
    url: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
    applicationCategory: 'ReferenceApplication',
    operatingSystem: 'Web, Android',
    browserRequirements: 'Requires JavaScript',
    provider: { '@type': 'Organization', name: 'AiBhive', url: 'https://aibhive.com' },
  };
}

/** Android APK — SoftwareApplication for search and AI crawlers. */
export function plantsMobileAppJsonLd(): Record<string, unknown> {
  return {
    '@type': 'SoftwareApplication',
    name: AIBHIVE_PLANTS_APP_NAME,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Android',
    downloadUrl: PLANTS_APK_DOWNLOAD_URL,
    installUrl: PLANTS_APK_DOWNLOAD_URL,
    url: PLANTS_APK_DOWNLOAD_URL,
    description:
      'Free Android app for Pacific Northwest wild plant ID, foraging field guide, holistic remedies, herbs, supplements, and community posts. Google Play listing pending — direct APK install.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: { '@type': 'Organization', name: 'AiBhive', url: 'https://aibhive.com' },
  };
}

export function plantsBreadcrumbJsonLd(
  crumbs: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aibhive.com/' },
      ...crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: crumb.name,
        item: `https://aibhive.com${crumb.path}`,
      })),
    ],
  };
}

/** JSON-LD bundle for a /plants sub-route (topic library tab). */
export function plantsTopicPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
}): Record<string, unknown>[] {
  return [
    {
      '@type': 'WebPage',
      name: opts.name,
      description: opts.description,
      url: `https://aibhive.com${opts.path}`,
      isPartOf: plantsWebAppJsonLd(),
    },
    plantsBreadcrumbJsonLd([
      { name: AIBHIVE_PLANTS_APP_NAME, path: PLANTS_PUBLIC_PATH },
      { name: opts.name, path: opts.path },
    ]),
    plantsMobileAppJsonLd(),
  ];
}

/** Full JSON-LD bundle for the /plants home route. */
export function plantsHomeJsonLd(): Record<string, unknown>[] {
  return [
    plantsWebAppJsonLd(),
    plantsMobileAppJsonLd(),
    plantsBreadcrumbJsonLd([{ name: AIBHIVE_PLANTS_APP_NAME, path: PLANTS_PUBLIC_PATH }]),
  ];
}
