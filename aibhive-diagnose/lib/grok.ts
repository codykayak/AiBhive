import type { ChatAttachment, ChatMessage, TradePack } from './packs/types';
import { diagnoseLocally } from './knowledge/diagnoseEngine';

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
};

export type DiagnoseSource = 'local' | 'pros' | 'direct';

export type DiagnoseReply = {
  reply: string;
  source: DiagnoseSource;
};

export { buildLocalDiagnosisReply } from './localReply';

function buildSystemPrompt(pack: TradePack, isDiagnosis: boolean): string {
  const diagnosisExtra = isDiagnosis
    ? `

The user attached a photo of equipment. Respond with a structured field diagnosis:
1) Quick summary (1-2 sentences)
2) Likely causes (bulleted)
3) Step-by-step checks / repair guidance
4) Safety notes
5) Parts / tools to have ready
Keep language concise for a tech on a job site.`
    : '';

  return `${pack.systemPrompt}

CRITICAL: Stay on the equipment the user named. If they say dishwasher, do not discuss pools, dryers, or unrelated gear unless they clearly ask. Prefer the local library context when it matches. If local context looks off-topic, ignore it and answer for the named equipment only.${diagnosisExtra}`;
}

async function askProsDiagnose(opts: {
  token: string;
  pack: TradePack;
  messages: ChatMessage[];
  userText: string;
  attachment?: ChatAttachment;
  localContext: string;
  isDiagnosis: boolean;
}): Promise<string | null> {
  if (!API_BASE) return null;
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

  if (res.status === 402 || res.status === 403 || res.status === 503) {
    // Billing / no company / no key — fall through to local.
    return null;
  }
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { reply?: string };
  return data.reply?.trim() || null;
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
}: GrokChatRequest): Promise<DiagnoseReply> {
  const isDiagnosis = Boolean(attachment);
  const local = diagnoseLocally(pack, userText, isDiagnosis);

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
          localContext: local.reply,
          isDiagnosis,
        });
        if (proxied) {
          return { reply: proxied, source: 'pros' };
        }
      }
    } catch {
      // Fall through
    }
  }

  // 2) Optional direct key for local/dev builds only
  const key = apiKey || process.env.EXPO_PUBLIC_GROK_API_KEY || '';
  if (!key) {
    return { reply: local.reply, source: 'local' };
  }

  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-8)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const userContent: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: userText || (isDiagnosis ? 'Diagnose this equipment photo.' : 'Help me on this job.'),
    },
  ];

  if (attachment?.base64) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${attachment.mimeType || 'image/jpeg'};base64,${attachment.base64}`,
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
            content: `${buildSystemPrompt(pack, isDiagnosis)}\n\nLocal library context:\n${local.reply.slice(0, 2500)}`,
          },
          ...history,
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return {
        reply: `${local.reply}\n\n_(Grok unreachable — showing pack library result.)_`,
        source: 'local',
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      reply: data.choices?.[0]?.message?.content?.trim() || local.reply,
      source: 'direct',
    };
  } catch {
    return {
      reply: `${local.reply}\n\n_(Network error — pack library result.)_`,
      source: 'local',
    };
  }
}
