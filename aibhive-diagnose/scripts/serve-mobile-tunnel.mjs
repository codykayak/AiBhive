#!/usr/bin/env node
/**
 * Reliable Expo Go preview from cloud / remote agents.
 *
 * Expo's built-in `--tunnel` (ngrok/exp.direct) often spins forever from cloud
 * IPs. This script:
 *   1. Kills stale cloudflared / Metro on :8081
 *   2. Opens a Cloudflare quick tunnel to localhost:8081
 *   3. Starts Metro once with EXPO_PACKAGER_PROXY_URL (must be set at boot)
 *   4. Verifies manifest locally AND through the live tunnel hostname
 *   5. Prints exp://…:443 + writes URL + QR PNG
 */
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8081);
const ROOT = new URL('..', import.meta.url).pathname;
const URL_FILE = '/tmp/aibhive-diagnose-expo-url.txt';
const QR_FILE = '/opt/cursor/artifacts/aibhive-diagnose-expo-qr.png';

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    cwd: ROOT,
    env: {
      ...process.env,
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      EXPO_NO_METRO_LAZY: '1',
      ...opts.env,
    },
    stdio: opts.stdio || ['ignore', 'pipe', 'pipe'],
  });
}

function killStaleProcesses() {
  spawnSync('pkill', ['-f', `cloudflared tunnel --url http://localhost:${PORT}`]);
  spawnSync('pkill', ['-f', `expo start --localhost --port ${PORT}`]);
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
  killStaleProcesses();
  await sleep(800);

  const logPath = '/tmp/cloudflared-expo.log';
  try {
    unlinkSync(logPath);
  } catch {
    // ignore
  }

  const log = createWriteStream(logPath, { flags: 'wx' });
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
  while (Date.now() - start < 60000) {
    try {
      const text = readFileSync(logPath, 'utf8');
      if (!text.includes('Your quick Tunnel has been created')) {
        await sleep(500);
        continue;
      }
      const matches = [...text.matchAll(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g)];
      const url = matches.at(-1)?.[0];
      if (url) {
        return { url, child };
      }
    } catch {
      // ignore read races while log is being written
    }
    await sleep(500);
  }
  child.kill('SIGTERM');
  throw new Error('cloudflared did not publish a live trycloudflare.com URL');
}

async function verifyManifest(proxyUrl) {
  const host = proxyUrl.replace(/^https:\/\//, '');

  const localRes = await fetch('http://localhost:8081/', {
    headers: { 'expo-platform': 'ios' },
  });
  if (!localRes.ok) throw new Error(`Local manifest request failed: ${localRes.status}`);
  const manifest = await localRes.json();
  const bundleUrl = manifest?.launchAsset?.url || '';

  if (bundleUrl.includes(':8081')) {
    throw new Error(
      `Manifest still advertises :8081 (Expo Go will fail instantly). Got: ${bundleUrl}`
    );
  }
  if (!bundleUrl.includes(host)) {
    throw new Error(`Manifest bundle URL missing tunnel host. Got: ${bundleUrl}`);
  }

  const remoteRes = await fetchRemoteManifest(host);
  if (remoteRes) {
    const remoteBundle = remoteRes?.launchAsset?.url || '';
    if (!remoteBundle.includes(host) || remoteBundle.includes(':8081')) {
      console.warn(`Remote manifest check failed: ${remoteBundle || '(empty)'}`);
    }
  } else {
    console.warn(
      'Could not reach tunnel from this VM yet (DNS may still propagate). Local manifest looks correct — try the QR from your phone.'
    );
  }

  return bundleUrl;
}

async function fetchRemoteManifest(host, attempts = 8) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const remoteRes = await fetch(`https://${host}/`, {
        headers: { 'expo-platform': 'ios' },
        signal: AbortSignal.timeout(10000),
      });
      if (remoteRes.ok) {
        return remoteRes.json();
      }
    } catch {
      // DNS / tunnel may need a few seconds after cloudflared starts.
    }
    await sleep(1500);
  }
  return null;
}

async function writeQrPng(expUrl) {
  try {
    const { default: QRCode } = await import('qrcode');
    await QRCode.toFile(QR_FILE, expUrl, { width: 480, margin: 2 });
    return QR_FILE;
  } catch {
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
