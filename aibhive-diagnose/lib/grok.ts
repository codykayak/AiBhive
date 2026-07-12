import type { ChatAttachment, ChatMessage, TradePack } from './packs/types';
import { diagnoseLocally } from './knowledge/diagnoseEngine';
import { getCachedTipsContext } from './knowledge/remotePackCache';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = 'grok-2-vision-1212';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

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

CRITICAL: Stay on the equipment the user named. If they say dishwasher, do not discuss pools, dryers, or unrelated gear unless they clearly ask. Prefer the local library context when it matches. If local context looks off-topic, ignore it and answer for the named equipment only.${diagnosisExtra}`;
}

type ProsDiagnoseOk = { reply: string; tipIdsUsed: string[] };
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
      const data = (await res.json()) as { reply?: string; tipIdsUsed?: string[] };
      const reply = data.reply?.trim();
      if (!reply) return null;
      return { reply, tipIdsUsed: Array.isArray(data.tipIdsUsed) ? data.tipIdsUsed : [] };
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
  const local = diagnoseLocally(pack, userText, isDiagnosis);
  const remoteTips = await getCachedTipsContext(pack.id, userText);
  const localWithTips = remoteTips
    ? `${local.reply}\n\n**Shop / network tips**\n${remoteTips}`
    : local.reply;

  const baseLocal: DiagnoseReply = {
    reply: localWithTips,
    source: 'local',
    tipIdsUsed: [],
    matchedFaultIds: local.matchedFaultIds,
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
          notice: 'Sign in for Pros AI — showing pack library.',
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

  const userContent: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: opts.userText || (opts.isDiagnosis ? 'Diagnose this equipment photo.' : 'Help me on this job.'),
    },
  ];

  if (opts.attachment?.base64) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${opts.attachment.mimeType || 'image/jpeg'};base64,${opts.attachment.base64}`,
      },
    });
  }

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.EXPO_PUBLIC_GROK_MODEL || DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `${buildSystemPrompt(opts.pack, opts.isDiagnosis)}\n\nLocal library context:\n${opts.localContext.slice(0, 2500)}`,
          },
          ...history,
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
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
