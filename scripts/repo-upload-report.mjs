#!/usr/bin/env node
/**
 * Report Git repo weight and estimated Cloud Build upload size.
 * Run: npm run repo:upload-report
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

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
    const re = globToRegExp(pat);
    if (re.test(norm)) return true;
    if (re.test(norm.split('/').pop() || norm)) return true;
  }
  return false;
}

function walk(dir, patterns, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.git' || ent.name === 'node_modules') continue;
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full);
    if (isIgnored(rel, patterns)) continue;
    if (ent.isDirectory()) walk(full, patterns, acc);
    else {
      try {
        acc.push({ rel, size: fs.statSync(full).size });
      } catch {
        /* skip */
      }
    }
  }
  return acc;
}

function fmt(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

console.log('=== AiBhive repo upload report ===\n');

try {
  const counts = sh('git count-objects -vH');
  console.log('Git object database:');
  console.log(counts.split('\n').map((l) => `  ${l}`).join('\n'));
} catch (e) {
  console.log('  (git count-objects failed — not a git repo?)');
}

try {
  const upstream = sh('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
  const ahead = sh(`git rev-list --count ${upstream}..HEAD`);
  const behind = sh(`git rev-list --count HEAD..${upstream}`);
  console.log(`\nBranch vs ${upstream}: ahead ${ahead}, behind ${behind}`);
  if (Number(ahead) > 0) {
    const delta = sh(`git diff --stat ${upstream}..HEAD`);
    console.log('\nCommits to push (summary):');
    console.log(delta.split('\n').slice(-8).map((l) => `  ${l}`).join('\n'));
  }
} catch {
  console.log('\n(No upstream tracking branch — push size = full pack history on first push)');
}

const gcloudPatterns = readIgnoreFile('.gcloudignore');
const files = walk(ROOT, gcloudPatterns);
const total = files.reduce((s, f) => s + f.size, 0);
const top = [...files].sort((a, b) => b.size - a.size).slice(0, 15);

console.log(`\nEstimated Cloud Build upload (.gcloudignore applied):`);
console.log(`  Files: ${files.length.toLocaleString()}`);
console.log(`  Total: ${fmt(total)}`);
console.log('\n  Largest included files:');
for (const f of top) {
  console.log(`    ${fmt(f.size).padStart(8)}  ${f.rel}`);
}

console.log('\nTips:');
console.log('  • Ship site/server changes: npm run ship  (git push → GitHub Actions → Cloud Run ~10 min)');
console.log('  • Do NOT use gcloud builds submit / npm run deploy:gcp for routine work (local tarball stalls on Windows)');
console.log('  • Block huge commits: npm run repo:install-hooks');
console.log('  • Clean stuck packs: npm run repo:gc');
console.log('  • Pre-flight: npm run gcp:upload-check');

const failArg = process.argv.includes('--fail-over-mb');
if (failArg) {
  const maxMb = Number(process.argv.find((a) => a.startsWith('--max-mb='))?.split('=')[1] || 80);
  if (total > maxMb * 1024 * 1024) process.exit(1);
}
