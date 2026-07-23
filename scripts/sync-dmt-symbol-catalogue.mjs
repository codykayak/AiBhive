#!/usr/bin/env node
/**
 * Sync 100×100 PNG glyphs into the DMT Matrix Decoder catalogue.
 *
 * Usage:
 *   node scripts/sync-dmt-symbol-catalogue.mjs --from /path/to/pngs
 *   node scripts/sync-dmt-symbol-catalogue.mjs --fetch   # tries dmtcode.com patterns (best-effort)
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SERVICE_DIR = join(ROOT, 'services', 'dmt-matrix-decoder');
const SYMBOLS_DIR = join(SERVICE_DIR, 'catalog', 'symbols');
const PUBLIC_DIR = join(ROOT, 'public', 'dmt-symbols');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { from: null, fetch: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) out.from = resolve(args[++i]);
    if (args[i] === '--fetch') out.fetch = true;
  }
  return out;
}

async function tryFetchRemote(id) {
  const urls = [
    `https://dmtcode.com/registry/images/${id}.png`,
    `https://dmtcode.com/catalogue/${id}.png`,
    `https://dmtcode.com/symbols/${id}.png`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.slice(0, 4).toString() !== '\x89PNG') continue;
      return buf;
    } catch {
      /* next */
    }
  }
  return null;
}

async function main() {
  const { from, fetch } = parseArgs();
  mkdirSync(SYMBOLS_DIR, { recursive: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });

  if (from) {
    const files = readdirSync(from).filter((f) => f.toLowerCase().endsWith('.png'));
    if (!files.length) {
      console.error(`No PNG files in ${from}`);
      process.exit(1);
    }
    for (const file of files) {
      const dest = join(SYMBOLS_DIR, basename(file));
      copyFileSync(join(from, file), dest);
      copyFileSync(dest, join(PUBLIC_DIR, basename(file)));
      console.log(`Imported ${file}`);
    }
  } else if (fetch) {
    const ids = Array.from({ length: 120 }, (_, i) => String(i + 1).padStart(3, '0'));
    let imported = 0;
    for (const id of ids) {
      const buf = await tryFetchRemote(id);
      if (!buf) continue;
      const name = `${id}.png`;
      writeFileSync(join(SYMBOLS_DIR, name), buf);
      writeFileSync(join(PUBLIC_DIR, name), buf);
      imported++;
      console.log(`Fetched ${name}`);
    }
    console.log(`Remote fetch imported ${imported} PNGs (dmtcode.com may require manual download).`);
  } else {
    console.log('No --from or --fetch; rebuilding manifest from existing PNGs only.');
  }

  const build = spawnSync('python3', ['scripts/build_catalog.py'], {
    cwd: SERVICE_DIR,
    stdio: 'inherit',
  });
  if (build.status !== 0) process.exit(build.status ?? 1);

  const structural = spawnSync('python3', ['scripts/build_structural_catalog.py'], {
    cwd: SERVICE_DIR,
    stdio: 'inherit',
  });
  if (structural.status !== 0) process.exit(structural.status ?? 1);

  // Mirror manifest + symbols to public/ for static serving
  const manifestSrc = join(SERVICE_DIR, 'catalog', 'manifest.json');
  if (existsSync(manifestSrc)) {
    const manifest = JSON.parse(readFileSync(manifestSrc, 'utf8'));
    writeFileSync(join(PUBLIC_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
    for (const sym of manifest.symbols || []) {
      const src = join(SYMBOLS_DIR, sym.filename);
      if (existsSync(src)) copyFileSync(src, join(PUBLIC_DIR, sym.filename));
    }
    writeFileSync(join(ROOT, 'src', 'data', 'dmtSymbolCatalog.json'), JSON.stringify(manifest, null, 2));
    console.log(`Catalogue synced: ${manifest.symbolCount} symbols`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
