#!/usr/bin/env node
/**
 * Reliable Expo Go preview from cloud / remote agents.
 *
 * Expo's built-in `--tunnel` (ngrok/exp.direct) often spins forever from cloud
 * IPs. This script:
 *   1. Opens a Cloudflare quick tunnel to localhost:8081
 *   2. Starts Metro once with EXPO_PACKAGER_PROXY_URL (must be set at boot —
 *      restarting Metro without it leaves :8081 in manifest bundle URLs, which
 *      breaks Expo Go through HTTPS tunnels)
 *   3. Verifies the manifest, prints exp://…:443, writes URL + QR PNG
 *
 * Requires: cloudflared on PATH (https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
 */
import { spawn } from 'node:child_process';
import { createWriteStream, readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8081);
const ROOT = new URL('..', import.meta.url).pathname;
const URL_FILE = '/tmp/aibhive-diagnose-expo-url.txt';
const QR_FILE = '/opt/cursor/artifacts/aibhive-diagnose-expo-qr.png';

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', ...opts.env },
    stdio: opts.stdio || ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForMetro(timeoutMs = 90000) {
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

async function verifyManifest(proxyUrl) {
  const res = await fetch('http://localhost:8081/', {
    headers: { 'expo-platform': 'ios' },
  });
  if (!res.ok) throw new Error(`Manifest request failed: ${res.status}`);
  const manifest = await res.json();
  const bundleUrl = manifest?.launchAsset?.url || '';
  const host = proxyUrl.replace(/^https:\/\//, '');
  if (bundleUrl.includes(':8081')) {
    throw new Error(
      `Manifest still advertises :8081 (Expo Go will spin forever). Got: ${bundleUrl}`
    );
  }
  if (!bundleUrl.includes(host)) {
    throw new Error(`Manifest bundle URL missing tunnel host. Got: ${bundleUrl}`);
  }
  return bundleUrl;
}

async function writeQrPng(expUrl) {
  try {
    const { default: QRCode } = await import('qrcode');
    await QRCode.toFile(QR_FILE, expUrl, { width: 480, margin: 2 });
    return QR_FILE;
  } catch {
    // qrcode is optional; URL text is enough
    return null;
  }
}

async function main() {
  console.log('Opening Cloudflare tunnel (Metro will start after URL is ready)…');
  const { url: cfUrl, child: cf } = await startCloudflared();
  console.log(`Tunnel: ${cfUrl}`);

  console.log('Starting Metro with EXPO_PACKAGER_PROXY_URL…');
  const metro = run('npx', ['expo', 'start', '--localhost', '--port', String(PORT)], {
    env: { EXPO_PACKAGER_PROXY_URL: cfUrl },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  await waitForMetro();

  const bundleUrl = await verifyManifest(cfUrl);
  const host = cfUrl.replace(/^https:\/\//, '');
  const expUrl = `exp://${host}:443`;
  writeFileSync(URL_FILE, `${expUrl}\n`);

  const qrPath = await writeQrPng(expUrl);

  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('  AiBhive Diagnose — Expo Go (SDK 57)');
  console.log(`  Open:   ${expUrl}`);
  console.log(`  Bundle: ${bundleUrl.slice(0, 72)}…`);
  if (qrPath) console.log(`  QR:     ${qrPath}`);
  console.log('  Install SDK 57 Expo Go: https://expo.dev/go');
  console.log('  First load can take 30–90s while the bundle builds.');
  console.log('  Force-quit Expo Go if you had an old tunnel URL open.');
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

  await new Promise(() => undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
