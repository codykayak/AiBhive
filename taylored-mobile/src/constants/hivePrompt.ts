/** User-facing AI behavior preferences and response style hints. */
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
