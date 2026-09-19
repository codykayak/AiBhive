#!/usr/bin/env node
/**
 * Fail fast before a local `gcloud builds submit` uploads a huge / broken tarball.
 * GitHub Actions deploy does NOT use this path — it checks out clean and respects .gcloudignore.
 *
 * Usage: node scripts/gcp-upload-guard.mjs [--max-mb=80]
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const maxMbArg = process.argv.find((a) => a.startsWith('--max-mb='));
const MAX_BYTES = Number(maxMbArg?.split('=')[1] || 280) * 1024 * 1024;
const HARD_FAIL_BYTES = 350 * 1024 * 1024;

const FORBIDDEN_SUBSTRINGS = [
  '/.gradle/',
  '/android/app/build/',
  '/node_modules/',
  '/.worktrees/',
  '/greenteam/',
  '/aibhive-main-fixed/aibhive-main-fixed/',
];

function readIgnoreFile(name) {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

function globToRegExp(pattern) {
  let p = pattern.replace(/\\/g, '/');
  if (p.endsWith('/')) p += '**';
  const escaped = p
    .replace(/\./g, '\\.')
    .replace(/\*\*\//g, '§§/')
    .replace(/\*\*/g, '§GLOBSTAR§')
    .replace(/\*/g, '[^/]*')
    .replace(/§GLOBSTAR§/g, '.*')
    .replace(/§§\//g, '(.*\\/)?');
  return new RegExp(`^${escaped}$`, 'i');
}

function isIgnored(rel, patterns) {
  const norm = rel.replace(/\\/g, '/');
  for (const pat of patterns) {
    if (pat.startsWith('!')) continue;
    if (globToRegExp(pat).test(norm)) return true;
  }
  return false;
}

function walk(dir, patterns, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.git') continue;
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full);
    if (isIgnored(rel, patterns)) continue;
    if (ent.isDirectory()) walk(full, patterns, acc);
    else {
      try {
        acc.push({ rel: rel.replace(/\\/g, '/'), size: fs.statSync(full).size });
      } catch {
        /* skip */
      }
    }
  }
  return acc;
}

const patterns = readIgnoreFile('.gcloudignore');
const files = walk(ROOT, patterns);
const total = files.reduce((s, f) => s + f.size, 0);

const forbidden = files.filter((f) => FORBIDDEN_SUBSTRINGS.some((s) => f.rel.includes(s)));
if (forbidden.length) {
  console.error('\n❌ .gcloudignore is missing paths that break Windows uploads (Gradle, build dirs):');
  for (const f of forbidden.slice(0, 8)) console.error(`   ${f.rel}`);
  console.error('\nFix .gcloudignore, then npm run gcp:upload-check\n');
  process.exit(1);
}

if (total > HARD_FAIL_BYTES) {
  console.error(`\n❌ Upload estimate ${(total / 1024 / 1024).toFixed(1)} MB — likely node_modules/Gradle in tarball. Fix .gcloudignore.\n`);
  process.exit(1);
}

if (total > MAX_BYTES) {
  console.warn(`\n⚠ Upload estimate ${(total / 1024 / 1024).toFixed(1)} MB (soft cap ${MAX_BYTES / 1024 / 1024} MB). Prefer npm run ship.\n`);
}

console.log(`✓ GCP upload guard OK (${files.length} files, ${(total / 1024 / 1024).toFixed(1)} MB per .gcloudignore)`);
