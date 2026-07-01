#!/usr/bin/env node
/**
 * Smoke-check local AiBhive dev stack (frontend + backend).
 * Usage: npm run dev:check
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const FRONTEND_URL = process.env.DEV_FRONTEND_URL || 'http://127.0.0.1:3000';
const BACKEND_URL = process.env.DEV_BACKEND_URL || 'http://127.0.0.1:3001';

const warnings = [];
const errors = [];

function envFileStatus() {
  const local = existsSync('.env.local');
  const env = existsSync('.env');
  if (!local && !env) {
    warnings.push('No .env or .env.local found — copy .env.example and fill in secrets.');
  }
  return { local, env };
}

function readEnvKeys() {
  const keys = new Set();
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)=/);
      if (m) keys.add(m[1]);
    }
  }
  return keys;
}

async function fetchJson(url, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* plain text */
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 200) };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
}

console.log('AiBhive local dev check\n');

const envFiles = envFileStatus();
console.log(`Env files: .env.local=${envFiles.local ? 'yes' : 'no'}  .env=${envFiles.env ? 'yes' : 'no'}`);

const keys = readEnvKeys();
const recommended = [
  ['GEMINI_API_KEY', 'Gemini AI (OCR, chat, PDF extraction)'],
  ['GOOGLE_APPLICATION_CREDENTIALS', 'Firebase Admin / Firestore / GCS (backend APIs)'],
  ['XAI_API_KEY', 'Grok (homework, intel chat)'],
  ['ADMIN_EMAILS', 'Your Google email for /admin and /homework'],
];
for (const [key, label] of recommended) {
  const present = keys.has(key) || Boolean(process.env[key]);
  console.log(`  ${present ? '✓' : '○'} ${key} — ${label}`);
  if (!present && (key === 'GEMINI_API_KEY' || key === 'GOOGLE_APPLICATION_CREDENTIALS')) {
    warnings.push(`Missing ${key} — some features will not work locally.`);
  }
}

console.log('\nBackend', BACKEND_URL);
const health = await fetchJson(`${BACKEND_URL}/api/health`);
if (health.error) {
  errors.push(`Backend not reachable: ${health.error}`);
  console.log('  ✗ not running — start with: npm run dev');
} else {
  console.log(`  ✓ /api/health → ${health.status}`);
  if (health.json) {
    const h = health.json;
    console.log(`    gemini=${h.env?.gemini} grok=${h.env?.grok} gcpCreds=${h.env?.googleCredentials}`);
    if (!h.firestore?.ok) {
      warnings.push(`Firestore not connected: ${h.firestore?.error || 'unknown'}`);
      console.log(`    ⚠ Firestore: ${h.firestore?.error || 'failed'}`);
    } else {
      console.log('    ✓ Firestore connected');
    }
  }
}

console.log('\nFrontend', FRONTEND_URL);
const front = await fetchJson(FRONTEND_URL);
if (front.error) {
  errors.push(`Frontend not reachable: ${front.error}`);
  console.log('  ✗ not running — start with: npm run dev');
} else {
  console.log(`  ✓ responding (${front.status})`);
}

console.log('\n---');
if (errors.length) {
  console.log('FAIL');
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
if (warnings.length) {
  console.log('PASS with warnings');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
} else {
  console.log('PASS — dev stack looks good. Open the forwarded port for :3000 in Cursor.');
}
process.exit(0);