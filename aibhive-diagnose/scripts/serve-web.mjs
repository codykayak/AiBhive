#!/usr/bin/env node
/**
 * Reliable Cursor / port-forward preview.
 * Metro's web bundle is ~10MB and often hangs forever behind a tunnel.
 * This exports a static web build and serves it on 0.0.0.0:8082.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 8082);
const skipExport = process.env.SKIP_EXPORT === '1' && existsSync(path.join(dist, 'index.html'));

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      ...opts,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function main() {
  if (!skipExport) {
    console.log('Exporting static web build (one-time; use SKIP_EXPORT=1 to reuse dist/)…');
    await run('npx', ['expo', 'export', '--platform', 'web']);
  } else {
    console.log('Reusing existing dist/ (SKIP_EXPORT=1)');
  }

  if (!existsSync(path.join(dist, 'index.html'))) {
    throw new Error('dist/index.html missing after export');
  }

  // Prefer local serve binary if present; otherwise npx.
  const require = createRequire(import.meta.url);
  let serveBin = null;
  try {
    serveBin = require.resolve('serve/build/main.js');
  } catch {
    serveBin = null;
  }

  console.log(`Serving AiBhive Diagnose at http://0.0.0.0:${port} (forward this port)`);
  if (serveBin) {
    await run(process.execPath, [serveBin, '-s', 'dist', '-l', `tcp://0.0.0.0:${port}`]);
  } else {
    await run('npx', ['--yes', 'serve', '-s', 'dist', '-l', `tcp://0.0.0.0:${port}`]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
