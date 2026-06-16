/** Shared Hive + Cursor knowledge injected into triage and chat. */
export const HIVE_CURSOR_CAPABILITY = `
CURSOR BUILD AGENT (Hive Magic):
- This app CAN spawn Cursor Cloud Agents via the AiBhive server when you approve a build.
- Flow: user describes a feature → orchestrator estimates cost/time → user taps Approve → Cursor agent edits github.com/codykayak/AiBhive and opens a PR → phone vibrates when done.
- Cursor is NOT on the phone; it runs on Cursor's cloud VM against the GitHub repo.
- Questions about "do you have Cursor API" or "can you build apps": answer YES via Hive Magic on the Build tab when Magic is ON and server is connected.
- If user asks to BUILD something new, route to cursor (or explain they should use Magic mode and approve the estimate).
`;

export const DEFAULT_HIVE_INSTRUCTIONS = `You are AiBhive Hive — a concise, helpful assistant inside the Taylored Mobile app.
${HIVE_CURSOR_CAPABILITY}

Keep answers SHORT unless the user asks for detail. Simple questions get 1-3 sentences.
Never write essays, books, or long markdown unless explicitly requested.`;

export type ResponseStyle = 'concise' | 'balanced' | 'detailed';

export const RESPONSE_STYLE_HINTS: Record<ResponseStyle, string> = {
  concise: 'Reply in 1-3 sentences max. No preamble. No markdown headers unless asked.',
  balanced: 'Reply in 1-2 short paragraphs. Be direct.',
  detailed: 'Thorough answers OK when the user asks for depth.',
};

export const MAX_TOKEN_OPTIONS = [256, 512, 1024, 2048, 4096] as const;

export type AiBehaviorPrefs = {
  customInstructions: string;
  responseStyle: ResponseStyle;
  maxOutputTokens: number;
};

export const DEFAULT_BEHAVIOR: AiBehaviorPrefs = {
  customInstructions: '',
  responseStyle: 'concise',
  maxOutputTokens: 512,
};

export function buildSystemInstruction(behavior: AiBehaviorPrefs, magicMode: boolean): string {
  const parts = [DEFAULT_HIVE_INSTRUCTIONS, RESPONSE_STYLE_HINTS[behavior.responseStyle]];
  if (behavior.customInstructions.trim()) {
    parts.push(`User-defined instructions:\n${behavior.customInstructions.trim()}`);
  }
  if (magicMode) {
    parts.push(
      'The user has Hive Magic ON. For new features or missing tools, explain the approve-and-build flow with Cursor instead of saying you cannot help.'
    );
  }
  return parts.join('\n\n');
}

export function buildTriageSystemPrompt(): string {
  return `You are the AiBhive Hive orchestrator. Decide if a user request can be handled by EXISTING app tools or needs a CODE CHANGE via Cursor.

${HIVE_CURSOR_CAPABILITY}

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
  "localReply": "short answer if route is local — mention Cursor/Hive Magic when relevant",
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
