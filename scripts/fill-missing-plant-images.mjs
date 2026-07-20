#!/usr/bin/env node
/**
 * Fill missing {id}-2.jpg and {id}-3.jpg using Wikimedia Commons search by scientific name.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/oregon-plant-medicine');
const UA = 'AiBhive-OregonPlantMedicine/1.0 (educational)';

/** @type {{ id: string, search: string }[]} */
const SPECIES = [
  { id: 'oregon-grape', search: 'Mahonia aquifolium' },
  { id: 'salmonberry', search: 'Rubus spectabilis' },
  { id: 'salal', search: 'Gaultheria shallon' },
  { id: 'miners-lettuce', search: 'Claytonia perfoliata' },
  { id: 'yarrow', search: 'Achillea millefolium' },
  { id: 'plantain', search: 'Plantago major' },
  { id: 'red-clover', search: 'Trifolium pratense' },
  { id: 'elderberry', search: 'Sambucus cerulea' },
  { id: 'fireweed', search: 'Chamerion angustifolium' },
  { id: 'licorice-fern', search: 'Polypodium glycyrrhiza' },
  { id: 'redwood-sorrel', search: 'Oxalis oregana' },
  { id: 'huckleberry', search: 'Vaccinium ovatum' },
  { id: 'cottonwood', search: 'Populus trichocarpa' },
  { id: 'willow', search: 'Salix lucida' },
  { id: 'self-heal', search: 'Prunella vulgaris' },
  { id: 'cleavers', search: 'Galium aparine' },
  { id: 'usnea', search: 'Usnea' },
  { id: 'turkey-tail', search: 'Trametes versicolor' },
  { id: 'chanterelle', search: 'Cantharellus formosus' },
  { id: 'beach-strawberry', search: 'Fragaria chiloensis' },
  { id: 'douglas-fir-tip', search: 'Pseudotsuga menziesii' },
  { id: 'nootka-rose', search: 'Rosa nutkana' },
  { id: 'horsetail', search: 'Equisetum arvense' },
  { id: 'psilocybe-cyanescens', search: 'Psilocybe cyanescens' },
  { id: 'psilocybe-azurescens', search: 'Psilocybe azurescens' },
  { id: 'gymnopilus-spectabilis', search: 'Gymnopilus spectabilis' },
  { id: 'amanita-muscaria', search: 'Amanita muscaria' },
  { id: 'panaeolus-cinctulus', search: 'Panaeolus cinctulus' },
  { id: 'datura-stramonium', search: 'Datura stramonium' },
  { id: 'psilocybe-semilanceata', search: 'Psilocybe semilanceata' },
  { id: 'amanita-pantherina', search: 'Amanita pantherina' },
  { id: 'thimbleberry', search: 'Rubus parviflorus' },
  { id: 'trailing-blackberry', search: 'Rubus ursinus' },
  { id: 'red-huckleberry', search: 'Vaccinium parvifolium' },
  { id: 'serviceberry', search: 'Amelanchier alnifolia' },
  { id: 'chickweed', search: 'Stellaria media' },
  { id: 'lambs-quarters', search: 'Chenopodium album' },
  { id: 'wild-mint', search: 'Mentha arvensis' },
  { id: 'cattail', search: 'Typha latifolia' },
  { id: 'pacific-crabapple', search: 'Malus fusca' },
  { id: 'morel', search: 'Morchella esculenta' },
  { id: 'purslane', search: 'Portulaca oleracea' },
  { id: 'burdock', search: 'Arctium minus' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchImages(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '960',
    format: 'json',
    origin: '*',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Object.values(data.query?.pages ?? {})
    .map((p) => p.imageinfo?.[0]?.thumburl)
    .filter(Boolean);
}

async function download(url, dest) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (res.status === 429) {
      await sleep(10000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8000) throw new Error('too small');
    fs.writeFileSync(dest, buf);
    return buf.length;
  }
  throw new Error('rate limited');
}

function missingSlots(id) {
  const slots = [];
  for (const suffix of ['-2', '-3']) {
    const file = path.join(OUT_DIR, `${id}${suffix}.jpg`);
    if (!fs.existsSync(file) || fs.statSync(file).size < 12000) slots.push(suffix);
  }
  return slots;
}

async function main() {
  for (const { id, search } of SPECIES) {
    const slots = missingSlots(id);
    if (!slots.length) {
      console.log(`${id}: complete`);
      continue;
    }
    console.log(`${id}: need ${slots.join(', ')}`);
    const urls = await searchImages(search);
    await sleep(5000);
    let urlIndex = 0;
    for (const suffix of slots) {
      while (urlIndex < urls.length) {
        const url = urls[urlIndex++];
        try {
          const dest = path.join(OUT_DIR, `${id}${suffix}.jpg`);
          const bytes = await download(url, dest);
          console.log(`  ✓ ${id}${suffix}.jpg (${Math.round(bytes / 1024)} KB)`);
          await sleep(5000);
          break;
        } catch (e) {
          console.warn(`  skip url: ${e.message}`);
        }
      }
    }
  }
}

main().catch(console.error);
