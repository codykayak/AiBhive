import type { ChatAttachment, ChatMessage, TradePack } from './packs/types';
import { diagnoseLocally } from './knowledge/diagnoseEngine';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = 'grok-2-vision-1212';

export type GrokChatRequest = {
  pack: TradePack;
  messages: ChatMessage[];
  userText: string;
  attachment?: ChatAttachment;
  apiKey?: string;
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

  return `${pack.systemPrompt}${diagnosisExtra}`;
}

export async function askGrok({
  pack,
  messages,
  userText,
  attachment,
  apiKey,
}: GrokChatRequest): Promise<string> {
  const key = apiKey || process.env.EXPO_PUBLIC_GROK_API_KEY || '';
  const isDiagnosis = Boolean(attachment);

  // Always prefer rich local pack intelligence when offline or no key.
  if (!key) {
    return diagnoseLocally(pack, userText, isDiagnosis).reply;
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

  // Enrich with local library hits so Grok stays grounded in field knowledge.
  const local = diagnoseLocally(pack, userText, isDiagnosis);

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
      return `${local.reply}\n\n_(Grok unreachable — showing pack library result.)_`;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() || local.reply;
  } catch {
    return `${local.reply}\n\n_(Network error — pack library result.)_`;
  }
}
