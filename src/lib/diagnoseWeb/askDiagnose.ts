import { diagnoseLocally } from '@diagnose/lib/knowledge/diagnoseEngine';
import { buildOfflineReply, isMetaAppQuestion } from '@diagnose/lib/diagnose/offlineConversation';
import type { TradePack } from '@diagnose/lib/packs/types';
import type { ChatAttachment } from './api';
import { sendDiagnoseChat } from './api';
import type { DiagnoseWebMessage } from './types';
import { DiagnoseCreditsError } from './types';

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
Stay inside trades relevant to this pack. Refuse unrelated consumer questions briefly.

CRITICAL EQUIPMENT LOCK:
- Stay on the equipment / fixture the user named.
- If local library context names different equipment, IGNORE that context.
- Prefer local library when it matches. Safety-first, glove-friendly steps.${diagnosisExtra}`;
}

export type AskDiagnoseResult = {
  reply: string;
  source: 'local' | 'grok';
  matchedFaultIds: string[];
  notice?: string;
  chargedUsd?: number;
  creditBalanceUsd?: number;
};

export async function askDiagnoseWeb(opts: {
  pack: TradePack;
  messages: DiagnoseWebMessage[];
  userText: string;
  attachment?: ChatAttachment | null;
  idToken: string | null;
  useLiveAi: boolean;
}): Promise<AskDiagnoseResult> {
  const isDiagnosis = Boolean(opts.attachment);
  const { pack, userText, messages, attachment, idToken, useLiveAi } = opts;

  if (!isDiagnosis) {
    const metaOpts = isMetaAppQuestion(userText)
      ? { offline: false, aiConfigured: true, aiEnabled: useLiveAi && !!idToken }
      : undefined;
    const conversational = buildOfflineReply(pack, userText, false, metaOpts, {
      liveAiReady: useLiveAi && !!idToken,
    });
    if (conversational) {
      return {
        reply: conversational.reply,
        source: 'local',
        matchedFaultIds: conversational.matchedFaultIds,
      };
    }
  }

  const local = diagnoseLocally(pack, userText, isDiagnosis);

  if (!useLiveAi || !idToken) {
    return {
      reply: local.reply,
      source: 'local',
      matchedFaultIds: local.matchedFaultIds,
      notice: idToken ? undefined : 'Sign in to unlock live Grok AI on top of the pack library.',
    };
  }

  try {
    const grok = await sendDiagnoseChat({
      idToken,
      systemPrompt: buildSystemPrompt(pack, isDiagnosis),
      localContext: local.reply,
      userText,
      packId: pack.id,
      messages,
      attachment,
    });
    return {
      reply: grok.reply,
      source: 'grok',
      matchedFaultIds: local.matchedFaultIds,
      chargedUsd: grok.chargedUsd,
      creditBalanceUsd: grok.creditBalanceUsd,
    };
  } catch (err) {
    if (err instanceof DiagnoseCreditsError) throw err;
    const message = err instanceof Error ? err.message : 'Live AI unavailable';
    return {
      reply: `${local.reply}\n\n_(${message} — showing pack library.)_`,
      source: 'local',
      matchedFaultIds: local.matchedFaultIds,
      notice: message,
    };
  }
}
