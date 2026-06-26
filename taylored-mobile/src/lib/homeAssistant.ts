import { sendChatMessage, generateWithParts, type ChatTurn } from './llm';
import type { HiveAttachment } from './hiveAttachments';
import type { ActiveLlmConfig } from './settings';
import { loadHomeAssistantKnowledge } from './homeAssistantKnowledge';
import { getMissionPromptBlock } from './hiveMission';
import { fetchUserApps, fetchCommunityToolkit } from './hiveUserApps';
import { createHiveTask, getOrCreateHiveUserId, type HiveTask } from './hiveApi';

const HIVE_API_BASE = 'https://aibhive.com';

export type HomeAssistantIntent = 'chat' | 'jobs' | 'research' | 'build' | 'tool';
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
  intelTargetType?: 'company' | 'domain' | 'person';
  intelRegion?: string;
  intelRadiusMiles?: number;
  suggestedToolName?: string;
  offerTokens?: boolean;
  tokenReason?: string;
};

export type HomeAssistantTurnResult = {
  action: HomeAssistantAction;
  /** Set when buildStage=confirm and server task was created */
  buildTask?: HiveTask;
};

function parseJsonBlock(text: string): HomeAssistantAction {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const jsonSlice = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  const parsed = JSON.parse(jsonSlice) as Partial<HomeAssistantAction>;
  return {
    reply: String(parsed.reply || 'How can I help you today?'),
    intent: (parsed.intent as HomeAssistantIntent) || 'chat',
    needsWebSearch: !!parsed.needsWebSearch,
    webSearchQuery: parsed.webSearchQuery || '',
    buildStage: (parsed.buildStage as HomeBuildStage) || 'none',
    buildSummary: parsed.buildSummary || '',
    buildMessage: parsed.buildMessage || '',
    intelIntent: parsed.intelIntent || '',
    intelTargetType: parsed.intelTargetType as HomeAssistantAction['intelTargetType'],
    intelRegion: parsed.intelRegion || '',
    intelRadiusMiles: Number(parsed.intelRadiusMiles) || undefined,
    suggestedToolName: parsed.suggestedToolName || '',
    offerTokens: !!parsed.offerTokens,
    tokenReason: parsed.tokenReason || '',
  };
}

export type HomeAssistantMode = 'plan' | 'build';

function buildModeBlock(mode: HomeAssistantMode | undefined): string {
  if (mode === 'plan') {
    return [
      '--- CURRENT INTERACTION MODE: PLAN ONLY ---',
      'The user has switched the assistant into PLAN ONLY mode. Your job is to DISCUSS, BRAINSTORM, and PLAN — never trigger a real build.',
      '- Ask clarifying questions whenever the request is vague.',
      '- Propose detailed app plans (pages, data, UX) and refine them with the user.',
      '- NEVER set "buildStage" to "confirm". The maximum buildStage allowed is "propose".',
      '- Always finish with: "Flip the toggle to **Build** when you are ready and I will spin it up." or similar.',
    ].join('\n');
  }
  return [
    '--- CURRENT INTERACTION MODE: BUILD ---',
    'The user has the assistant in BUILD mode. You may ask onboarding questions, propose a plan, and once they confirm, set "buildStage" to "confirm" with a complete "buildMessage" spec.',
    'If the user has not given you enough detail, ASK FOR CLARIFICATION before proposing — see the "Clarify-first rule" in the knowledge doc.',
  ].join('\n');
}

async function buildSystemPrompt(
  userMessage?: string,
  mode?: HomeAssistantMode
): Promise<string> {
  const [knowledge, apps, toolkit] = await Promise.all([
    loadHomeAssistantKnowledge(),
    fetchUserApps(),
    userMessage?.trim() ? fetchCommunityToolkit(userMessage.trim()) : fetchCommunityToolkit(),
  ]);
  const appList =
    apps.length > 0
      ? apps
          .slice(0, 12)
          .map((a) => `- ${a.title}: ${a.tagline || a.summary || a.slug}`)
          .join('\n')
      : '(none yet — user can build their first app)';

  const toolkitList =
    toolkit.length > 0
      ? toolkit
          .slice(0, 10)
          .map((a) => `- ${a.title} (${a.installCount || 0} installs): ${a.summary || a.tagline || ''}`)
          .join('\n')
      : '(empty — new builds are auto-shared to grow the hive)';

  return [
    'You are the AiBhive home assistant — the user\'s smart operator for the whole app. You run on Hive credits by default.',
    getMissionPromptBlock('general'),
    '--- HOME ASSISTANT KNOWLEDGE (RAG) ---',
    knowledge,
    '--- USER CLOUD TOOLS ---',
    appList,
    '--- COMMUNITY TOOLKIT (shared by all users — suggest before building duplicates) ---',
    toolkitList,
    'If the user wants something already in the community toolkit, suggest installing it (free) instead of building from scratch.',
    buildModeBlock(mode),
    'Respond ONLY with valid JSON as specified in the knowledge doc. No markdown fences.',
  ].join('\n\n');
}

export async function runHomeAssistantWebSearch(query: string): Promise<
  | { ok: true; summary: string; data: string; costUsd?: number }
  | { ok: false; needPayment?: boolean; amountUsd?: number; error?: string }
> {
  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/home-assist/web-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query }),
    });
    const data = await res.json();
    if (res.status === 402) {
      return { ok: false, needPayment: true, amountUsd: data.amountUsd, error: data.error };
    }
    if (!res.ok) {
      return { ok: false, error: data.error || `Search failed (${res.status})` };
    }
    return { ok: true, summary: data.summary, data: data.data, costUsd: data.chargedUsd };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Web search unavailable' };
  }
}

export async function sendHomeAssistantTurnViaHiveCloud(
  history: ChatTurn[],
  userMessage: string,
  options: {
    webSearchContext?: string;
    attachment?: HiveAttachment;
    mode?: HomeAssistantMode;
  } = {}
): Promise<{ ok: true; raw: string } | { ok: false; needPayment?: boolean; amountUsd?: number; error?: string }> {
  try {
    const userId = await getOrCreateHiveUserId();
    const systemInstruction = await buildSystemPrompt(userMessage, options.mode);
    const enrichedMessage = options.webSearchContext
      ? `${userMessage}\n\n[WEB SEARCH RESULTS — use these to answer, then suggest next steps]\n${options.webSearchContext}`
      : userMessage;

    const res = await fetch(`${HIVE_API_BASE}/api/hive/home-assist/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        history: history.map((t) => ({ role: t.role, content: t.content })),
        message: enrichedMessage,
        systemInstruction,
        attachmentBase64: options.attachment?.base64,
        attachmentMime: options.attachment?.mimeType,
        attachmentWidth: options.attachment?.width,
        attachmentHeight: options.attachment?.height,
      }),
    });
    const data = await res.json();
    if (res.status === 402) {
      return { ok: false, needPayment: true, amountUsd: data.amountUsd };
    }
    if (!res.ok) {
      return { ok: false, error: data.error || `Hive chat failed (${res.status})` };
    }
    return { ok: true, raw: String(data.text || '') };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Hive chat unavailable' };
  }
}

async function parseAssistantRaw(raw: string): Promise<HomeAssistantAction> {
  try {
    return parseJsonBlock(raw);
  } catch {
    return {
      reply: raw.replace(/```[\s\S]*?```/g, '').trim() || 'I\'m here to help — try asking about jobs, research, or building a tool.',
      intent: 'chat',
      buildStage: 'none',
    };
  }
}

async function finalizeHomeAssistantTurn(
  action: HomeAssistantAction,
  history: ChatTurn[],
  userMessage: string,
  config: ActiveLlmConfig | null,
  mode: HomeAssistantMode | undefined
): Promise<HomeAssistantTurnResult> {
  if (action.needsWebSearch && action.webSearchQuery?.trim()) {
    const search = await runHomeAssistantWebSearch(action.webSearchQuery.trim());
    if (!search.ok) {
      return {
        action: {
          ...action,
          reply:
            action.reply +
            (search.needPayment
              ? `\n\nThis needs **Hive credits** for web search (~$${(search.amountUsd ?? 0.03).toFixed(2)}). Open Settings → Add Hive credits.`
              : `\n\n(Web search unavailable: ${search.error})`),
          needsWebSearch: false,
          offerTokens: search.needPayment,
        },
      };
    }
    const context = `${search.summary}\n\n${search.data}`.slice(0, 12000);
    return sendHomeAssistantTurn(history, userMessage, { webSearchContext: context, mode }, config);
  }

  // Safety net: in plan-only mode, never trigger an actual build, even if the AI ignored the rule.
  if (mode === 'plan' && action.buildStage === 'confirm') {
    action = {
      ...action,
      buildStage: 'propose',
      reply:
        action.reply +
        '\n\n_(Plan-only mode is on — flip the toggle to **Build** to spin this up for real.)_',
    };
  }

  let buildTask: HiveTask | undefined;
  if (action.buildStage === 'confirm' && action.buildMessage?.trim()) {
    try {
      const userId = await getOrCreateHiveUserId();
      buildTask = await createHiveTask(action.buildMessage.trim(), userId);
    } catch {
      action = {
        ...action,
        reply:
          action.reply +
          '\n\n(I couldn\'t reach the build service — open **Build** to try again, or check your connection.)',
        buildStage: 'propose',
      };
    }
  }

  return { action, buildTask };
}

export async function sendHomeAssistantTurn(
  history: ChatTurn[],
  userMessage: string,
  options: {
    webSearchContext?: string;
    attachment?: HiveAttachment;
    mode?: HomeAssistantMode;
  } = {},
  byokConfig?: ActiveLlmConfig | null
): Promise<HomeAssistantTurnResult> {
  let raw = '';
  const mode = options.mode;

  if (!options.webSearchContext) {
    const cloud = await sendHomeAssistantTurnViaHiveCloud(history, userMessage, options);
    if (cloud.ok) {
      raw = cloud.raw;
    } else if (byokConfig?.apiKey?.trim()) {
      const systemInstruction = await buildSystemPrompt(userMessage, mode);
      const enrichedMessage = options.webSearchContext
        ? `${userMessage}\n\n[WEB SEARCH RESULTS]\n${options.webSearchContext}`
        : userMessage;
      if (options.attachment?.base64 && byokConfig.providerId === 'gemini') {
        raw = await generateWithParts(
          byokConfig,
          `${systemInstruction}\n\nRespond ONLY with valid JSON as specified in the knowledge doc. No markdown fences.\n\nUser message:\n${enrichedMessage}`,
          [
            {
              inlineData: {
                data: options.attachment.base64,
                mimeType: options.attachment.mimeType || 'image/jpeg',
              },
            },
          ],
          { behavior: { customInstructions: '', responseStyle: 'balanced', maxOutputTokens: 1200 } }
        );
      } else {
        raw = await sendChatMessage(byokConfig, history, enrichedMessage, {
          systemInstructionOverride: systemInstruction,
          behavior: { customInstructions: '', responseStyle: 'balanced', maxOutputTokens: 1200 },
        });
      }
    } else {
      const action: HomeAssistantAction = {
        reply: cloud.needPayment
          ? `This needs **Hive credits** to continue (~$${(cloud.amountUsd ?? 0.02).toFixed(2)}). Open **Settings → Add Hive credits**, or add your own API key under AI providers if you prefer.`
          : `AiBhive assistant is reconnecting (${cloud.error || 'offline'}). Try again in a moment, or add your own API key in Settings.`,
        intent: 'chat',
        buildStage: 'none',
        offerTokens: cloud.needPayment,
      };
      return { action };
    }
  } else if (byokConfig?.apiKey?.trim()) {
    const systemInstruction = await buildSystemPrompt(userMessage, mode);
    raw = await sendChatMessage(byokConfig, history, userMessage, {
      systemInstructionOverride: systemInstruction,
      behavior: { customInstructions: '', responseStyle: 'balanced', maxOutputTokens: 1200 },
    });
  } else {
    const cloud = await sendHomeAssistantTurnViaHiveCloud(history, userMessage, options);
    if (!cloud.ok) {
      return {
        action: {
          reply: cloud.needPayment
            ? `Add **Hive credits** in Settings to continue (~$${(cloud.amountUsd ?? 0.02).toFixed(2)}).`
            : `AiBhive assistant unavailable: ${cloud.error}`,
          intent: 'chat',
          buildStage: 'none',
        },
      };
    }
    raw = cloud.raw;
  }

  const action = await parseAssistantRaw(raw);
  return finalizeHomeAssistantTurn(action, history, userMessage, byokConfig ?? null, mode);
}
