#!/usr/bin/env node
/**
 * Reliable Expo Go preview from cloud / remote agents.
 *
 * Expo's built-in `--tunnel` (ngrok/exp.direct) often spins forever from cloud
 * IPs. This script:
 *   1. Starts Metro on localhost:8081
 *   2. Opens a Cloudflare quick tunnel
 *   3. Restarts Metro with EXPO_PACKAGER_PROXY_URL so the manifest uses HTTPS
 *   4. Prints exp://…:443 + writes a QR PNG when possible
 *
 * Requires: cloudflared on PATH (https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
 */
import { spawn } from 'node:child_process';
import { createWriteStream, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8081);
const ROOT = new URL('..', import.meta.url).pathname;

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', ...opts.env },
    stdio: opts.stdio || ['ignore', 'pipe', 'pipe'],
  });
  return child;
}

async function waitForMetro(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${PORT}/status`);
      if (res.ok) {
        const text = await res.text();
        if (text.includes('running')) return;
      }
    } catch {
      // keep waiting
    }
    await sleep(800);
  }
  throw new Error('Metro did not become ready');
}

async function startCloudflared() {
  const logPath = '/tmp/cloudflared-expo.log';
  const log = createWriteStream(logPath, { flags: 'w' });
  const child = spawn(
    'cloudflared',
    ['tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));

  const start = Date.now();
  while (Date.now() - start < 45000) {
    try {
      const { readFileSync } = await import('node:fs');
      const text = readFileSync(logPath, 'utf8');
      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) return { url: match[0], child };
    } catch {
      // ignore
    }
    await sleep(500);
  }
  child.kill('SIGTERM');
  throw new Error('cloudflared did not print a trycloudflare.com URL');
}

async function main() {
  console.log('Starting Metro (localhost)…');
  let metro = run('npx', ['expo', 'start', '--localhost', `--port`, String(PORT)], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  await waitForMetro();

  console.log('Opening Cloudflare tunnel…');
  const { url: cfUrl, child: cf } = await startCloudflared();
  console.log(`Tunnel: ${cfUrl}`);

  // Restart Metro so the Expo manifest advertises the public HTTPS host.
  metro.kill('SIGTERM');
  await sleep(1500);
  metro = run(
    'npx',
    ['expo', 'start', '--localhost', `--port`, String(PORT)],
    {
      env: { EXPO_PACKAGER_PROXY_URL: cfUrl },
      stdio: ['ignore', 'inherit', 'inherit'],
    }
  );
  await waitForMetro();

  const host = cfUrl.replace(/^https:\/\//, '');
  const expUrl = `exp://${host}:443`;
  writeFileSync('/tmp/aibhive-diagnose-expo-url.txt', `${expUrl}\n`);
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('  AiBhive Diagnose — Expo Go');
  console.log(`  Open:  ${expUrl}`);
  console.log('  Need SDK 57 Expo Go: https://expo.dev/go');
  console.log('  First load can take 30–90s while the bundle builds.');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  const shutdown = () => {
    try {
      metro.kill('SIGTERM');
    } catch {
      // ignore
    }
    try {
      cf.kill('SIGTERM');
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  await new Promise(() => undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
