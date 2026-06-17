import {
  DEFAULT_BEHAVIOR,
  MAX_TOKEN_OPTIONS,
  RESPONSE_STYLE_HINTS,
  type AiBehaviorPrefs,
  type ResponseStyle,
} from '../constants/hivePrompt';
import { getMissionPromptBlock } from './hiveMission';

export { DEFAULT_BEHAVIOR, MAX_TOKEN_OPTIONS, RESPONSE_STYLE_HINTS };
export type { AiBehaviorPrefs, ResponseStyle };

const CHAT_PERSONA = `You are Taylored Hive — a friendly assistant in a phone app that BUILDS apps and tools for people.
Follow HIVEMISSION below. Use plain language — no GitHub, pull requests, repos, or developer jargon unless the user explicitly asks how it works behind the scenes.
Keep answers SHORT unless the user asks for detail.`;

export function buildSystemInstruction(behavior: AiBehaviorPrefs, magicMode: boolean): string {
  const parts = [
    CHAT_PERSONA,
    getMissionPromptBlock('chat'),
    RESPONSE_STYLE_HINTS[behavior.responseStyle],
  ];
  if (behavior.customInstructions.trim()) {
    parts.push(`User-defined instructions:\n${behavior.customInstructions.trim()}`);
  }
  if (magicMode) {
    parts.push(
      'Build mode is ON. For new features, explain: describe it → see estimate → Approve & Build → notification when ready. Never say you cannot build.'
    );
  }
  return parts.join('\n\n');
}

export function buildTriageSystemPrompt(): string {
  return `${getMissionPromptBlock('triage')}

You are the on-device triage fallback when our build service is offline. Decide: existing tool | needs new build | clarify.

localReply must use plain consumer language only — no engineering terms.

Respond ONLY with JSON:
{
  "route": "local" | "cursor" | "clarify",
  "summary": "one sentence",
  "estimate": { "costUsd": number, "minutes": number },
  "localReply": "short answer if route is local",
  "clarifyingQuestion": "only if route is clarify",
  "buildPrompt": "detailed implementation spec if route is cursor (internal — user never sees this)"
}

Rules:
- route=local for questions, existing tools, or explaining how building works.
- route=cursor when user wants NEW features, screens, mini-apps, or iterations.
- route=clarify if vague.
- localReply under 80 words, friendly, no jargon.`;
}
