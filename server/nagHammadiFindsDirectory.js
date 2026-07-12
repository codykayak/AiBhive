/**
 * Nag Hammadi / Gnostic finds directory — starter knowledge for Research Lab.
 * Source of truth: shared/nag-hammadi-finds-directory.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MD_PATH = path.join(__dirname, '../shared/nag-hammadi-finds-directory.md');

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

export function getNagHammadiFindsDirectory({ maxChars = 28000 } = {}) {
  const raw = readRaw().trim();
  if (!raw) return '';
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars)}\n\n…(directory truncated for context window)`;
}

/**
 * Parse Pack A–G sections into { id, title, urls[], preview }.
 */
export function getNagHammadiDigPacks() {
  const full = readRaw();
  if (!full) return [];

  const packs = [];
  const packRe = /## (Pack [A-G][^\n]*)\n([\s\S]*?)(?=\n## Pack |\n## Complete|\n## Communal|\n## Assistant|\n---\n## )/g;
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

export function getNagHammadiStarterBrief({ maxChars = 5500 } = {}) {
  const full = readRaw();
  if (!full) {
    return [
      'Nag Hammadi scout: 3 digs with paste-ready URLs, then ask A/B/C.',
      'Topic tag: nag-hammadi. Never invent Coptic quotes.',
      'Start: https://archive.org/search?query=Nag+Hammadi+Library+in+English+Robinson&and[]=mediatype%3A%22texts%22',
      'Thomas: http://gnosis.org/naghamm/gosthom.html',
      'Pistis Sophia (PD): https://archive.org/search?query=Pistis+Sophia+Mead&and[]=mediatype%3A%22texts%22',
    ].join('\n');
  }

  const parts = [];
  const scout = full.match(/## Scout protocol[\s\S]*?(?=\n---|\n## How to)/);
  const how = full.match(/## How to answer[\s\S]*?(?=\n---|\n## Pack)/);
  const packA = full.match(/## Pack A[^\n]*\n[\s\S]*?(?=\n## Pack )/);
  const packB = full.match(/## Pack B[^\n]*\n[\s\S]*?(?=\n## Pack )/);
  const packG = full.match(/## Pack G[^\n]*\n[\s\S]*?(?=\n## Complete|\n## Communal)/);
  if (scout) parts.push(scout[0].trim());
  if (how) parts.push(how[0].trim());
  if (packA) parts.push(packA[0].trim());
  if (packB) parts.push(packB[0].trim());
  if (packG) parts.push(packG[0].trim());

  let brief = parts.join('\n\n') || full.slice(0, maxChars);
  if (brief.length > maxChars) {
    brief = `${brief.slice(0, maxChars)}\n…(brief truncated — full packs at GET /api/research-lab/nag-hammadi-finds)`;
  }
  return brief;
}

export function shouldInjectNagHammadiFinds(text = '') {
  return /nag.?hammadi|gnostic|gospel.?of.?thomas|apocryphon|valentinian|sethian|pleroma|thunder.?perfect|pistis.?sophia|gospel.?of.?philip|trimorphic/i.test(
    String(text),
  );
}
