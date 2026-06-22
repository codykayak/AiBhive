import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../autoposter/functions/config');

function readJson(name, fallback) {
  try {
    return JSON.parse(readFileSync(join(ROOT, name), 'utf8'));
  } catch {
    return fallback;
  }
}

let brandCache = null;
let topicsCache = null;
let knowledgeCache = null;

export function loadBrand() {
  if (brandCache) return brandCache;
  const file = readJson('brand.json', {});
  brandCache = {
    name: process.env.SOCIAL_BRAND_NAME || file.name || 'AiBhive',
    siteUrl: process.env.SOCIAL_SITE_URL || file.siteUrl || 'https://www.aibhive.com',
    adminBaseUrl:
      process.env.SOCIAL_ADMIN_BASE_URL || file.adminBaseUrl || 'https://www.aibhive.com/autoposter',
    colors: file.colors || {},
    voice: file.voice || 'Professional, helpful. U.S. English.',
    imageStyle: file.imageStyle || 'Modern social marketing graphic. Clean design.',
  };
  return brandCache;
}

export function loadTopics() {
  if (topicsCache) return topicsCache;
  topicsCache = readJson('topics.json', []);
  return topicsCache;
}

export function loadKnowledge() {
  if (knowledgeCache) return knowledgeCache;
  try {
    knowledgeCache = readFileSync(join(ROOT, 'knowledge.txt'), 'utf8').slice(0, 12000);
  } catch {
    knowledgeCache = `${loadBrand().name} — customize autoposter/functions/config/knowledge.txt for better captions.`;
  }
  return knowledgeCache;
}
