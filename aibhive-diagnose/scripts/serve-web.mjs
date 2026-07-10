#!/usr/bin/env node
/**
 * Reliable Cursor / port-forward preview.
 * Metro's web bundle is ~10MB and often hangs forever behind a tunnel.
 * This exports a static web build and serves it on 0.0.0.0:8082.
 *
 * Always binds the requested port (default 8082). Never silently hops
 * to a random port like 41907 — that breaks Cursor port forwards.
 */
import { spawn, execSync } from 'node:child_process';
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

function pidsOnPort(targetPort) {
  try {
    const out = execSync(`fuser ${targetPort}/tcp 2>/dev/null || true`, {
      encoding: 'utf8',
    });
    return out
      .trim()
      .split(/\s+/)
      .map((p) => p.trim())
      .filter((p) => /^\d+$/.test(p));
  } catch {
    return [];
  }
}

function freePort(targetPort) {
  const pids = pidsOnPort(targetPort);
  if (!pids.length) return;

  console.log(`Port ${targetPort} busy (pids: ${pids.join(', ')}). Reclaiming…`);
  for (const pid of pids) {
    try {
      process.kill(Number(pid), 'SIGTERM');
    } catch {
      // already gone
    }
  }

  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    if (!pidsOnPort(targetPort).length) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
  }

  for (const pid of pidsOnPort(targetPort)) {
    try {
      process.kill(Number(pid), 'SIGKILL');
    } catch {
      // ignore
    }
  }
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

  freePort(port);

  // Prefer local serve binary if present; otherwise npx.
  const require = createRequire(import.meta.url);
  let serveBin = null;
  try {
    serveBin = require.resolve('serve/build/main.js');
  } catch {
    serveBin = null;
  }

  // -n / --no-port-switching: fail instead of hopping to a random port.
  const listen = `tcp://0.0.0.0:${port}`;
  const serveArgs = ['-s', 'dist', '-l', listen, '-n'];

  console.log(`Serving AiBhive Diagnose at http://0.0.0.0:${port} (forward this port)`);
  if (serveBin) {
    await run(process.execPath, [serveBin, ...serveArgs]);
  } else {
    await run('npx', ['--yes', 'serve', ...serveArgs]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
