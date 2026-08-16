#!/usr/bin/env node
/**
 * Copy ai-iridology-aibhive video from aibhive-plants/ into public/oregon-plant-medicine/
 * so deploy includes it. Safe no-op when source file is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'aibhive-plants');
const DEST_DIR = path.join(ROOT, 'public/oregon-plant-medicine');
const BASE = 'ai-iridology-aibhive';

if (!fs.existsSync(SRC_DIR)) {
  console.log('[install-iridology-video] aibhive-plants/ not found — skipping');
  process.exit(0);
}

fs.mkdirSync(DEST_DIR, { recursive: true });
let copied = 0;

for (const name of fs.readdirSync(SRC_DIR)) {
  if (!name.toLowerCase().includes(BASE)) continue;
  const ext = path.extname(name).toLowerCase();
  if (!['.mp4', '.webm', '.mov'].includes(ext)) continue;
  const destName = `${BASE}${ext}`;
  fs.copyFileSync(path.join(SRC_DIR, name), path.join(DEST_DIR, destName));
  console.log(`[install-iridology-video] ${name} → public/oregon-plant-medicine/${destName}`);
  copied++;
}

if (!copied) {
  console.log('[install-iridology-video] No ai-iridology-aibhive video in aibhive-plants/ — skipping');
}
