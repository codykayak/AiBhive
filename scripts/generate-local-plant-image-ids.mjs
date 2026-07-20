#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public/oregon-plant-medicine');
const out = path.join(__dirname, '../src/lib/oregonPlantMedicine/localPlantImageIds.ts');

const ids = [
  ...new Set(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.jpg'))
      .map((f) => f.replace(/-[0-9]+\.jpg$/, '').replace(/\.jpg$/, '')),
  ),
].sort();

const body =
  '/** Auto-generated — run: node scripts/generate-local-plant-image-ids.mjs */\n' +
  'export const LOCAL_PLANT_IMAGE_IDS = new Set<string>([\n' +
  ids.map((id) => `  ${JSON.stringify(id)},`).join('\n') +
  '\n]);\n';

fs.writeFileSync(out, body);
console.log(`Wrote ${ids.length} local plant image IDs → ${path.relative(process.cwd(), out)}`);
