/**
 * Built-in example Hive apps — always available in the web store and toolkit API
 * even when the Firestore community pool is empty.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inferAppCategory, normalizeAppSpec, saveUserApp } from './hiveAppsApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_PATH = path.join(__dirname, '../shared/hive-example-apps.json');

let cachedExamples = null;

function loadExamples() {
  if (cachedExamples) return cachedExamples;
  try {
    const raw = JSON.parse(fs.readFileSync(EXAMPLES_PATH, 'utf8'));
    cachedExamples = Array.isArray(raw) ? raw : [];
  } catch {
    cachedExamples = [];
  }
  return cachedExamples;
}

function toPublicExample(app) {
  return {
    id: app.id,
    title: app.title,
    tagline: app.tagline,
    summary: app.summary,
    theme: app.theme,
    icon: app.icon,
    pages: app.pages,
    pageCount: Array.isArray(app.pages) ? app.pages.length : 0,
    installCount: app.installCount || 0,
    sharedAt: null,
    category: app.category || inferAppCategory(app),
    slug: app.id,
    isExample: true,
  };
}

const HIDDEN_STORE_IDS = new Set(['example-job-tracker']);

export function listExampleApps() {
  const apps = loadExamples()
    .filter((a) => !HIDDEN_STORE_IDS.has(a.id))
    .map(toPublicExample);
  const resume = apps.find((a) => a.id === 'example-resume-bot');
  if (!resume) return apps;
  return [resume, ...apps.filter((a) => a.id !== 'example-resume-bot')];
}

export function getExampleApp(appId) {
  const app = loadExamples().find((a) => a.id === appId);
  if (!app) return null;
  return toPublicExample(app);
}

/** Clone a built-in example into the user's Firestore library. */
export async function installExampleApp(db, userId, exampleId) {
  const source = loadExamples().find((a) => a.id === exampleId);
  if (!source) return { ok: false, error: 'Example app not found.' };

  const cloneSpec = normalizeAppSpec(
    {
      title: source.title,
      tagline: source.tagline,
      summary: source.summary,
      theme: source.theme,
      icon: source.icon,
      pages: source.pages,
      slug: `${source.id.replace(/^example-/, '')}-copy`,
      sourceCommunityAppId: exampleId,
      visibility: 'private',
    },
    { ownerId: userId, sourceCommunityAppId: exampleId }
  );

  const saved = await saveUserApp(db, userId, cloneSpec);
  return { ok: true, app: saved, sourceAppId: exampleId };
}
