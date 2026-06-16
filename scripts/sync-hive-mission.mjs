#!/usr/bin/env node
/**
 * Copies shared/hive-mission.md into bundled fallbacks for mobile + server.
 * Run after editing the mission doc: node scripts/sync-hive-mission.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'shared/hive-mission.md');
const md = fs.readFileSync(src, 'utf8');

const jsOut = path.join(root, 'server/hiveMissionBundled.js');
const tsOut = path.join(root, 'taylored-mobile/src/constants/hiveMissionBundled.ts');

const escaped = JSON.stringify(md);

fs.writeFileSync(
  jsOut,
  `/** Auto-generated from shared/hive-mission.md — do not edit by hand */\nexport const HIVE_MISSION_MARKDOWN = ${escaped};\n`
);

fs.writeFileSync(
  tsOut,
  `/** Auto-generated from shared/hive-mission.md — do not edit by hand */\nexport const HIVE_MISSION_MARKDOWN = ${escaped};\n`
);

console.log('[sync-hive-mission] Wrote', path.relative(root, jsOut));
console.log('[sync-hive-mission] Wrote', path.relative(root, tsOut));
