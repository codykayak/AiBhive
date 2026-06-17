import AsyncStorage from '@react-native-async-storage/async-storage';
import { HIVE_MISSION_MARKDOWN } from '../constants/hiveMissionBundled';

const MISSION_CACHE_KEY = 'hive_mission_v2';
const MISSION_API = 'https://aibhive.com/api/hive/mission';

let memoryMission = HIVE_MISSION_MARKDOWN;

function extractSections(md: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = md.split('\n');
  let current: string | null = null;
  let buf: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    if (h2 || h3) {
      if (current) map.set(current, buf.join('\n').trim());
      current = (h2 || h3)![1];
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) map.set(current, buf.join('\n').trim());
  return map;
}

export type MissionRole = 'chat' | 'triage' | 'cursor' | 'general';

/** Load cached mission, then refresh from server when online. */
export async function preloadHiveMission(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(MISSION_CACHE_KEY);
    if (cached) memoryMission = cached;
  } catch {
    // use bundled
  }

  try {
    const res = await fetch(MISSION_API);
    if (!res.ok) return;
    const data = (await res.json()) as { markdown?: string; version?: string };
    if (data.markdown?.trim()) {
      memoryMission = data.markdown;
      await AsyncStorage.setItem(MISSION_CACHE_KEY, data.markdown);
    }
  } catch {
    // offline — bundled or cache is fine
  }
}

export function getMissionMarkdown(): string {
  return memoryMission;
}

/** Compact authoritative block for LLM system prompts. */
export function getMissionPromptBlock(role: MissionRole = 'general'): string {
  const sections = extractSections(memoryMission);

  const header = sections.get('1. What this app is') || '';
  const loop = sections.get('3. The core loop — Hive Magic') || '';
  const existing =
    sections.get('5. Existing capabilities (NO build required)') ||
    sections.get('5. Existing capabilities (NO code change required)') ||
    '';
  const cursor =
    sections.get('6. Requires a new build (route `cursor`)') ||
    sections.get('6. Requires Cursor build (route `cursor`)') ||
    '';
  const tree = sections.get('7. Decision tree (all AIs)') || '';
  const contract = sections.get('9. Response contract (chat & local replies)') || '';
  const examples = sections.get('10. Example interactions') || '';

  if (role === 'triage') {
    const roles =
      sections.get('4b. Server triage / orchestrator AI (Gemini on Cloud Run)') ||
      sections.get('4. AI roles and responsibilities') ||
      '';
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
      sections.get('4c. Background build agent (internal — not shown to users)') ||
        sections.get('4c. Cursor Cloud build agent') ||
        '',
      cursor,
      sections.get('12. Internal — engineering pipeline (build agents ONLY — never show users)') ||
        sections.get('8. Technical context') ||
        '',
      '=== END BUILD AGENT MISSION ===',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  const chatRoles =
    sections.get('4a. On-device chat AI (Gemini / Kimi / Grok / Claude — user picks in Settings)') ||
    sections.get('4. AI roles and responsibilities') ||
    '';

  return [
    '=== HIVEMISSION (AUTHORITATIVE — follow exactly) ===',
    header,
    loop,
    chatRoles,
    existing,
    tree,
    contract,
    examples,
    '=== END HIVEMISSION ===',
  ]
    .filter(Boolean)
    .join('\n\n');
}
