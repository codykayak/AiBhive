import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MISSION_PATH = path.join(__dirname, 'hive-mission.md');

let cachedMission = null;
let cachedMtime = 0;

/** @returns {string} Full mission markdown */
export function loadHiveMissionMarkdown() {
  try {
    const stat = fs.statSync(MISSION_PATH);
    if (!cachedMission || stat.mtimeMs !== cachedMtime) {
      cachedMission = fs.readFileSync(MISSION_PATH, 'utf8');
      cachedMtime = stat.mtimeMs;
    }
    return cachedMission;
  } catch {
    return FALLBACK_MISSION;
  }
}

/** Compact block for LLM system prompts (token-conscious). */
export function getMissionPromptBlock(role = 'general') {
  const full = loadHiveMissionMarkdown();
  const sections = extractSections(full);

  const header = sections.get('1. What this app is') || '';
  const loop = sections.get('3. The core loop — Hive Magic') || '';
  const roles =
    role === 'triage'
      ? sections.get('4b. Server triage / orchestrator AI (Gemini on Cloud Run)') ||
        sections.get('4. AI roles and responsibilities')
      : sections.get('4a. On-device chat AI (Gemini / Kimi / Grok / Claude — user picks in Settings)') ||
        sections.get('4. AI roles and responsibilities');
  const existing = sections.get('5. Existing capabilities (NO code change required)') || '';
  const cursor = sections.get('6. Requires Cursor build (route `cursor`)') || '';
  const tree = sections.get('7. Decision tree (all AIs)') || '';
  const contract = sections.get('9. Response contract (chat & local replies)') || '';
  const examples = sections.get('10. Example interactions') || '';

  if (role === 'triage') {
    return [
      '=== HIVEMISSION (AUTHORITATIVE — follow exactly) ===',
      header,
      loop,
      roles,
      existing,
      cursor,
      tree,
      contract,
      '=== END HIVEMISSION ===',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (role === 'cursor') {
    return [
      '=== BUILD AGENT MISSION ===',
      header,
      sections.get('4c. Cursor Cloud build agent') || '',
      cursor,
      sections.get('8. Technical context') || '',
      '=== END BUILD AGENT MISSION ===',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  // chat / general
  return [
    '=== HIVEMISSION (AUTHORITATIVE — follow exactly) ===',
    header,
    loop,
    roles,
    existing,
    tree,
    contract,
    examples,
    '=== END HIVEMISSION ===',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** @param {string} md */
function extractSections(md) {
  const map = new Map();
  const lines = md.split('\n');
  let current = null;
  let buf = [];

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    if (h2 || h3) {
      if (current) map.set(current, buf.join('\n').trim());
      current = (h2 || h3)[1];
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) map.set(current, buf.join('\n').trim());
  return map;
}

const FALLBACK_MISSION = `# AiBhive Hive Mission (fallback)
Taylored Mobile builds apps/modules via Hive Magic: describe → estimate → approve → Cursor agent → PR → ding.
Use existing My Apps tools when possible; route new features to Cursor build. Keep answers short.`;
