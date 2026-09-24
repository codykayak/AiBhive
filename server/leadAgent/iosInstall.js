import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function readLeadAgentIosManifest() {
  const candidates = [
    path.join(__dirname, '../../public/lead-agent-ios.json'),
    path.join(__dirname, '../../dist/lead-agent-ios.json'),
  ];
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    } catch {
      /* ignore corrupt manifest */
    }
  }
  return null;
}

/** Public install URL (TestFlight join link or EAS internal install page). */
export function resolveLeadAgentIosInstallUrl() {
  const fromEnv = String(process.env.LEAD_AGENT_IOS_TESTFLIGHT_URL || '').trim();
  if (fromEnv) return fromEnv;
  const manifest = readLeadAgentIosManifest();
  if (!manifest) return '';
  return String(
    manifest.testFlightUrl || manifest.installUrl || manifest.easInstallUrl || '',
  ).trim();
}

export function isLeadAgentIosInstallReady() {
  return Boolean(resolveLeadAgentIosInstallUrl());
}

export function leadAgentIosInstallHtml({ installPath = '/api/download/lead-agent-ios' } = {}) {
  const ready = isLeadAgentIosInstallReady();
  const url = resolveLeadAgentIosInstallUrl();
  const status = ready
    ? `<p style="color:#86efac">Install link is live. <a href="${url}">Continue to TestFlight</a></p>`
    : `<p style="color:#fcd34d">iPhone build is not published yet. Apple does not use APK files — employees install via <strong>TestFlight</strong> (same role as our Android APK download).</p>
       <p>Ask ops to run GitHub Actions <strong>Build Lead Agent iOS</strong> and set <code>LEAD_AGENT_IOS_TESTFLIGHT_URL</code> or commit <code>public/lead-agent-ios.json</code>.</p>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>AiBhive Lead Agent — iPhone</title>
<style>body{font-family:system-ui,sans-serif;background:#05080f;color:#e2e8f0;padding:24px;max-width:32rem;margin:0 auto;line-height:1.5}a{color:#f59e0b}</style></head>
<body>
<h1>AiBhive Lead Agent (iPhone)</h1>
${status}
<ol>
<li>Install <a href="https://apps.apple.com/app/testflight/id899247664">TestFlight</a> from the App Store.</li>
<li>Return here after ops publishes the invite — this page will redirect automatically.</li>
<li>Sign in with Google in the app (invited workspace email).</li>
</ol>
<p><a href="/employee">Employee portal — full install steps</a></p>
<p style="font-size:12px;color:#64748b">Link: https://aibhive.com${installPath}</p>
</body></html>`;
}
