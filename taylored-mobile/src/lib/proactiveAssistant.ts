/**
 * Proactive assistant — Grok 3 for brief insights; Grok 4 stays on main chat (settings default).
 */
import { getOrCreateHiveUserId } from './hiveApi';
import { getActiveLlmConfig } from './settings';
import { sendChatMessage, type ChatTurn } from './llm';
import {
  buildActivitySnapshot,
  snapshotToPromptContext,
  type UserActivitySnapshot,
} from './userActivityLog';
import { daySeed, pickMotivationLine } from '../constants/dailyMotivation';
import { loadProactivePrefs } from './proactivePrefs';

const HIVE_API_BASE = 'https://aibhive.com';
export const PROACTIVE_MODEL = 'grok-3-mini';

export type DailyBrief = {
  title: string;
  body: string;
  actionHint?: string;
  source: 'template' | 'grok3' | 'hive_cloud';
};

function templateBrief(snapshot: UserActivitySnapshot): DailyBrief {
  const seed = daySeed();
  const line = pickMotivationLine(seed);
  const parts: string[] = [line];

  if (snapshot.submittedJobs > 0) {
    parts.push(`You have ${snapshot.submittedJobs} submitted application${snapshot.submittedJobs === 1 ? '' : 's'} — a follow-up today could stand out.`);
  } else if (snapshot.jobCount === 0) {
    parts.push('Open Job Tracker or tell the assistant you want a better job — we will help you start.');
  }

  if (snapshot.buildingApps > 0) {
    parts.push(`${snapshot.buildingApps} build${snapshot.buildingApps === 1 ? ' is' : 's are'} in progress. Check My Apps when you hear the hive chime.`);
  } else if (snapshot.recentResearch.length > 0) {
    parts.push(`You researched ${snapshot.recentResearch[0]} — turn that into action in chat.`);
  }

  return {
    title: '🐝 Good morning from AiBhive',
    body: parts.join(' '),
    actionHint: 'Open AiBhive and pick one small win today.',
    source: 'template',
  };
}

async function briefViaByokGrok3(snapshot: UserActivitySnapshot): Promise<DailyBrief | null> {
  const config = await getActiveLlmConfig();
  if (!config || config.providerId !== 'grok' || !config.apiKey?.trim()) return null;

  const grok3Config = { ...config, model: PROACTIVE_MODEL };

  const system = [
    'You write a short daily push notification for the AiBhive app (job search, app building, research).',
    'Tone: warm, motivational, confident — help them conquer their goals without being cheesy.',
    'Respond ONLY with JSON: {"title":"...","body":"...","actionHint":"..."}',
    'Keep title under 40 chars, body under 220 chars, actionHint under 60 chars.',
  ].join(' ');

  const userMsg = `User activity snapshot:\n${snapshotToPromptContext(snapshot)}\n\nWrite today's motivational notification plus one concrete AiBhive action they could take today.`;

  try {
    const raw = await sendChatMessage(
      grok3Config,
      [] as ChatTurn[],
      userMsg,
      {
        systemInstructionOverride: system,
        behavior: { customInstructions: '', responseStyle: 'concise', maxOutputTokens: 180 },
      }
    );
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<DailyBrief>;
    if (!parsed.body?.trim()) return null;
    return {
      title: String(parsed.title || '🐝 AiBhive daily').slice(0, 48),
      body: String(parsed.body).slice(0, 280),
      actionHint: parsed.actionHint ? String(parsed.actionHint).slice(0, 80) : undefined,
      source: 'grok3',
    };
  } catch {
    return null;
  }
}

async function briefViaHiveCloud(snapshot: UserActivitySnapshot): Promise<DailyBrief | null> {
  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/proactive/daily-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, snapshot }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.body) return null;
    return {
      title: String(data.title || '🐝 AiBhive daily'),
      body: String(data.body),
      actionHint: data.actionHint ? String(data.actionHint) : undefined,
      source: 'hive_cloud',
    };
  } catch {
    return null;
  }
}

/** Build today's push notification body. Uses Grok 3 when prefs allow, else template. */
export async function buildDailyBrief(): Promise<DailyBrief> {
  const prefs = await loadProactivePrefs();
  const snapshot = await buildActivitySnapshot();
  const fallback = templateBrief(snapshot);

  if (!prefs.smartSuggestions) {
    return fallback;
  }

  const byok = await briefViaByokGrok3(snapshot);
  if (byok) return byok;

  const cloud = await briefViaHiveCloud(snapshot);
  if (cloud) return cloud;

  return fallback;
}

export type QuickInsight = {
  bullets: string[];
  source: 'template' | 'grok3' | 'hive_cloud';
};

export async function fetchQuickInsights(): Promise<QuickInsight> {
  const snapshot = await buildActivitySnapshot();
  const prefs = await loadProactivePrefs();
  if (!prefs.smartSuggestions) {
    return { bullets: [], source: 'template' };
  }

  const config = await getActiveLlmConfig();
  if (config?.providerId === 'grok' && config.apiKey?.trim()) {
    try {
      const grok3Config = { ...config, model: PROACTIVE_MODEL };
      const raw = await sendChatMessage(
        grok3Config,
        [],
        `Based on this activity, return JSON {"bullets":["...","...","..."]} with exactly 3 short helpful suggestions (under 90 chars each). No jargon.\n\n${snapshotToPromptContext(snapshot)}`,
        {
          systemInstructionOverride: 'Respond ONLY with valid JSON.',
          behavior: { customInstructions: '', responseStyle: 'concise', maxOutputTokens: 200 },
        }
      );
      const parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as { bullets?: string[] };
      if (parsed.bullets?.length) {
        return { bullets: parsed.bullets.slice(0, 3), source: 'grok3' };
      }
    } catch {
      // fall through
    }
  }

  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/proactive/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, snapshot }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.bullets) && data.bullets.length) {
        return { bullets: data.bullets.slice(0, 3), source: 'hive_cloud' };
      }
    }
  } catch {
    // ignore
  }

  const bullets: string[] = [];
  if (snapshot.submittedJobs > 0) bullets.push('Follow up on a submitted application this week.');
  if (snapshot.jobCount === 0) bullets.push('Start your first application kit with Auto-Bot Resume.');
  if (snapshot.recentResearch.length) bullets.push(`Turn your ${snapshot.recentResearch[0]} research into next steps in chat.`);
  if (snapshot.buildingApps === 0 && bullets.length < 3) bullets.push('Describe a tool you wish you had — Hive Magic can build it.');
  return { bullets: bullets.slice(0, 3), source: 'template' };
}
