/**
 * Tartarian / Old World finds directory — starter knowledge for Research Lab assistants.
 * Source of truth: shared/tartarian-finds-directory.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MD_PATH = path.join(__dirname, '../shared/tartarian-finds-directory.md');

let cachedRaw = null;
let cachedMtime = 0;

function readRaw() {
  try {
    const st = fs.statSync(MD_PATH);
    if (cachedRaw != null && st.mtimeMs === cachedMtime) return cachedRaw;
    cachedRaw = fs.readFileSync(MD_PATH, 'utf8');
    cachedMtime = st.mtimeMs;
    return cachedRaw;
  } catch {
    return cachedRaw || '';
  }
}

/**
 * Full directory markdown (optionally truncated).
 */
export function getTartarianFindsDirectory({ maxChars = 14000 } = {}) {
  const raw = readRaw().trim();
  if (!raw) return '';
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars)}\n\n…(directory truncated for context window)`;
}

/**
 * Compact always-on brief for Research Lab Grok / harvest director (~2.5–4k).
 */
export function getTartarianStarterBrief({ maxChars = 3500 } = {}) {
  const full = readRaw();
  if (!full) {
    return [
      'Tartarian research starters: use Chronicling America search-results URLs (not homepage),',
      'World’s Fair plate collections on Archive.org/LOC, Sanborn maps, Rumsey star-fort maps.',
      'Chron Am Tartar search: https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=Tartar&date1=1850&date2=1922&rows=20&searchType=basic',
    ].join(' ');
  }

  // Prefer the ready-to-paste URL section + how-to + first-runs
  const parts = [];
  const how = full.match(/## How to answer general questions[\s\S]*?(?=\n---|\n## )/);
  const urls = full.match(/### Ready-to-paste search URLs[\s\S]*?(?=\n### |\n---|\n## )/);
  const runs = full.match(/## G\. Suggested Fable Scrape[\s\S]*?(?=\n---|\n## )/);
  const cities = full.match(/## F\. High-signal American city dossiers[\s\S]*?(?=\n---|\n## )/);
  if (how) parts.push(how[0].trim());
  if (urls) parts.push(urls[0].trim());
  if (cities) parts.push(cities[0].trim().slice(0, 1200));
  if (runs) parts.push(runs[0].trim());

  let brief = parts.join('\n\n') || full;
  brief = `--- TARTARIAN / OLD WORLD FINDS DIRECTORY (starter leads) ---\n${brief}`;
  if (brief.length > maxChars) brief = `${brief.slice(0, maxChars)}\n…(brief truncated)`;
  return brief;
}

/**
 * Detect whether a user question should pull Tartarian starter knowledge.
 */
export function shouldInjectTartarianFinds(text = '') {
  return /tartar|tartaria|old\s*world\s*reset|mud[\s-]?flood|star\s*fort|orphan\s*train|world'?s?\s*fair|white\s*city|sanborn|chronicling\s*america|foundling/i.test(
    String(text),
  );
}

export { MD_PATH as TARTARIAN_FINDS_PATH };
