#!/usr/bin/env node
/**
 * Resolve Wikimedia image URLs for plant library entries via Wikipedia + Commons APIs.
 * Writes src/lib/oregonPlantMedicine/plantImageManifest.ts
 *
 * Run: node scripts/resolve-plant-wiki-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UA = 'AiBhive-PlantLibrary/1.0 (educational; contact: aibhive.com)';

const SOURCE_FILES = [
  'src/lib/oregonPlantMedicine/plantLibrary.ts',
  'src/lib/oregonPlantMedicine/plantLibraryEdiblePlants.ts',
  'src/lib/oregonPlantMedicine/plantLibraryEdibleMushrooms.ts',
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseEntries(filePath) {
  const content = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  const entries = [];
  const re = /id:\s*'([^']+)'[\s\S]*?scientificName:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(content))) {
    entries.push({ id: m[1], scientificName: m[2].replace(/ group$/, '') });
  }
  return entries;
}

function toLargeThumb(url) {
  if (!url) return null;
  return url.replace(/\/(\d+)px-/, '/960px-');
}

function commonsFileUrl(fileTitle) {
  const name = fileTitle.replace(/^File:/, '');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=960`;
}

function normalizeResolvedUrl(url) {
  if (!url) return null;
  if (url.includes('commons.wikimedia.org/wiki/Special:FilePath')) return url;
  const thumb = url.match(/\/commons\/thumb\/(?:[^/]+\/){2}([^/]+)\/\d+px-/i);
  if (thumb?.[1]) return commonsFileUrl(decodeURIComponent(thumb[1]));
  return url;
}

async function fetchJson(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      await sleep(3000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited');
}

async function wikipediaSummaryThumb(scientificName) {
  try {
    const j = await fetchJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`,
    );
    return toLargeThumb(j.thumbnail?.source ?? null);
  } catch {
    return null;
  }
}

async function wikipediaPageImages(scientificName) {
  const params = new URLSearchParams({
    action: 'query',
    titles: scientificName,
    prop: 'pageimages|images',
    piprop: 'thumbnail',
    pithumbsize: '960',
    format: 'json',
    origin: '*',
  });
  try {
    const j = await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`);
    const page = Object.values(j.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined) return [];

    const urls = [];
    if (page.thumbnail?.source) urls.push(toLargeThumb(page.thumbnail.source));
    for (const img of (page.images ?? []).slice(0, 12)) {
      const title = img.title || '';
      if (!/^File:/i.test(title)) continue;
      if (/icon|logo|svg|map|range|distribution|diagram|chart/i.test(title)) continue;
      urls.push(commonsFileUrl(title));
    }
    return [...new Set(urls)];
  } catch {
    return [];
  }
}

async function commonsSearchImages(scientificName) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `"${scientificName}"`,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '960',
    format: 'json',
    origin: '*',
  });
  try {
    const j = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
    const pages = j.query?.pages ?? {};
    return [...new Set(
      Object.values(pages)
        .map((p) => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url)
        .filter(Boolean)
        .map(toLargeThumb),
    )];
  } catch {
    return [];
  }
}

async function resolveEntry({ id, scientificName }) {
  const summary = await wikipediaSummaryThumb(scientificName);
  await sleep(200);
  const wiki = await wikipediaPageImages(scientificName);
  await sleep(300);
  const commons = await commonsSearchImages(scientificName);

  const pool = [...new Set([summary, ...wiki, ...commons].filter(Boolean))];
  if (pool.length === 0) {
    console.warn(`  ✗ ${id} — no images for ${scientificName}`);
    return null;
  }

  while (pool.length < 3) pool.push(pool[pool.length - 1]);

  return {
    id,
    imageUrl: normalizeResolvedUrl(pool[0]),
    imageCredit: `Wikimedia Commons — ${scientificName}`,
    additionalImages: [
      { url: normalizeResolvedUrl(pool[1]), credit: `Wikimedia Commons — ${scientificName}`, caption: 'Habitat & growth habit' },
      { url: normalizeResolvedUrl(pool[2]), credit: `Wikimedia Commons — ${scientificName}`, caption: 'Flowers, fruit, or ID detail' },
    ],
  };
}

async function main() {
  const all = SOURCE_FILES.flatMap(parseEntries);
  const unique = [...new Map(all.map((e) => [e.id, e])).values()];
  console.log(`Resolving ${unique.length} plant/mushroom image sets…\n`);

  const manifest = {};
  for (const entry of unique) {
    process.stdout.write(`${entry.id}… `);
    const resolved = await resolveEntry(entry);
    if (resolved) {
      manifest[entry.id] = {
        imageUrl: resolved.imageUrl,
        imageCredit: resolved.imageCredit,
        additionalImages: resolved.additionalImages,
      };
      console.log('ok');
    }
    await sleep(500);
  }

  const out = `/** Auto-generated by scripts/resolve-plant-wiki-images.mjs — do not edit by hand. */
import type { PlantImage } from './types';

export type PlantImageSet = {
  imageUrl: string;
  imageCredit: string;
  additionalImages: PlantImage[];
};

export const PLANT_IMAGE_MANIFEST: Record<string, PlantImageSet> = ${JSON.stringify(manifest, null, 2)};
`;

  const dest = path.join(ROOT, 'src/lib/oregonPlantMedicine/plantImageManifest.ts');
  fs.writeFileSync(dest, out);
  console.log(`\nWrote ${Object.keys(manifest).length} entries → ${dest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
