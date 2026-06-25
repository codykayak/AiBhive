#!/usr/bin/env node
/**
 * Update public/mobile-releases.json after an APK deploy or Firebase mirror publish.
 * Usage:
 *   node scripts/write-mobile-release.mjs
 *   node scripts/write-mobile-release.mjs --firebase-gz-url "https://..."
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'public/mobile-releases.json');
const appJsonPath = path.join(root, 'taylored-mobile/app.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const args = process.argv.slice(2);
const firebaseGzUrl = args.includes('--firebase-gz-url')
  ? args[args.indexOf('--firebase-gz-url') + 1]
  : undefined;

const appJson = readJson(appJsonPath);
const expo = appJson.expo || {};
const version = expo.version || '1.0.0';
const versionCode = expo.android?.versionCode ?? 1;

let manifest = {};
if (fs.existsSync(manifestPath)) {
  try {
    manifest = readJson(manifestPath);
  } catch {
    manifest = {};
  }
}

manifest.shippedNativeVersion = version;
manifest.versionCode = versionCode;
manifest.sourceVersion = version;
manifest.downloadUrl = manifest.downloadUrl || 'https://aibhive.com/api/download/apk?compressed=1';
manifest.fullApkUrl = manifest.fullApkUrl || 'https://aibhive.com/api/download/apk';
manifest.publishedAt = new Date().toISOString();
manifest.otaChannel = manifest.otaChannel || 'production';

if (firebaseGzUrl) {
  manifest.firebaseGzUrl = firebaseGzUrl;
}

if (!manifest.releaseNotes) {
  manifest.releaseNotes = `Taylored Mobile v${version}`;
}

const defaultNotes = {
  '1.2.2':
    'v1.2.2 — Epic Hive UI, welcome tutorial, Hive Magic pricing/limits, Play Store prep, in-app update checks.',
  '1.3.0':
    'v1.3.0 — AiBhive rebrand, beehive logo + icon, My Apps fix, image attachments, Cursor-based pricing.',
  '1.3.1':
    'v1.3.1 — User Guide (how builds become apps), app detail screen, keyboard dismiss on send.',
  '1.4.0':
    'v1.4.0 — Auto-deploy: builds now auto-merge, ship OTA in ~2 min, and rebuild a fresh APK + .gz mirror on each release. Adds per-build folder/branch isolation, Expo push notifications, auto-approve under $1.50, daily USD spend cap, iteration memory, and user-apps registry.',
  '1.4.1':
    'v1.4.1 — Instant operational apps: every build now appears in seconds inside AiBhive (no Play Store update needed). Five page types (list, tracker, note, calculator, info), six themes, eighteen icons. New Export Options screen with three paid upgrade paths: Web link (~$5), Android app (~$18), Play Store ready (~$35) — each with plain-English steps. Pricing tiers redesigned so quotes are meaningful, not all $0.50.',
  '1.4.2':
    'v1.4.2 — Intel Agent preview: AI-directed OSINT research with Google-safe tools.',
  '1.4.3':
    'v1.4.3 — Intel Agent expanded: Hive Cloud tools, PDF export, username/Wayback probes.',
  '1.5.0':
    'v1.5.0 — Simple Home hub: Do (jobs), Build (Hive Magic), Research (Intel Agent). Cleaner three-tab layout.',
  '1.5.1':
    'v1.5.1 — Hive plans: Free, Starter ($5), Pro ($20/mo), Unlimited ($50/mo) with usage tracking and 20% token markup.',
  '1.6.0':
    'v1.6.0 — Grok 4 home assistant: AI search bar orchestrates jobs, research & builds. RAG knowledge base, web search via AiBhive Tokens (30% markup), build onboarding flow.',
  '1.6.1':
    'v1.6.1 — Community Toolkit: user apps save to cloud and auto-share. Anyone can install existing tools free before building duplicates.',
  '1.6.2':
    'v1.6.2 — Tweak & Customize: change existing apps without rebuilding from scratch. Sharing is opt-in (no auto-share). Hive Apps web store preview.',
  '1.6.3':
    'v1.6.3 — Blocky home & store refresh, Example tools (Job Tracker, Resume, Research), $1–$5 first-app pricing, Research tab fixes.',
  '1.6.4':
    'v1.6.4 — Samsung DeX / large-screen layout fills the monitor. Web Hive Apps run in-browser with live split-pane store on desktop.',
  '1.6.5':
    'v1.6.5 — Intel Agent: company, website & person targets; regional search filters (city + radius); smarter tool plans per target type.',
  '1.6.6':
    'v1.6.6 — DeX side nav & full-width layout; Hive Assistant full-screen chat (Hive credits default); community-style Job Tracker, Resume & Research apps; collapsible top bar.',
  '1.6.7':
    'v1.6.7 — Samsung DeX fix: resizable free-form window, Samsung keepalive meta-data, DisplayMetrics refresh on resize (no more tiny phone box on monitor).',
};
if (defaultNotes[version]) {
  manifest.releaseNotes = defaultNotes[version];
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Updated', manifestPath);
console.log('shippedNativeVersion=', version, 'versionCode=', versionCode);
