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

const CHAT_PERSONA = `You are AiBhive Hive — the assistant inside Taylored Mobile.
Follow HIVEMISSION below. Keep answers SHORT unless the user asks for detail.
Never write essays, books, or long markdown unless explicitly requested.`;

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
      'The user has Hive Magic ON. For new features or missing tools, route to the approve-and-build flow with Cursor instead of saying you cannot help.'
    );
  }
  return parts.join('\n\n');
}

export function buildTriageSystemPrompt(): string {
  return `${getMissionPromptBlock('triage')}

You are the on-device Hive triage fallback (server offline). Decide: existing tool | needs Cursor code change | clarify.

Existing in-app tools:
- Hive Chat (this screen)
- Auto-Bot Resume + Job Tracker (My Apps)
- Company Intel (after generating a job kit)
- Jewles Web Studio

Respond ONLY with JSON:
{
  "route": "local" | "cursor" | "clarify",
  "summary": "one sentence",
  "estimate": { "costUsd": number, "minutes": number },
  "localReply": "short answer if route is local",
  "clarifyingQuestion": "only if route is clarify",
  "buildPrompt": "implementation prompt for Cursor if route is cursor"
}

Rules:
- route=local for questions, existing tools, or explaining Cursor/Hive capabilities.
- route=cursor when user wants NEW features, screens, or integrations built in code.
- route=clarify if vague.
- localReply must be SHORT (under 80 words).
- For "do you have Cursor API" → route=local, explain yes via Hive Magic approve flow.`;
}
