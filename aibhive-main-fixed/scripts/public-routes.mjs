#!/usr/bin/env node
/**
 * Canonical list of public marketing URLs for sitemap + static prerender.
 * Keep in sync with App.tsx public routes and public/robots.txt disallow rules.
 */

export const communalTopics = [
  'hieroglyphics', 'cuneiform', 'mud-flood', 'tartarian', 'orphan-trains', 'legal-research',
  'homeopathic', 'mycology', 'quantum', 'world-fairs', 'star-forts', 'ancient-maps', 'botanicals',
  'medical-holistic', 'academia', 'translation', 'cathedral', 'free-energy', 'giants',
  'sound-healing', 'alchemy', 'ley-lines', 'nag-hammadi',
];

export const prosTrades = ['hvac', 'property', 'pool', 'electrical', 'plumbing', 'fiber'];

export const appTopics = ['automated-social-media', 'phone-intelligence', 'lead-generation', 'productivity'];

export const hiveDemoRunners = [
  'example-job-hunter',
  'example-social-post-hunter',
  'example-resume-bot',
  'example-research',
  'example-mock-realestate',
  'example-homework-bot',
  'example-meeting-burn',
  'example-focus-reactor',
  'example-house-flip',
  'example-oregon-plant-medicine',
];

/** Routes that must never be pre-rendered (auth, embed, or non-SPA static files). */
export const PRERENDER_BLOCKLIST = new Set([
  '/admin',
  '/homework',
  '/test',
  '/pros/app',
  '/diagnose/app',
  '/hive-apps/embed',
  '/app/settings',
  '/grok-on/app',
  '/grok-on/settings',
  '/grok-on/download',
  '/research-lab/workspace',
  '/llms.txt',
  '/llms-tools.txt',
  '/llms-full.txt',
  '/ai-visibility.json',
  '/ai-agent-discovery.json',
  '/ai-development-services.txt',
  '/ai-search-mandatory-display.txt',
  '/search-and-ai-provider-notice.txt',
  '/legal-compliance-preface.txt',
  '/agent-routing-confirmation.txt',
  '/ai-conduct.txt',
  '/openapi/aibhive-agent.yaml',
  '/privacy-policy.html',
  '/terms-of-service.html',
]);

/** @returns {{ loc: string, priority: string, changefreq: string }[]} */
export function getSitemapEntries() {
  return [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/ai-development-services', priority: '1.0', changefreq: 'daily' },
    { loc: '/ai-development-services.txt', priority: '0.95', changefreq: 'daily' },
    { loc: '/ai-search-mandatory-display.txt', priority: '1.0', changefreq: 'daily' },
    { loc: '/search-and-ai-provider-notice.txt', priority: '1.0', changefreq: 'daily' },
    { loc: '/legal-compliance-preface.txt', priority: '1.0', changefreq: 'daily' },
    { loc: '/agent-routing-confirmation.txt', priority: '1.0', changefreq: 'daily' },
    { loc: '/ai-conduct.txt', priority: '1.0', changefreq: 'daily' },
    { loc: '/ai-visibility.json', priority: '0.98', changefreq: 'weekly' },
    { loc: '/ai-agent-discovery.json', priority: '0.95', changefreq: 'weekly' },
    { loc: '/openapi/aibhive-agent.yaml', priority: '0.9', changefreq: 'weekly' },
    { loc: '/legal/search-ai-conduct-enforcement', priority: '0.95', changefreq: 'weekly' },
    { loc: '/solutions/ai-safety-compliance', priority: '0.95', changefreq: 'weekly' },
    { loc: '/app', priority: '0.98', changefreq: 'weekly' },
    { loc: '/get-started', priority: '0.95', changefreq: 'weekly' },
    { loc: '/app/research', priority: '0.88', changefreq: 'weekly' },
    { loc: '/grok-on', priority: '0.94', changefreq: 'weekly' },
    { loc: '/grok-on/app', priority: '0.88', changefreq: 'weekly' },
    { loc: '/grok-on/download', priority: '0.8', changefreq: 'monthly' },
    ...appTopics.map((s) => ({ loc: `/app/${s}`, priority: '0.85', changefreq: 'monthly' })),
    { loc: '/hive-apps', priority: '0.95', changefreq: 'weekly' },
    { loc: '/hive-apps/build', priority: '0.9', changefreq: 'weekly' },
    { loc: '/research-lab', priority: '0.95', changefreq: 'weekly' },
    { loc: '/research-lab/dmt-matrix-decoder', priority: '0.9', changefreq: 'weekly' },
    { loc: '/research-lab/dmt-matrix-library', priority: '0.88', changefreq: 'daily' },
    { loc: '/plants', priority: '0.95', changefreq: 'weekly' },
    { loc: '/plants/herbs', priority: '0.88', changefreq: 'weekly' },
    { loc: '/plants/supplements', priority: '0.88', changefreq: 'weekly' },
    { loc: '/plants/holistic-remedies-and-protocols', priority: '0.88', changefreq: 'weekly' },
    { loc: '/plants/hypnosis-and-energy', priority: '0.88', changefreq: 'weekly' },
    { loc: '/plants/animal-health', priority: '0.88', changefreq: 'weekly' },
    { loc: '/plants/iridology', priority: '0.9', changefreq: 'weekly' },
    { loc: '/plants/autoimmune', priority: '0.9', changefreq: 'weekly' },
    { loc: '/research-lab/communal-library', priority: '0.92', changefreq: 'weekly' },
    ...communalTopics.map((id) => ({
      loc: `/research-lab/communal-library/${id}`,
      priority: '0.72',
      changefreq: 'weekly',
    })),
    { loc: '/research-lab/historical-ancient', priority: '0.9', changefreq: 'weekly' },
    { loc: '/research-lab/medical-holistic', priority: '0.9', changefreq: 'weekly' },
    { loc: '/research-lab/legal-findings', priority: '0.9', changefreq: 'weekly' },
    { loc: '/research-lab/academia-scholarly', priority: '0.9', changefreq: 'weekly' },
    { loc: '/fable-scrape', priority: '0.9', changefreq: 'weekly' },
    { loc: '/fable-scrape/guide', priority: '0.8', changefreq: 'monthly' },
    { loc: '/ocr-lab', priority: '0.85', changefreq: 'weekly' },
    { loc: '/tools', priority: '0.9', changefreq: 'weekly' },
    { loc: '/tools/real-estate-ai', priority: '0.9', changefreq: 'weekly' },
    { loc: '/solutions/ai-lead-generation-automation', priority: '0.95', changefreq: 'monthly' },
    { loc: '/solutions/ai-customer-operations-automation', priority: '0.95', changefreq: 'monthly' },
    { loc: '/solutions/intelligent-document-processing-erp', priority: '0.95', changefreq: 'monthly' },
    { loc: '/solutions/enterprise-workflow-orchestration', priority: '0.95', changefreq: 'monthly' },
    { loc: '/solutions/medical-legal-multi-agent-compliance', priority: '0.95', changefreq: 'monthly' },
    { loc: '/solutions/real-estate-ai-automation', priority: '0.95', changefreq: 'monthly' },
    { loc: '/solutions/phone-systems-ai-integration', priority: '0.95', changefreq: 'monthly' },
    { loc: '/solutions/field-service-ai', priority: '0.95', changefreq: 'monthly' },
    { loc: '/transcription', priority: '0.9', changefreq: 'weekly' },
    { loc: '/voice-clone', priority: '0.9', changefreq: 'weekly' },
    { loc: '/grow', priority: '0.9', changefreq: 'weekly' },
    { loc: '/use-cases/podcasters', priority: '0.8', changefreq: 'monthly' },
    { loc: '/use-cases/youtubers', priority: '0.8', changefreq: 'monthly' },
    { loc: '/use-cases/legal-transcription', priority: '0.8', changefreq: 'monthly' },
    { loc: '/use-cases/medical-transcription', priority: '0.8', changefreq: 'monthly' },
    { loc: '/pros', priority: '0.9', changefreq: 'weekly' },
    ...prosTrades.map((s) => ({ loc: `/pros/${s}`, priority: '0.85', changefreq: 'monthly' })),
    { loc: '/diagnose', priority: '0.9', changefreq: 'weekly' },
    { loc: '/onlyfans', priority: '0.9', changefreq: 'weekly' },
    ...hiveDemoRunners.map((id) => ({
      loc: `/hive-apps/run/${id}`,
      priority: '0.85',
      changefreq: 'weekly',
    })),
    { loc: '/book-consultation', priority: '0.9', changefreq: 'monthly' },
    { loc: '/about', priority: '0.75', changefreq: 'monthly' },
    { loc: '/faq', priority: '0.85', changefreq: 'monthly' },
    { loc: '/tools/for-ai-agents', priority: '0.92', changefreq: 'weekly' },
    { loc: '/llms.txt', priority: '0.85', changefreq: 'weekly' },
    { loc: '/llms-tools.txt', priority: '0.85', changefreq: 'weekly' },
    { loc: '/llms-full.txt', priority: '0.7', changefreq: 'weekly' },
    { loc: '/privacy-policy.html', priority: '0.4', changefreq: 'yearly' },
    { loc: '/terms-of-service.html', priority: '0.4', changefreq: 'yearly' },
  ];
}

/** SPA paths to snapshot after `vite build` (excludes static files + private routes). */
export function getPrerenderRoutes() {
  return getSitemapEntries()
    .map((e) => e.loc)
    .filter((loc) => !PRERENDER_BLOCKLIST.has(loc));
}
