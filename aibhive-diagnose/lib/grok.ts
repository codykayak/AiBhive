import type { ChatAttachment, ChatMessage, TradePack } from './packs/types';
import { diagnoseLocally } from './knowledge/diagnoseEngine';
import type { ManualSearchLink } from './knowledge/manualSearch';
import { buildLocalManualDorkLinks, extractModelCandidates } from './knowledge/manualSearch';
import { getCachedTipsContext } from './knowledge/remotePackCache';
import { buildOfflineReply, isMetaAppQuestion, type MetaAppReplyOpts } from '@/lib/diagnose/offlineConversation';
import { fetchProsAiStatus } from '@/lib/diagnose/aiStatus';
import { buildGrokUserContent } from '@/lib/diagnose/grokMessage';
import { hasFullPackLibraryAccess } from '@/lib/packs/access';
import { API_BASE } from '@/lib/config/apiBase';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = 'grok-2-vision-1212';

export type GrokChatRequest = {
  pack: TradePack;
  messages: ChatMessage[];
  userText: string;
  attachment?: ChatAttachment;
  /** Optional direct key (dev only). Prefer Pros proxy via getIdToken. */
  apiKey?: string;
  /** Firebase ID token — enables server-side company/platform Grok. */
  getIdToken?: () => Promise<string | null>;
  /** When true, skip all network AI and return pack library only. */
  offline?: boolean;
};

export type DiagnoseSource = 'local' | 'pros' | 'direct';

export type DiagnoseNoticeCode =
  | 'offline'
  | 'billing_required'
  | 'no_key'
  | 'no_company'
  | 'auth_required'
  | 'network_error'
  | 'diagnose_failed';

export type DiagnoseReply = {
  reply: string;
  source: DiagnoseSource;
  tipIdsUsed?: string[];
  matchedFaultIds?: string[];
  notice?: string;
  noticeCode?: DiagnoseNoticeCode;
  manualSearchLinks?: ManualSearchLink[];
};

export { buildLocalDiagnosisReply } from './localReply';

function buildSystemPrompt(pack: TradePack, isDiagnosis: boolean): string {
  const diagnosisExtra = isDiagnosis
    ? `

The user attached a photo of equipment. Respond with a structured field diagnosis using these exact markdown headers:
**Quick summary**
**Likely causes**
**Step-by-step checks**
**Safety notes**
**Parts / tools**
Keep language concise for a tech on a job site.`
    : `

When giving repair guidance, prefer these markdown headers when it fits:
**Quick summary**
**Likely causes**
**Step-by-step checks**
**Safety notes**
**Parts / tools**`;

  return `${pack.systemPrompt}

SCOPE — ACTIVE TRADE PACK: ${pack.name} (${pack.id})
You help field techs on: ${pack.commonEquipment.join(', ')}.
Stay inside trades relevant to this pack (and closely related cross-trade issues the user clearly named). Refuse or briefly redirect hobbies, medical advice, legal advice, politics, or unrelated consumer questions.

CRITICAL EQUIPMENT LOCK:
- Stay on the equipment / fixture the user named (bathtub ≠ dishwasher ≠ washer ≠ pool).
- If local library context names different equipment, IGNORE that context and answer for the user's equipment only.
- Prefer local library + shop tips when they match. If the library has no match, use solid trade practice for that equipment.
- When you need knowledge beyond the local library, stick to reputable trade practice for this pack — do not invent brand-specific torque specs or part numbers. Ask for brand/model when it changes the answer.
- Keep steps glove-friendly, safety-first, and short enough to read on a phone at a job site.${diagnosisExtra}`;
}

type ProsDiagnoseOk = {
  reply: string;
  tipIdsUsed: string[];
  manualSearchLinks?: ManualSearchLink[];
};
type ProsDiagnoseErr = { error: true; notice: string; noticeCode: DiagnoseNoticeCode };

async function askProsDiagnose(opts: {
  token: string;
  pack: TradePack;
  messages: ChatMessage[];
  userText: string;
  attachment?: ChatAttachment;
  localContext: string;
  isDiagnosis: boolean;
}): Promise<ProsDiagnoseOk | ProsDiagnoseErr | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/pros/diagnose`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt: buildSystemPrompt(opts.pack, opts.isDiagnosis),
        localContext: opts.localContext,
        userText: opts.userText,
        packId: opts.pack.id,
        messages: opts.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content })),
        attachment: opts.attachment?.base64
          ? { base64: opts.attachment.base64, mimeType: opts.attachment.mimeType || 'image/jpeg' }
          : null,
        model: process.env.EXPO_PUBLIC_GROK_MODEL || DEFAULT_MODEL,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        reply?: string;
        tipIdsUsed?: string[];
        manualSearchLinks?: ManualSearchLink[];
      };
      const reply = data.reply?.trim();
      if (!reply) return null;
      return {
        reply,
        tipIdsUsed: Array.isArray(data.tipIdsUsed) ? data.tipIdsUsed : [],
        manualSearchLinks: Array.isArray(data.manualSearchLinks) ? data.manualSearchLinks : [],
      };
    }

    let notice = 'Pros AI unavailable — showing pack library.';
    let noticeCode: DiagnoseNoticeCode = 'diagnose_failed';
    try {
      const body = (await res.json()) as { error?: string; code?: string };
      if (body.error) notice = body.error;
      if (body.code === 'billing_required' || res.status === 402) noticeCode = 'billing_required';
      else if (body.code === 'no_key' || res.status === 503) noticeCode = 'no_key';
      else if (body.code === 'no_company' || res.status === 403) noticeCode = 'no_company';
    } catch {
      if (res.status === 402) {
        notice = 'Subscription required for live AI.';
        noticeCode = 'billing_required';
      } else if (res.status === 403) {
        notice = 'Join a Pros company to use live AI.';
        noticeCode = 'no_company';
      } else if (res.status === 503) {
        notice = 'No Grok key configured in Pros → AI Keys.';
        noticeCode = 'no_key';
      }
    }
    return { error: true, notice, noticeCode };
  } catch {
    return {
      error: true,
      notice: 'Network error reaching Pros AI — showing pack library.',
      noticeCode: 'network_error',
    };
  }
}

/** Prefer Pros proxy (paid/trial company keys). Fall back to local pack library. */
export async function askGrok(req: GrokChatRequest): Promise<string> {
  const result = await askGrokDetailed(req);
  return result.reply;
}

export async function askGrokDetailed({
  pack,
  messages,
  userText,
  attachment,
  apiKey,
  getIdToken,
  offline = false,
}: GrokChatRequest): Promise<DiagnoseReply> {
  const isDiagnosis = Boolean(attachment);
  let fullLibrary = false;
  if (!offline && getIdToken) {
    try {
      const token = await getIdToken();
      fullLibrary = hasFullPackLibraryAccess(Boolean(token));
    } catch {
      fullLibrary = false;
    }
  }

  if (!isDiagnosis) {
    let metaOpts: MetaAppReplyOpts | undefined;
    let liveAiReady = false;
    if (!offline && getIdToken && API_BASE) {
      try {
        const token = await getIdToken();
        if (token) {
          const status = await fetchProsAiStatus(token);
          if (status?.aiEnabled) liveAiReady = true;
          if (isMetaAppQuestion(userText) && status) {
            metaOpts = {
              offline,
              aiConfigured: status.configured,
              aiEnabled: status.aiEnabled,
            };
          }
        }
      } catch {
        // use generic meta reply
      }
    }
    if (!metaOpts && isMetaAppQuestion(userText)) metaOpts = { offline };
    const conversational = buildOfflineReply(pack, userText, false, metaOpts, { liveAiReady });
    if (conversational) {
      return {
        reply: conversational.reply,
        source: 'local',
        tipIdsUsed: [],
        matchedFaultIds: conversational.matchedFaultIds,
      };
    }
  }

  const local = diagnoseLocally(pack, userText, isDiagnosis, { fullLibrary });
  const remoteTips = await getCachedTipsContext(pack.id, userText);
  const localWithTips = remoteTips
    ? `${local.reply}\n\n**Shop / network tips**\n${remoteTips}`
    : local.reply;

  const baseLocal: DiagnoseReply = {
    reply: localWithTips,
    source: 'local',
    tipIdsUsed: [],
    matchedFaultIds: local.matchedFaultIds,
    manualSearchLinks:
      local.matchedFaultIds.length === 0 && extractModelCandidates(userText).length > 0
        ? buildLocalManualDorkLinks(userText)
        : [],
  };

  // Offline-first: never hang on bad cell service.
  if (offline) {
    return {
      ...baseLocal,
      notice: 'Offline — using pack library only.',
      noticeCode: 'offline',
    };
  }

  // 1) Pros company / platform key via server proxy (keys never on device)
  if (getIdToken && API_BASE) {
    try {
      const token = await getIdToken();
      if (token) {
        const proxied = await askProsDiagnose({
          token,
          pack,
          messages,
          userText,
          attachment,
          localContext: localWithTips,
          isDiagnosis,
        });
        if (proxied && !('error' in proxied)) {
          return {
            reply: proxied.reply,
            source: 'pros',
            tipIdsUsed: proxied.tipIdsUsed,
            matchedFaultIds: local.matchedFaultIds,
            manualSearchLinks: proxied.manualSearchLinks?.length
              ? proxied.manualSearchLinks
              : undefined,
          };
        }
        if (proxied && 'error' in proxied) {
          // Fall through to direct key / local, but keep the notice.
          const direct = await tryDirectGrok({
            pack,
            messages,
            userText,
            attachment,
            apiKey,
            localContext: localWithTips,
            isDiagnosis,
            localReply: localWithTips,
            matchedFaultIds: local.matchedFaultIds,
          });
          if (direct.source !== 'local') return direct;
          return {
            ...baseLocal,
            reply: `${localWithTips}\n\n_(${proxied.notice})_`,
            notice: proxied.notice,
            noticeCode: proxied.noticeCode,
          };
        }
      } else {
        // Signed-out: try direct key, else local with hint
        const direct = await tryDirectGrok({
          pack,
          messages,
          userText,
          attachment,
          apiKey,
          localContext: localWithTips,
          isDiagnosis,
          localReply: localWithTips,
          matchedFaultIds: local.matchedFaultIds,
        });
        if (direct.source !== 'local') return direct;
        return {
          ...baseLocal,
          notice: 'Sign in with your team code (Account tab) to unlock Pros AI.',
          noticeCode: 'auth_required',
        };
      }
    } catch {
      // Fall through
    }
  }

  return tryDirectGrok({
    pack,
    messages,
    userText,
    attachment,
    apiKey,
    localContext: localWithTips,
    isDiagnosis,
    localReply: localWithTips,
    matchedFaultIds: local.matchedFaultIds,
  });
}

async function tryDirectGrok(opts: {
  pack: TradePack;
  messages: ChatMessage[];
  userText: string;
  attachment?: ChatAttachment;
  apiKey?: string;
  localContext: string;
  isDiagnosis: boolean;
  localReply: string;
  matchedFaultIds: string[];
}): Promise<DiagnoseReply> {
  const key = opts.apiKey || process.env.EXPO_PUBLIC_GROK_API_KEY || '';
  if (!key) {
    return {
      reply: opts.localReply,
      source: 'local',
      tipIdsUsed: [],
      matchedFaultIds: opts.matchedFaultIds,
    };
  }

  const history = opts.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-8)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const userContent = buildGrokUserContent(
    opts.userText || (opts.isDiagnosis ? 'Diagnose this equipment photo.' : 'Help me on this job.'),
    opts.attachment
  );

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: opts.attachment?.base64
          ? process.env.EXPO_PUBLIC_GROK_VISION_MODEL || DEFAULT_MODEL
          : process.env.EXPO_PUBLIC_GROK_CHAT_MODEL || 'grok-3-mini',
        messages: [
          {
            role: 'system',
            content: `${buildSystemPrompt(opts.pack, opts.isDiagnosis)}\n\nLocal library context:\n${opts.localContext.slice(0, 2500)}`,
          },
          ...history,
          { role: 'user', content: userContent },
        ],
        temperature: 0.25,
      }),
    });

    if (!response.ok) {
      return {
        reply: `${opts.localReply}\n\n_(Grok unreachable — showing pack library result.)_`,
        source: 'local',
        tipIdsUsed: [],
        matchedFaultIds: opts.matchedFaultIds,
        notice: 'Grok unreachable',
        noticeCode: 'network_error',
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      reply: data.choices?.[0]?.message?.content?.trim() || opts.localReply,
      source: 'direct',
      tipIdsUsed: [],
      matchedFaultIds: opts.matchedFaultIds,
    };
  } catch {
    return {
      reply: `${opts.localReply}\n\n_(Network error — pack library result.)_`,
      source: 'local',
      tipIdsUsed: [],
      matchedFaultIds: opts.matchedFaultIds,
      notice: 'Network error',
      noticeCode: 'network_error',
    };
  }
}
