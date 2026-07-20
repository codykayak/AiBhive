#!/usr/bin/env node
/**
 * Download plant ID photos from Wikimedia Commons into public/oregon-plant-medicine/.
 * Skips files that already exist. Uses retries + pacing to avoid HTTP 429.
 *
 * Run: node scripts/fetch-oregon-plant-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/oregon-plant-medicine');
const UA = 'AiBhive-OregonPlantMedicine/1.0 (educational; contact: aibhive.com)';
const DELAY_MS = 4500;

/**
 * Curated Commons filenames (verified species ID photos).
 * @type {Record<string, [string, string, string]>}
 */
const MANIFEST = {
  'stinging-nettle': [
    'Urtica dioica subsp. dioica sl 12.jpg',
    'Urtica dioica Stinging Nettle (3547170639).jpg',
    'Urtica dioica - Nettle (aka) - geograph.org.uk - 1267990.jpg',
  ],
  'oregon-grape': [
    'Mahonia aquifolium qtl1.jpg',
    'Mahonia aquifolium flowers.jpg',
    'Mahonia aquifolium fruit.jpg',
  ],
  'salmonberry': [
    'Rubus spectabilis 2.jpg',
    'Salmonberry Blossom.jpg',
    'Rubus spectabilis fruit.jpg',
  ],
  salal: [
    'Gaultheria shallon A.jpg',
    'Gaultheria shallon 2.jpg',
    'Gaultheria shallon fruit.jpg',
  ],
  'miners-lettuce': [
    'Claytonia perfoliata 6641.JPG',
    'Claytonia perfoliata - Miner\'s Lettuce.jpg',
    'Claytonia perfoliata kz01.jpg',
  ],
  yarrow: [
    'Achillea millefolium 001.JPG',
    'Achillea millefolium flowers.jpg',
    'Achillea millefolium kz01.jpg',
  ],
  plantain: [
    'Plantago major subsp. major sl1.jpg',
    'Grote weegbree bloeiwijze Plantago major subsp. major.jpg',
    'Plantago major kz01.jpg',
  ],
  dandelion: [
    'Taraxacum officinale flowers.jpg',
    'Taraxacum officinale seed head.jpg',
    'Taraxacum officinale kz01.jpg',
  ],
  'red-clover': [
    'Trifolium pratense 0522.jpg',
    'Trifolium pratense flower.jpg',
    'Trifolium pratense kz01.jpg',
  ],
  elderberry: [
    'Sambucus caerulea 8012.jpg',
    'Sambucus cerulea fruit.jpg',
    'Sambucus cerulea flowers.jpg',
  ],
  fireweed: [
    'Chamerion angustifolium 2.jpg',
    'Epilobium angustifolium flower.jpg',
    'Chamerion angustifolium kz01.jpg',
  ],
  'licorice-fern': [
    'Polypodium glycyrrhiza.jpg',
    'Polypodium glycyrrhiza frond.jpg',
    'Polypodium glycyrrhiza kz01.jpg',
  ],
  'redwood-sorrel': [
    'Oxalis oregana 1.jpg',
    'Oxalis oregana flower.jpg',
    'Oxalis oregana kz01.jpg',
  ],
  huckleberry: [
    'Vaccinium ovatum 2.jpg',
    'Vaccinium ovatum fruit.jpg',
    'Vaccinium ovatum flowers.jpg',
  ],
  cottonwood: [
    'Populus trichocarpa 01.jpg',
    'Populus trichocarpa buds.jpg',
    'Populus trichocarpa leaves.jpg',
  ],
  willow: [
    'Salix lucida(01).jpg',
    'Salix lucida catkins.jpg',
    'Salix lucida leaves.jpg',
  ],
  'self-heal': [
    'Prunella vulgaris 001.JPG',
    'Prunella vulgaris flower.jpg',
    'Prunella vulgaris kz01.jpg',
  ],
  cleavers: [
    'Galium aparine 001.JPG',
    'Galium aparine flower.jpg',
    'Galium aparine kz01.jpg',
  ],
  usnea: [
    'Usnea filipendula 1.jpg',
    'Usnea longissima.jpg',
    'Usnea lichen.jpg',
  ],
  'turkey-tail': [
    'Trametes versicolor G4.jpg',
    'Trametes versicolor bracket.jpg',
    'Trametes versicolor kz01.jpg',
  ],
  chanterelle: [
    'Cantharellus formosus 435737.jpg',
    'Cantharellus formosus mushroom.jpg',
    'Cantharellus formosus kz01.jpg',
  ],
  'beach-strawberry': [
    'Fragaria chiloensis 2.jpg',
    'Fragaria chiloensis kz05.jpg',
    'Fragaria chiloensis fruit.jpg',
  ],
  'douglas-fir-tip': [
    'Pseudotsuga menziesii 28228.JPG',
    'Pseudotsuga menziesii cone.jpg',
    'Pseudotsuga menziesii needles.jpg',
  ],
  'nootka-rose': [
    'Rosa nutkana 07513.JPG',
    'Rosa nutkana flower.jpg',
    'Rosa nutkana hip.jpg',
  ],
  horsetail: [
    'Equisetum arvense 001.JPG',
    'Equisetum arvense fertile.jpg',
    'Equisetum arvense kz01.jpg',
  ],
  'psilocybe-cyanescens': [
    '2012-12-05 Psilocybe cyanescens Wakef 290262.jpg',
    'Psilocybe cyanescens 417797.jpg',
    'Psilocybe cyanescens cap.jpg',
  ],
  'psilocybe-azurescens': [
    'Psilocybe azurescens 60869.jpg',
    'Psilocybe azurescens cap.jpg',
    'Psilocybe azurescens stem.jpg',
  ],
  'gymnopilus-spectabilis': [
    'Gymnopilus junonius-02.jpg',
    'Gymnopilus spectabilis.jpg',
    'Gymnopilus junonius cap.jpg',
  ],
  'amanita-muscaria': [
    'Amanita muscaria 3 v0.1.jpg',
    'Amanita muscaria 2020 G1.jpg',
    'Amanita muscaria cap.jpg',
  ],
  'panaeolus-cinctulus': [
    'Panaeolus cinctulus.JPG',
    'Panaeolus cinctulus cap.jpg',
    'Panaeolus cinctulus gills.jpg',
  ],
  'datura-stramonium': [
    'Datura stramonium flower.jpg',
    'Datura stramonium plant.jpg',
    'Datura stramonium seed pod.jpg',
  ],
  'psilocybe-semilanceata': [
    'Psilocybe semilanceata 6514.jpg',
    'Psilocybe semilanceata cap.jpg',
    'Psilocybe semilanceata gills.jpg',
  ],
  'amanita-pantherina': [
    'Amanita pantherina 1.jpg',
    'Amanita pantherina cap.jpg',
    'Amanita pantherina stem.jpg',
  ],
  thimbleberry: [
    'Rubus parviflorus 2.jpg',
    'Rubus parviflorus flower.jpg',
    'Rubus parviflorus fruit.jpg',
  ],
  'trailing-blackberry': [
    'Rubus ursinus 1.jpg',
    'Rubus ursinus flower.jpg',
    'Rubus ursinus fruit.jpg',
  ],
  'red-huckleberry': [
    'Vaccinium parvifolium 2.jpg',
    'Vaccinium parvifolium fruit.jpg',
    'Vaccinium parvifolium flowers.jpg',
  ],
  serviceberry: [
    'Amelanchier alnifolia 2.jpg',
    'Amelanchier alnifolia fruit.jpg',
    'Amelanchier alnifolia flowers.jpg',
  ],
  chickweed: [
    'Stellaria media 001.JPG',
    'Stellaria media flower.jpg',
    'Stellaria media kz01.jpg',
  ],
  'lambs-quarters': [
    'Chenopodium album 001.JPG',
    'Chenopodium album flower.jpg',
    'Chenopodium album kz01.jpg',
  ],
  'wild-mint': [
    'Mentha arvensis 001.JPG',
    'Mentha arvensis flower.jpg',
    'Mentha arvensis kz01.jpg',
  ],
  cattail: [
    'Typha latifolia 001.JPG',
    'Typha latifolia flower.jpg',
    'Typha latifolia kz01.jpg',
  ],
  'pacific-crabapple': [
    'Malus fusca fruit.jpg',
    'Malus fusca 2.jpg',
    'Malus fusca flowers.jpg',
  ],
  morel: [
    'Morchella esculenta 1.jpg',
    'Morchella elata 83497.jpg',
    'Morchella conica 1 beentree.jpg',
  ],
  purslane: [
    'Portulaca oleracea 001.JPG',
    'Portulaca oleracea flower.jpg',
    'Portulaca oleracea kz01.jpg',
  ],
  burdock: [
    'Arctium minus 001.JPG',
    'Arctium minus flower.jpg',
    'Arctium minus kz01.jpg',
  ],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function outName(id, index) {
  return index === 0 ? `${id}.jpg` : `${id}-${index + 1}.jpg`;
}

function commonsUrl(fileName) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=960`;
}

async function downloadWithRetry(url, dest, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (res.status === 429) {
      const wait = 8000 * (i + 1);
      console.warn(`    rate limited — waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8000) throw new Error(`file too small (${buf.length} bytes)`);
    fs.writeFileSync(dest, buf);
    return buf.length;
  }
  throw new Error('rate limited after retries');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Downloading to ${OUT_DIR} (${DELAY_MS}ms pacing)\n`);

  for (const [id, files] of Object.entries(MANIFEST)) {
    console.log(id);
    for (let i = 0; i < files.length; i++) {
      const dest = path.join(OUT_DIR, outName(id, i));
      if (fs.existsSync(dest) && fs.statSync(dest).size > 12000) {
        console.log(`  · ${path.basename(dest)} (exists)`);
        continue;
      }
      try {
        const bytes = await downloadWithRetry(commonsUrl(files[i]), dest);
        console.log(`  ✓ ${path.basename(dest)} (${Math.round(bytes / 1024)} KB)`);
      } catch (err) {
        console.warn(`  ✗ ${path.basename(dest)}: ${err.message}`);
      }
      await sleep(DELAY_MS);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
