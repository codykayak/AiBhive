#!/usr/bin/env node
/**
 * Optimize Oregon Plant Medicine section videos in public/oregon-plant-medicine/.
 * Re-encodes MP4 (H.264 faststart) and emits VP9 WebM siblings for modern browsers.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'public/oregon-plant-medicine');

function fmt(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

let hasFfmpeg = true;
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
  hasFfmpeg = false;
  console.warn('[optimize-opm-section-videos] ffmpeg missing — skipping');
  process.exit(0);
}

if (!fs.existsSync(DIR)) {
  console.warn('[optimize-opm-section-videos] Directory not found:', DIR);
  process.exit(0);
}

const sources = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.mp4'));
if (!sources.length) {
  console.log('[optimize-opm-section-videos] No MP4 files found');
  process.exit(0);
}

for (const file of sources) {
  const source = path.join(DIR, file);
  const base = file.replace(/\.mp4$/i, '');
  const outMp4 = path.join(DIR, `${base}.mp4`);
  const outWebm = path.join(DIR, `${base}.webm`);
  const tmpMp4 = path.join(DIR, `.${base}.tmp.mp4`);
  const before = fs.statSync(source).size;
  console.log(`\n=== ${file} (${fmt(before)}) ===`);

  run(
    `ffmpeg -y -i "${source}" ` +
      `-vf "scale='min(1280,iw)':-2:flags=lanczos" ` +
      `-c:v libx264 -preset medium -crf 28 -pix_fmt yuv420p -movflags +faststart ` +
      `-an -r 24 ` +
      `"${tmpMp4}"`,
  );
  fs.renameSync(tmpMp4, outMp4);

  run(
    `ffmpeg -y -i "${source}" ` +
      `-vf "scale='min(1280,iw)':-2:flags=lanczos" ` +
      `-c:v libvpx-vp9 -crf 35 -b:v 0 -row-mt 1 ` +
      `-an -r 24 ` +
      `"${outWebm}"`,
  );

  console.log(`  MP4:  ${fmt(fs.statSync(outMp4).size)}`);
  console.log(`  WebM: ${fmt(fs.statSync(outWebm).size)}`);
}

console.log('\n[optimize-opm-section-videos] Done.');
