#!/usr/bin/env node
/**
 * Regenerate public/sitemap.xml from known public routes.
 * Run: node scripts/generate-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSitemapEntries } from './public-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SITE = 'https://aibhive.com';
const lastmod = new Date().toISOString().slice(0, 10);

const entries = getSitemapEntries();

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
