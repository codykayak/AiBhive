#!/usr/bin/env node
/**
 * Reliable Cursor / port-forward preview.
 * Metro's web bundle is ~10MB and often hangs forever behind a tunnel.
 * This exports a static web build and serves it on 0.0.0.0:8082.
 *
 * Always binds the requested port (default 8082). Never silently hops
 * to a random port like 41907 — that breaks Cursor port forwards.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, readlinkSync } from 'node:fs';
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
  const found = new Set();
  for (const procPath of ['/proc/net/tcp', '/proc/net/tcp6']) {
    let lines;
    try {
      lines = readFileSync(procPath, 'utf8').trim().split('\n').slice(1);
    } catch {
      continue;
    }
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue;
      const local = parts[1];
      const state = parts[3];
      const inode = parts[9];
      if (state !== '0A') continue; // LISTEN
      const portHex = local.split(':').pop();
      if (parseInt(portHex, 16) !== targetPort) continue;

      try {
        for (const pid of readdirSync('/proc')) {
          if (!/^\d+$/.test(pid)) continue;
          const fdDir = `/proc/${pid}/fd`;
          let fds;
          try {
            fds = readdirSync(fdDir);
          } catch {
            continue;
          }
          for (const fd of fds) {
            try {
              if (readlinkSync(`${fdDir}/${fd}`) === `socket:[${inode}]`) found.add(pid);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return [...found];
}

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin */
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
    sleepSync(150);
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

  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log(`  AiBhive Diagnose preview`);
  console.log(`  Open:  http://localhost:${port}`);
  console.log(`  Cursor Ports → ${port} → Open in Browser`);
  console.log(`  Do NOT run "expo start" — that causes a black screen`);
  console.log('════════════════════════════════════════════════════');
  console.log('');
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
