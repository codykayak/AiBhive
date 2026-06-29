import { getOrCreateWebHiveUserId } from './hiveWebUser';
import { fetchFailureToolOffer, type FailureToolOffer } from './intelWebApi';

export type HomeAssistantIntent = 'chat' | 'jobs' | 'research' | 'build' | 'tool' | 'toolkit_offer';
export type HomeBuildStage = 'discover' | 'propose' | 'confirm' | 'none';

export type HomeAssistantAction = {
  reply: string;
  intent: HomeAssistantIntent;
  needsWebSearch?: boolean;
  webSearchQuery?: string;
  buildStage?: HomeBuildStage;
  buildSummary?: string;
  buildMessage?: string;
  intelIntent?: string;
  intelTargetType?: 'company' | 'domain' | 'person' | 'discovery';
  intelRegion?: string;
  intelRadiusMiles?: number;
  toolkitAppId?: string;
  toolkitTitle?: string;
  toolkitSummary?: string;
  toolkitIsExample?: boolean;
  guideSteps?: string[];
  offerBuild?: boolean;
  offerTokens?: boolean;
};

export type ChatTurn = { role: 'user' | 'ai'; content: string };

let knowledgeCache: string | null = null;

export async function preloadHomeAssistantKnowledge(): Promise<string> {
  if (knowledgeCache) return knowledgeCache;
  try {
    const res = await fetch('/api/hive/home-assist/knowledge');
    if (res.ok) {
      const data = await res.json();
      knowledgeCache = String(data.markdown || data.knowledge || '');
      return knowledgeCache;
    }
  } catch {
    // offline
  }
  return '';
}

async function buildSystemPrompt(userMessage?: string): Promise<string> {
  const knowledge = await preloadHomeAssistantKnowledge();
  return [
    'You are Bhive Builder — the user\'s smart operator for building apps and navigating AiBhive on the web.',
    '--- HOME ASSISTANT KNOWLEDGE ---',
    knowledge.slice(0, 20000),
    '--- WEB CONTEXT ---',
    'User is on aibhive.com in the browser. Route them to /app/research, /hive-apps/build, /hive-apps, /app/jobs.',
    'Respond ONLY with valid JSON as specified in the knowledge doc. No markdown fences.',
    userMessage ? `User is asking about: ${userMessage.slice(0, 200)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function parseAction(raw: string): HomeAssistantAction {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1].trim() : raw.trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const jsonSlice = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  const parsed = JSON.parse(jsonSlice) as Partial<HomeAssistantAction>;
  const reply = String(parsed.reply || '').trim();
  if (!reply) throw new Error('Missing reply');
  return {
    reply,
    intent: (parsed.intent as HomeAssistantIntent) || 'chat',
    needsWebSearch: !!parsed.needsWebSearch,
    webSearchQuery: parsed.webSearchQuery || '',
    buildStage: (parsed.buildStage as HomeBuildStage) || 'none',
    buildSummary: parsed.buildSummary || '',
    buildMessage: parsed.buildMessage || '',
    intelIntent: parsed.intelIntent || '',
    intelTargetType: parsed.intelTargetType,
    intelRegion: parsed.intelRegion || '',
    intelRadiusMiles: Number(parsed.intelRadiusMiles) || undefined,
    toolkitAppId: parsed.toolkitAppId || undefined,
    toolkitTitle: parsed.toolkitTitle || undefined,
    toolkitSummary: parsed.toolkitSummary || undefined,
    toolkitIsExample: !!parsed.toolkitIsExample,
    guideSteps: Array.isArray(parsed.guideSteps) ? parsed.guideSteps : undefined,
    offerBuild: !!parsed.offerBuild,
    offerTokens: !!parsed.offerTokens,
  };
}

function salvageReply(text: string): string {
  const match = text.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (match) {
    try {
      return JSON.parse(`"${match[1]}"`);
    } catch {
      return match[1].replace(/\\n/g, '\n');
    }
  }
  const stripped = text.replace(/```[\s\S]*?```/g, '').trim();
  if (stripped && !stripped.startsWith('{')) return stripped;
  return '';
}

export async function sendHomeAssistantTurn(
  history: ChatTurn[],
  userMessage: string
): Promise<{ ok: true; action: HomeAssistantAction } | { ok: false; needPayment?: boolean; amountUsd?: number; error?: string }> {
  try {
    const userId = getOrCreateWebHiveUserId();
    const systemInstruction = await buildSystemPrompt(userMessage);
    const res = await fetch('/api/hive/home-assist/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        history: history.map((t) => ({ role: t.role, content: t.content })),
        message: userMessage,
        systemInstruction,
      }),
    });
    const data = await res.json();
    if (res.status === 402) {
      return { ok: false, needPayment: true, amountUsd: data.amountUsd };
    }
    if (!res.ok) {
      return { ok: false, error: data.error || `Assistant failed (${res.status})` };
    }
    if (data.action?.reply) {
      return { ok: true, action: data.action as HomeAssistantAction };
    }
    const raw = String(data.text || data.reply || '');
    try {
      return { ok: true, action: parseAction(raw) };
    } catch {
      const salvaged = salvageReply(raw);
      return {
        ok: true,
        action: {
          reply: salvaged || raw || 'How can I help — jobs, research, or build a tool?',
          intent: 'chat',
          buildStage: 'none',
        },
      };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bhive Builder unavailable' };
  }
}

export async function runHomeAssistantWebSearch(
  query: string
): Promise<{ ok: true; summary: string; data: string } | { ok: false; error?: string; needPayment?: boolean; amountUsd?: number }> {
  try {
    const userId = getOrCreateWebHiveUserId();
    const res = await fetch('/api/hive/home-assist/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query }),
    });
    const data = await res.json();
    if (res.status === 402) {
      return { ok: false, needPayment: true, amountUsd: data.amountUsd };
    }
    if (!res.ok) return { ok: false, error: data.error || 'Search failed' };
    return { ok: true, summary: data.summary, data: data.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Search failed' };
  }
}

export { fetchFailureToolOffer, type FailureToolOffer };
