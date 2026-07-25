#!/usr/bin/env node
/**
 * Normalize aibhive-plants/icon.png to 1024x1024 for Expo / Android adaptive icons.
 * Usage: node scripts/normalize-icon.mjs [input.png]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(root, '..');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Install sharp first: npm install sharp --no-save');
    process.exit(1);
  }

  const input = path.resolve(appRoot, process.argv[2] || 'icon-source.png');
  const output = path.join(appRoot, 'icon.png');
  if (!fs.existsSync(input)) {
    console.error('Missing input:', input);
    process.exit(1);
  }

  const size = 1024;
  const bg = { r: 15, g: 23, b: 42, alpha: 1 };
  const meta = await sharp(input).metadata();
  const maxBox = Math.round(size * 0.82);

  await sharp(input)
    .resize(maxBox, maxBox, { fit: 'inside', withoutEnlargement: false })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: bg,
    })
    .resize(size, size, {
      fit: 'contain',
      background: bg,
    })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const outMeta = await sharp(output).metadata();
  console.log('Wrote', output, `${outMeta.width}x${outMeta.height}`, fs.statSync(output).size, 'bytes');
  if (meta.width && meta.height) {
    console.log('Source was', `${meta.width}x${meta.height}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
