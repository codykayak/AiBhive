#!/usr/bin/env node
/**
 * Sync 100×100 PNG glyphs into the DMT Matrix Decoder catalogue.
 *
 * Usage:
 *   node scripts/sync-dmt-symbol-catalogue.mjs --from /path/to/pngs
 *   node scripts/sync-dmt-symbol-catalogue.mjs --registry   # live dmtcode.com Supabase registry
 *   npm run sync:dmt-catalog
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

const SUPABASE_URL = process.env.DMTCODE_SUPABASE_URL || 'https://bbmhrgpsyiahefnxqwfg.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.DMTCODE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWhyZ3BzeWlhaGVmbnhxd2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1Njc5ODcsImV4cCI6MjA3OTE0Mzk4N30.zPuWahf5g140hdR__asVINWBvYJaxZmVvDQTvIAjLww';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { from: null, registry: false, fetch: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) out.from = resolve(args[++i]);
    if (args[i] === '--registry') out.registry = true;
    if (args[i] === '--fetch') out.fetch = true; // legacy alias for --registry
  }
  if (out.fetch) out.registry = true;
  return out;
}

async function fetchRegistryFromSupabase() {
  const fetchScript = join(SERVICE_DIR, 'scripts', 'fetch_dmtcode_registry.py');
  const result = spawnSync('python3', [fetchScript], { cwd: SERVICE_DIR, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error('fetch_dmtcode_registry.py failed');
  }
  const recordsPath = join(SERVICE_DIR, 'catalog', 'registry_records.json');
  if (!existsSync(recordsPath)) return 0;
  const records = JSON.parse(readFileSync(recordsPath, 'utf8'));
  return records.glyphCount || 0;
}

async function main() {
  const { from, registry } = parseArgs();
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
  } else if (registry) {
    const count = await fetchRegistryFromSupabase();
    console.log(
      `Registry sync: ${count} PNGs from dmtcode.com (Supabase registry_glyphs). ` +
        'PNG ZIP on /registry is still "Coming Soon"; this is the live source.',
    );
  } else {
    console.log('No --from or --registry; rebuilding manifest from existing PNGs only.');
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
