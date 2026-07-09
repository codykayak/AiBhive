#!/usr/bin/env node
/**
 * Optimize Research hero video for web delivery.
 * Source: src/aibhive-research_data-ai-library.mp4
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'src/aibhive-research_data-ai-library.mp4');
const OUT = path.join(ROOT, 'public/aibhive-research_data-ai-library.mp4');

if (!fs.existsSync(SOURCE)) {
  console.warn('[optimize-research-video] Source not found, skipping:', SOURCE);
  process.exit(0);
}

try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
  fs.copyFileSync(SOURCE, OUT);
  console.log('[optimize-research-video] ffmpeg missing — copied source to public/');
  process.exit(0);
}

const cmd = [
  'ffmpeg -y',
  `-i "${SOURCE}"`,
  `-vf "scale='min(1280,iw)':-2:flags=lanczos"`,
  '-c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p',
  '-movflags +faststart -an',
  `"${OUT}"`,
].join(' ');

execSync(cmd, { stdio: 'inherit', cwd: ROOT });
console.log('[optimize-research-video] Done:', OUT);
