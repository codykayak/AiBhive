#!/usr/bin/env node
/** Sync shared/home-assistant-knowledge.md into mobile bundled fallback. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'shared/home-assistant-knowledge.md');
const md = fs.readFileSync(src, 'utf8');
const tsOut = path.join(root, 'taylored-mobile/src/constants/homeAssistantKnowledgeBundled.ts');
const escaped = JSON.stringify(md);

fs.writeFileSync(
  tsOut,
  `/** Auto-generated from shared/home-assistant-knowledge.md — do not edit by hand */\nexport const HOME_ASSISTANT_KNOWLEDGE = ${escaped};\n`
);

const jsOut = path.join(root, 'server/homeAssistantKnowledgeBundled.js');
fs.writeFileSync(
  jsOut,
  `/** Auto-generated from shared/home-assistant-knowledge.md — do not edit by hand */\nexport const HOME_ASSISTANT_KNOWLEDGE = ${escaped};\n`
);

console.log('[sync-home-assistant] Wrote bundled knowledge files');
