/**
 * Platform app catalog — "Old Tartar Research" listed under Apps.
 * User custom builds appear alongside when signed in.
 */

export const PLATFORM_APPS = [
  {
    id: 'old_tartar_research',
    name: 'Old Tartar Research',
    slug: 'old-tartar-research',
    description:
      'Historical anomaly detection for architects, builders, authors, and organizations (18th–early 20th century). ' +
      'Ingest archives, extract mentions, and flag statistically unusual output patterns.',
    route: '/',
    icon: 'compass',
    category: 'research',
    status: 'beta',
    features: [
      'Flexible entity extraction',
      'Multi-source archive ingestion',
      'Anomaly detection engine',
      'Grok, Gemini & Kimi AI support',
      'Custom research builds',
    ],
    requiredAuth: true,
    defaultEnabled: true,
  },
];

export function getPlatformApp(id) {
  return PLATFORM_APPS.find((a) => a.id === id) ?? null;
}

/**
 * Merge platform apps with user's custom build (visible only when logged in).
 * @param {import('./schema.js').TartarCustomBuild|null} customBuild
 * @param {Record<string, boolean>|null} enabledApps
 */
export function listAppsForUser(customBuild, enabledApps = {}) {
  const platform = PLATFORM_APPS.map((app) => ({
    ...app,
    isCustom: false,
    enabled: enabledApps[app.id] !== false && app.defaultEnabled !== false,
  }));

  if (!customBuild) return platform;

  const custom = {
    id: 'custom_build',
    name: customBuild.name || 'My Research Build',
    slug: 'custom',
    description: customBuild.description || 'Your personalized research configuration.',
    route: '/build',
    icon: 'star',
    category: 'custom',
    status: 'personal',
    isCustom: true,
    enabled: true,
    features: [
      `${customBuild.enabledSourceIds?.length ?? 0} sources`,
      `${customBuild.enabledEntityTypes?.length ?? 0} entity types`,
    ],
  };

  return [...platform, custom];
}
