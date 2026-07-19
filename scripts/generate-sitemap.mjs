#!/usr/bin/env node
/**
 * Regenerate public/sitemap.xml from known public routes.
 * Run: node scripts/generate-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SITE = 'https://aibhive.com';
const lastmod = new Date().toISOString().slice(0, 10);

const communalTopics = [
  'hieroglyphics', 'cuneiform', 'mud-flood', 'tartarian', 'orphan-trains', 'legal-research',
  'homeopathic', 'mycology', 'quantum', 'world-fairs', 'star-forts', 'ancient-maps', 'botanicals',
  'medical-holistic', 'academia', 'translation', 'cathedral', 'free-energy', 'giants',
  'sound-healing', 'alchemy', 'ley-lines', 'nag-hammadi',
];

const prosTrades = ['hvac', 'property', 'pool', 'electrical', 'plumbing', 'fiber'];

const appTopics = ['automated-social-media', 'phone-intelligence', 'lead-generation', 'productivity'];

const hiveDemoRunners = [
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

/** @type {{ loc: string, priority: string, changefreq: string }[]} */
const entries = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/app', priority: '0.95', changefreq: 'weekly' },
  { loc: '/app/research', priority: '0.88', changefreq: 'weekly' },
  ...appTopics.map((s) => ({ loc: `/app/${s}`, priority: '0.85', changefreq: 'monthly' })),
  { loc: '/hive-apps', priority: '0.95', changefreq: 'weekly' },
  { loc: '/hive-apps/build', priority: '0.9', changefreq: 'weekly' },
  { loc: '/research-lab', priority: '0.95', changefreq: 'weekly' },
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
  ...hiveDemoRunners.map((id) => ({
    loc: `/hive-apps/run/${id}`,
    priority: '0.85',
    changefreq: 'weekly',
  })),
  { loc: '/get-started', priority: '0.9', changefreq: 'monthly' },
  { loc: '/book-consultation', priority: '0.9', changefreq: 'monthly' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/faq', priority: '0.8', changefreq: 'monthly' },
  { loc: '/llms.txt', priority: '0.5', changefreq: 'weekly' },
  { loc: '/llms-full.txt', priority: '0.5', changefreq: 'weekly' },
  { loc: '/privacy-policy.html', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms-of-service.html', priority: '0.3', changefreq: 'yearly' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${SITE}${e.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const out = path.join(root, 'public/sitemap.xml');
fs.writeFileSync(out, xml);
console.log(`Wrote ${entries.length} URLs to ${out}`);
