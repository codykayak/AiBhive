#!/usr/bin/env node
/**
 * Export compact plant RAG index from TypeScript library files.
 * Run: node scripts/export-plant-rag-index.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SOURCE_FILES = [
  'src/lib/oregonPlantMedicine/plantLibrary.ts',
  'src/lib/oregonPlantMedicine/plantLibraryEdiblePlants.ts',
  'src/lib/oregonPlantMedicine/plantLibraryEdibleMushrooms.ts',
];

function extractString(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*'((?:\\\\'|[^'])*)'`,));
  if (m) return m[1].replace(/\\'/g, "'");
  const m2 = block.match(new RegExp(`${field}:\\s*"((?:\\\\"|[^"])*)"`,));
  return m2 ? m2[1].replace(/\\"/g, '"') : '';
}

function extractStringArray(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*\\[([\\s\\S]*?)\\]`,));
  if (!m) return [];
  const items = [];
  const re = /'((?:\\'|[^'])*)'/g;
  let hit;
  while ((hit = re.exec(m[1]))) items.push(hit[1].replace(/\\'/g, "'"));
  return items;
}

function parseEntries(content) {
  const entries = [];
  const blocks = content.split(/\n  \{/);
  for (const raw of blocks) {
    if (!raw.includes("id: '")) continue;
    const block = `{${raw}`;
    const idM = block.match(/id:\s*'([^']+)'/);
    if (!idM) continue;
    const id = idM[1];
    if (id.startsWith('edible-') || id.includes('resource')) continue;

    entries.push({
      id,
      commonName: extractString(block, 'commonName'),
      scientificName: extractString(block, 'scientificName'),
      uses: extractString(block, 'uses') || 'medicinal',
      category: extractString(block, 'category') || 'herb',
      regions: extractStringArray(block, 'regions'),
      habitat: extractString(block, 'habitat'),
      identification: extractString(block, 'identification'),
      lookalikes: extractStringArray(block, 'lookalikes'),
      edibleNotes: extractString(block, 'edibleNotes'),
      medicinalNotes: extractString(block, 'medicinalNotes'),
      holisticNotes: extractString(block, 'holisticNotes'),
      preparation: extractString(block, 'preparation'),
      harvestSeason: extractString(block, 'harvestSeason'),
      safetyWarnings: extractStringArray(block, 'safetyWarnings'),
    });
  }
  return entries;
}

function main() {
  const byId = new Map();
  for (const rel of SOURCE_FILES) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const entry of parseEntries(content)) {
      if (entry.commonName && entry.scientificName) {
        byId.set(entry.id, entry);
      }
    }
  }

  const plants = Object.fromEntries(byId);
  const out = {
    generatedAt: new Date().toISOString(),
    count: byId.size,
    plants,
  };

  const dest = path.join(ROOT, 'server/plantMedicineRagIndex.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`Wrote ${byId.size} plants → ${dest}`);
}

main();
