#!/usr/bin/env node
/**
 * Optimize Old Tartar Research hero video for web delivery.
 *
 * Place source at: src/aibhive_tatar_tartarian_research.mp4
 * Outputs:
 *   public/aibhive_tatar_tartarian_research.mp4  (H.264, faststart)
 *   public/aibhive_tatar_tartarian_research.webm (VP9, smaller for modern browsers)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'src/aibhive_tatar_tartarian_research.mp4');
const OUT_MP4 = path.join(ROOT, 'public/aibhive_tatar_tartarian_research.mp4');
const OUT_WEBM = path.join(ROOT, 'public/aibhive_tatar_tartarian_research.webm');

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function fmt(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

if (!fs.existsSync(SOURCE)) {
  console.warn('[optimize-tartar-hero-video] Source not found, skipping:', SOURCE);
  process.exit(0);
}

try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
  if (!fs.existsSync(OUT_MP4)) {
    fs.copyFileSync(SOURCE, OUT_MP4);
  }
  console.log('[optimize-tartar-hero-video] ffmpeg missing — copied source to public/');
  process.exit(0);
}

const before = fs.statSync(SOURCE).size;
console.log(`Source: ${SOURCE} (${fmt(before)})`);

run(
  `ffmpeg -y -i "${SOURCE}" ` +
    `-vf "scale='min(1280,iw)':-2:flags=lanczos" ` +
    `-c:v libx264 -preset medium -crf 28 -pix_fmt yuv420p -movflags +faststart ` +
    `-an -r 24 ` +
    `"${OUT_MP4}"`
);

run(
  `ffmpeg -y -i "${SOURCE}" ` +
    `-vf "scale='min(1280,iw)':-2:flags=lanczos" ` +
    `-c:v libvpx-vp9 -crf 35 -b:v 0 -row-mt 1 ` +
    `-an -r 24 ` +
    `"${OUT_WEBM}"`
);

const mp4Size = fs.statSync(OUT_MP4).size;
const webmSize = fs.statSync(OUT_WEBM).size;
console.log('\nDone.');
console.log(`  MP4:  ${OUT_MP4} (${fmt(mp4Size)})`);
console.log(`  WebM: ${OUT_WEBM} (${fmt(webmSize)})`);
