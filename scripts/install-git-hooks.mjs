#!/usr/bin/env node
/**
 * Install repo git hooks (blocks new files > 8 MB from being committed).
 * Run: npm run repo:install-hooks
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hooksDir = path.join(ROOT, '.githooks');

fs.mkdirSync(hooksDir, { recursive: true });
execSync('git config core.hooksPath .githooks', { cwd: ROOT, stdio: 'inherit' });
console.log('Set core.hooksPath=.githooks (pre-commit blocks files > 8 MB)');
