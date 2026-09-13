#!/usr/bin/env node
/**
 * Ship user-visible work the right way:
 *   git push → open-cursor-pr.yml → auto-merge-cursor-prs.yml → auto-deploy.yml
 *
 * Do NOT use gcloud builds submit for routine aibhive.com changes.
 *
 * Usage: npm run ship [-- --dry-run]
 */
import { execSync } from 'node:child_process';

const dryRun = process.argv.includes('--dry-run');

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function run(cmd) {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return '';
  }
  return execSync(cmd, { stdio: 'inherit' });
}

const branch = sh('git rev-parse --abbrev-ref HEAD');
if (!branch.startsWith('cursor/')) {
  console.error(`\nRefusing to ship from "${branch}".`);
  console.error('Use a fresh branch: ./scripts/cursor-fresh-branch.sh my-feature');
  process.exit(1);
}

try {
  sh('git diff --quiet && git diff --cached --quiet');
} catch {
  console.error('\nUncommitted changes — commit first (stage only files for this feature).');
  process.exit(1);
}

console.log(`\n=== Ship ${branch} → main-fixed ===\n`);
console.log('Push triggers: open PR → auto-merge → Cloud Run deploy (~10 min)\n');

try {
  sh('git rev-parse --abbrev-ref @{u}');
  run(`git push origin HEAD`);
} catch {
  run(`git push -u origin HEAD`);
}

const remote = sh('git config --get remote.origin.url');
const slug = remote.match(/github\.com[:/](.+?)(?:\.git)?$/i)?.[1] ?? 'codykayak/AiBhive';
const compare = `https://github.com/${slug}/compare/main-fixed...${encodeURIComponent(branch)}?expand=1`;

console.log('\nPushed. GitHub Actions will open the PR if one is not already open.');
console.log(`Compare / PR: ${compare}`);
console.log('\nWatch: https://github.com/codykayak/AiBhive/actions');
console.log('Live site (~10 min after merge): https://aibhive.com\n');
