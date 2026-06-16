export type ProviderId = 'gemini' | 'kimi' | 'grok' | 'claude' | 'custom';

export type ModelOption = {
  id: string;
  label: string;
};

export type ProviderDefinition = {
  id: ProviderId;
  label: string;
  keyHint: string;
  models: ModelOption[];
  defaultModel: string;
};

export const AI_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    keyHint: 'Google AI Studio API key',
    defaultModel: 'gemini-2.0-flash',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (fast)' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
  {
    id: 'kimi',
    label: 'Kimi / Moonshot',
    keyHint: 'platform.moonshot.ai or platform.kimi.ai API key',
    defaultModel: 'kimi-k2.6',
    models: [
      { id: 'kimi-k2.6', label: 'Kimi K2.6 (Moonshot 2.6)' },
      { id: 'kimi-k2.5', label: 'Kimi K2.5' },
      { id: 'moonshot-v1-8k', label: 'Moonshot v1 8K (Kimi 1.5 tier)' },
      { id: 'moonshot-v1-32k', label: 'Moonshot v1 32K' },
    ],
  },
  {
    id: 'grok',
    label: 'Grok',
    keyHint: 'xAI API key from console.x.ai',
    defaultModel: 'grok-3-mini',
    models: [
      { id: 'grok-3-mini', label: 'Grok 3 Mini' },
      { id: 'grok-3', label: 'Grok 3' },
    ],
  },
  {
    id: 'claude',
    label: 'Claude',
    keyHint: 'Anthropic API key',
    defaultModel: 'claude-sonnet-4-20250514',
    models: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    keyHint: 'OpenAI-compatible API key',
    defaultModel: 'gpt-4o-mini',
    models: [{ id: 'gpt-4o-mini', label: 'Custom model id (edit below)' }],
  },
];

export function getProviderDef(id: ProviderId): ProviderDefinition {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0];
}
