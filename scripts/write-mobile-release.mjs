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
const firebaseApkUrl = args.includes('--firebase-apk-url')
  ? args[args.indexOf('--firebase-apk-url') + 1]
  : undefined;
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
manifest.downloadUrl = 'https://aibhive.com/api/download/apk';
manifest.fullApkUrl = 'https://aibhive.com/api/download/apk';
manifest.publishedAt = new Date().toISOString();
manifest.otaChannel = manifest.otaChannel || 'production';

if (firebaseApkUrl) {
  manifest.firebaseApkUrl = firebaseApkUrl;
  manifest.downloadUrl = firebaseApkUrl;
  manifest.fullApkUrl = firebaseApkUrl;
}

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
  '1.6.8':
    'v1.6.8 — Home scroll fix: homepage no longer goes blank when scrolling; collapsible header collapses layout space correctly.',
  '1.6.9':
    'v1.6.9 — Home hero video intro (5s fade into AiBhive Assistant), floating assistant dock, updated app icon, tab bar reveals at scroll end.',
  '1.6.10':
    'v1.6.10 — Fix startup crash: migrate home hero video from expo-av to expo-video (Android + New Architecture).',
  '1.6.11':
    'v1.6.11 — Fix in-app update download: installs direct .apk link instead of .gz mirror.',
  '1.6.12':
    'v1.6.12 — Home video fix (Android textureView), assistant pinned to bottom, new intro tagline, tab bar reveals at scroll end.',
  '1.6.13':
    'v1.6.13 — Fix home scroll glitch (stable tab bar slot), bigger chat dock, hide hero video on return to Home.',
  '1.6.14':
    'v1.6.14 — Fix bottom nav and chat dock: tab bar always visible, chat pinned above tabs with more padding, tap-to-open chat (no focus glitch).',
  '1.6.15':
    'v1.6.15 — Fix in-app update download: downloads APK inside the app and opens the installer (no broken browser/.gz links).',
  '1.6.16':
    'v1.6.16 — Home chat dock: real text field + mic + send, static hero after video, cleaner logo (no glow).',
  '1.6.17':
    'v1.6.17 — Home chat: attach photos from the dock or full-screen chat; assistant can see your images.',
  '1.6.19':
    'v1.6.19 — Home chat dock: pinned to bottom with breathing room below input, stays visible while typing, no tab overlap.',
  '1.6.20':
    'v1.6.20 — Home intro fades to black (no overlay text); chat dock pinned at bottom; update manifest sync.',
  '1.6.21':
    'v1.6.21 — Big home chat input (~5 rows), pinned above keyboard; full-screen chat overlap fixed.',
  '1.7.0':
    'v1.7.0 — Custom hive chime, daily motivation (Grok 3), calendar follow-ups, activity-aware suggestions. Plan/Build chat toggle.',
  '1.7.1':
    'v1.7.1 — Fixes APK publish (correct signed v1.7.0 build was not uploaded). Same features as 1.7.0.',
  '1.7.2':
    'v1.7.2 — Fixes home chat keyboard: dock stays above keyboard, full-screen composer clears nav bar and system controls.',
  '1.7.5':
    'v1.7.5 — Hero prompt update, community pool scroll fix, 50% Hive credit markup (was 20–30%).',
  '1.7.7':
    'v1.7.7 — Web App Command Center at /app, working Intel Agent + Grok research chat, APK publish fix.',
  '1.7.6':
    'v1.7.6 — Chat suggestions hide after first message, 30% Hive credit markup, build-complete export upsell + User Guide, Play Store ASO listing.',
};
if (defaultNotes[version]) {
  manifest.releaseNotes = defaultNotes[version];
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Updated', manifestPath);
console.log('shippedNativeVersion=', version, 'versionCode=', versionCode);
