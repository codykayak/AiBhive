#!/usr/bin/env node
/**
 * Expo Go preview from cloud / remote agents.
 *
 * Uses Expo's official `--tunnel` (exp.direct / @expo/ws-tunnel). Android Expo Go
 * expects HTTP bundle URLs on exp.direct — Cloudflare trycloudflare HTTPS :443
 * often fails with "java.io.IOException: Failed to download remote update".
 *
 * Flow:
 *   1. Kill stale Metro / tunnel processes on :8081
 *   2. Start `expo start --tunnel` once
 *   3. Read exp:// URL from /_expo/open (same as Expo CLI QR)
 *   4. Verify manifest + bundle download through the live tunnel (required)
 *   5. Print exp URL + QR PNG
 */
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8081);
const ROOT = new URL('..', import.meta.url).pathname;
const URL_FILE = '/tmp/aibhive-diagnose-expo-url.txt';
const QR_FILE = '/opt/cursor/artifacts/aibhive-diagnose-expo-qr.png';

function killStaleProcesses() {
  spawnSync('pkill', ['-f', `expo start --tunnel --port ${PORT}`]);
  spawnSync('pkill', ['-f', `expo start --localhost --port ${PORT}`]);
  spawnSync('pkill', ['-f', `cloudflared tunnel --url http://localhost:${PORT}`]);
}

async function waitForMetro(timeoutMs = 120000) {
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

async function waitForTunnelUrl(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${PORT}/_expo/open?platform=android`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        await sleep(1000);
        continue;
      }
      const data = await res.json();
      const expUrl = data?.url;
      if (typeof expUrl === 'string' && expUrl.startsWith('exp://')) {
        return { expUrl, runtime: data.runtime };
      }
    } catch {
      // tunnel may still be connecting
    }
    await sleep(1500);
  }
  throw new Error('Expo tunnel URL was not ready (/_expo/open never returned exp://…)');
}

async function fetchAndroidManifest() {
  const res = await fetch(`http://localhost:${PORT}/`, {
    headers: { 'expo-platform': 'android' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Local Android manifest failed: ${res.status}`);
  return res.json();
}

function tunnelHostFromExpUrl(expUrl) {
  const parsed = new URL(expUrl);
  return parsed.hostname;
}

async function verifyRemoteTunnel(expUrl, bundleUrl) {
  const host = tunnelHostFromExpUrl(expUrl);
  const attempts = 20;

  for (let i = 0; i < attempts; i += 1) {
    try {
      const manifestRes = await fetch(`http://${host}/`, {
        headers: { 'expo-platform': 'android' },
        signal: AbortSignal.timeout(20000),
      });
      if (!manifestRes.ok) throw new Error(`manifest HTTP ${manifestRes.status}`);

      const remoteManifest = await manifestRes.json();
      const remoteBundle = remoteManifest?.launchAsset?.url || '';
      if (!remoteBundle.includes(host)) {
        throw new Error(`remote manifest missing tunnel host (${remoteBundle || 'empty'})`);
      }
      if (remoteBundle.includes(':8081')) {
        throw new Error(`remote manifest still has :8081 (${remoteBundle})`);
      }

      const bundleRes = await fetch(bundleUrl.replace(/^https:/, 'http:'), {
        signal: AbortSignal.timeout(180000),
      });
      if (!bundleRes.ok) throw new Error(`bundle HTTP ${bundleRes.status}`);
      const buf = await bundleRes.arrayBuffer();
      if (buf.byteLength < 500_000) {
        throw new Error(`bundle too small (${buf.byteLength} bytes)`);
      }

      return { host, bytes: buf.byteLength };
    } catch (err) {
      if (i === attempts - 1) {
        throw new Error(
          `Tunnel not reachable externally after ${attempts} tries — Android will fail to download. Last: ${err.message}`
        );
      }
      await sleep(2000);
    }
  }

  throw new Error('verifyRemoteTunnel fell through');
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
  killStaleProcesses();
  await sleep(1000);

  console.log('Starting Metro with Expo official tunnel (exp.direct)…');
  console.log('(Android needs HTTP exp.direct — not Cloudflare HTTPS :443)\n');

  const metro = spawn(
    'npx',
    ['expo', 'start', '--tunnel', '--port', String(PORT)],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        CI: '1',
        EXPO_NO_TELEMETRY: '1',
        EXPO_NO_METRO_LAZY: '1',
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    }
  );

  await waitForMetro();
  console.log('Metro ready — waiting for tunnel URL…');

  const { expUrl } = await waitForTunnelUrl();
  const manifest = await fetchAndroidManifest();
  const bundleUrl = manifest?.launchAsset?.url || '';

  if (!bundleUrl) throw new Error('Manifest has no launchAsset.url');
  if (bundleUrl.includes(':8081')) {
    throw new Error(`Manifest advertises localhost port in bundle URL: ${bundleUrl}`);
  }

  console.log(`Tunnel URL: ${expUrl}`);
  console.log('Verifying Android can download manifest + bundle through tunnel…');

  const { host, bytes } = await verifyRemoteTunnel(expUrl, bundleUrl);

  writeFileSync(URL_FILE, `${expUrl}\n`);
  const qrPath = await writeQrPng(expUrl);

  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('  AiBhive Diagnose — Expo Go (SDK 57)');
  console.log(`  Open:   ${expUrl}`);
  console.log(`  Host:   ${host} (HTTP exp.direct)`);
  console.log(`  Bundle: ${Math.round(bytes / 1024 / 1024)}MB verified`);
  if (qrPath) console.log(`  QR:     ${qrPath}`);
  console.log('  Install SDK 57 Expo Go: https://expo.dev/go');
  console.log('  Android: Enter URL manually in Expo Go if QR fails.');
  console.log('  First load ~30–60s. Force-quit Expo Go before scanning.');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  const shutdown = () => {
    try {
      metro.kill('SIGTERM');
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
