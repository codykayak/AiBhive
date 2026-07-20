#!/usr/bin/env node
/**
 * Retag legacy plant regions (both / eugene / florence) to modern or-* / ca-* filters.
 * Run: node scripts/normalize-plant-regions.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const WESTERN_OREGON = [
  'or-willamette',
  'or-coast',
  'or-portland',
  'or-cascades',
  'or-rogue',
  'or-klamath',
];

const OVERRIDES = {
  'psilocybe-azurescens': ['or-coast', 'or-portland', 'ca-north-coast'],
  'psilocybe-semilanceata': ['or-willamette', 'or-coast', 'or-portland', 'or-cascades', 'or-rogue'],
  'psilocybe-cyanescens': ['or-willamette', 'or-portland', 'or-coast', 'or-cascades'],
  'psilocybe-allenii': ['or-coast', 'or-portland', 'ca-north-coast'],
  'psilocybe-stuntzii': ['or-willamette', 'or-portland', 'or-cascades'],
  'psilocybe-baeocystis': ['or-willamette', 'or-coast', 'or-portland', 'or-cascades'],
  'gymnopilus-spectabilis': ['or-willamette', 'or-coast', 'or-cascades', 'or-rogue', 'ca-shasta'],
  'amanita-muscaria': ['or-willamette', 'or-coast', 'or-cascades', 'or-rogue', 'ca-shasta', 'ca-north-coast'],
  'amanita-pantherina': ['or-willamette', 'or-coast', 'or-cascades', 'or-rogue', 'ca-shasta'],
  'panaeolus-cinctulus': ['or-willamette', 'or-portland', 'or-coast'],
  'datura-stramonium': ['or-willamette', 'or-east', 'ca-sacramento', 'ca-sierra-foothills'],
};

function parseRegions(line) {
  const m = line.match(/regions:\s*\[([^\]]*)\]/);
  if (!m) return null;
  const inner = m[1].trim();
  if (!inner) return [];
  return inner
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function formatRegions(regions) {
  const sorted = [...regions].sort();
  return `regions: [${sorted.map((r) => `'${r}'`).join(', ')}],`;
}

function normalizeRegions(regions, plantId) {
  if (plantId && OVERRIDES[plantId]) return OVERRIDES[plantId];
  const out = new Set();
  for (const r of regions) {
    if (r === 'eugene') out.add('or-willamette');
    else if (r === 'florence') out.add('or-coast');
    else if (r === 'both') WESTERN_OREGON.forEach((x) => out.add(x));
    else out.add(r);
  }
  return [...out];
}

function processFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  let src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  let currentId = null;
  let changes = 0;

  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/^\s*id:\s*'([^']+)'/);
    if (idMatch) currentId = idMatch[1];

    if (lines[i].includes('regions: [')) {
      const regions = parseRegions(lines[i]);
      if (!regions) continue;
      const normalized = normalizeRegions(regions, currentId);
      const next = formatRegions(normalized);
      if (next !== lines[i].trim()) {
        const indent = lines[i].match(/^(\s*)/)?.[1] ?? '    ';
        lines[i] = `${indent}${next}`;
        changes += 1;
      }
    }
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`${relPath}: updated ${changes} region arrays`);
  } else {
    console.log(`${relPath}: no changes`);
  }
}

for (const file of [
  'src/lib/oregonPlantMedicine/plantLibrary.ts',
  'src/lib/oregonPlantMedicine/plantLibraryEdiblePlants.ts',
  'src/lib/oregonPlantMedicine/plantLibraryEdibleMushrooms.ts',
]) {
  processFile(file);
}
