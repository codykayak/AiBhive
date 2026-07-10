/**
 * Tartarian / Old World finds directory — starter knowledge for Research Lab assistants.
 * Source of truth: shared/tartarian-finds-directory.md
 *
 * Dig packs = topic → paste-ready URLs so Grok can scout + hand the user a place to dig.
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

function extractUrls(text = '') {
  return [...String(text).matchAll(/https?:\/\/[^\s)|>\]]+/g)].map((u) =>
    u[0].replace(/[.,;]+$/, ''),
  );
}

/**
 * Full directory markdown (optionally truncated).
 */
export function getTartarianFindsDirectory({ maxChars = 28000 } = {}) {
  const raw = readRaw().trim();
  if (!raw) return '';
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars)}\n\n…(directory truncated for context window)`;
}

/**
 * Parse Pack A–H sections into { id, title, urls[], notes }.
 * Headings in the MD are `## Pack X — …`
 */
export function getTartarianDigPacks() {
  const full = readRaw();
  if (!full) return [];

  const packs = [];
  const packRe = /## (Pack [A-H][^\n]*)\n([\s\S]*?)(?=\n## Pack |\n## Communal|\n## Assistant|\n---\n## )/g;
  let m;
  while ((m = packRe.exec(full)) !== null) {
    const title = m[1].trim();
    const body = m[2];
    const unique = [...new Set(extractUrls(body))];
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
    packs.push({
      id,
      title,
      urlCount: unique.length,
      urls: unique.slice(0, 40),
      preview: body
        .replace(/https?:\/\/[^\s)|>\]]+/g, '')
        .replace(/[|`*#-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 280),
    });
  }
  return packs;
}

/**
 * Compact always-on brief for Research Lab Grok / harvest director.
 * Emphasizes scout protocol + paste-ready dig URLs.
 */
export function getTartarianStarterBrief({ maxChars = 5500 } = {}) {
  const full = readRaw();
  if (!full) {
    return [
      'Tartarian scout mode: give 3 dig directions with paste-ready URLs, then ask A/B/C.',
      'Never invent quotes. Chron Am = search-results URLs only (not homepage).',
      'Starter: https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=Tartar&date1=1850&date2=1922&rows=20&searchType=basic',
      'Maps: https://www.davidrumsey.com/luna/servlet/view/search?q=star+fort',
      'Fairs: https://archive.org/search?query=world%27s+fair+official+views+1893',
    ].join('\n');
  }

  const parts = [];
  const scout = full.match(/## Scout protocol[\s\S]*?(?=\n---|\n## How to)/);
  const how = full.match(/## How to answer[\s\S]*?(?=\n---|\n## Pack)/);
  // Prefer Chron Am keywords + fairs + maps + mud-flood + cheap runs + cities
  const packIds = ['Pack B', 'Pack A', 'Pack C', 'Pack E', 'Pack H', 'Pack F', 'Pack D', 'Pack G'];
  for (const id of packIds) {
    const re = new RegExp(`## ${id}[^\\n]*\\n[\\s\\S]*?(?=\\n## Pack |\\n## Communal|\\n## Assistant|\\n---\\n## )`);
    const hit = full.match(re);
    if (hit) parts.push(hit[0].trim());
  }

  let brief = [
    scout ? scout[0].trim() : '',
    how ? how[0].trim().slice(0, 900) : '',
    ...parts,
  ]
    .filter(Boolean)
    .join('\n\n');

  if (!brief) brief = full;
  brief = `--- TARTARIAN SCOUT / DIG DIRECTORY (paste-ready URLs) ---\nWhen the question is vague: present 3 digs with URLs + probability hint, then ask which trail (A/B/C).\n\n${brief}`;
  if (brief.length > maxChars) brief = `${brief.slice(0, maxChars)}\n…(brief truncated — full packs at GET /api/research-lab/tartarian-finds)`;
  return brief;
}

/**
 * Detect whether a user question should pull Tartarian starter knowledge.
 */
export function shouldInjectTartarianFinds(text = '') {
  return /tartar|tartaria|old\s*world\s*reset|mud[\s-]?flood|star\s*fort|orphan\s*train|world'?s?\s*fair|white\s*city|sanborn|chronicling\s*america|foundling|bird'?s?\s*eye|exposition|columbian|louisiana\s*purchase|buried\s*(window|door|building)|street\s*grade|where\s*(should|do)\s*i\s*(dig|look|search)|find\s*(my\s*)?(probability|treasure)/i.test(
    String(text),
  );
}

export { MD_PATH as TARTARIAN_FINDS_PATH };
