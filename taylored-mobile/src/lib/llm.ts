import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ActiveLlmConfig } from './settings';
import { buildSystemInstruction, type AiBehaviorPrefs } from './hivePromptBuilder';

export type ChatTurn = { role: 'user' | 'ai'; content: string };

export type ChatOptions = {
  behavior?: AiBehaviorPrefs;
  magicMode?: boolean;
  /** When set, replaces the default HIVEMISSION chat system prompt. */
  systemInstructionOverride?: string;
};

async function chatOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  history: ChatTurn[],
  userMessage: string,
  systemInstruction: string,
  maxTokens: number,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages, temperature: 0.5, max_tokens: maxTokens }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `API error ${res.status}`);
  }
  return data.choices?.[0]?.message?.content?.trim() || 'No response from model.';
}

async function chatClaude(
  apiKey: string,
  model: string,
  history: ChatTurn[],
  userMessage: string,
  systemInstruction: string,
  maxTokens: number
): Promise<string> {
  const messages = [
    ...history.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemInstruction,
      messages,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error ${res.status}`);
  }
  const block = data.content?.find((c: { type: string }) => c.type === 'text');
  return block?.text?.trim() || 'No response from Claude.';
}

async function chatGemini(
  apiKey: string,
  model: string,
  history: ChatTurn[],
  userMessage: string,
  systemInstruction: string,
  maxTokens: number
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const chatModel = genAI.getGenerativeModel({
    model,
    systemInstruction,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
  });
  const chat = chatModel.startChat({
    history: history.map((m) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

export async function sendChatMessage(
  config: ActiveLlmConfig,
  history: ChatTurn[],
  userMessage: string,
  options: ChatOptions = {}
): Promise<string> {
  const behavior = options.behavior ?? {
    customInstructions: '',
    responseStyle: 'concise' as const,
    maxOutputTokens: 512,
  };
  const systemInstruction =
    options.systemInstructionOverride ?? buildSystemInstruction(behavior, !!options.magicMode);
  const maxTokens = behavior.maxOutputTokens;

  switch (config.providerId) {
    case 'gemini':
      return chatGemini(config.apiKey, config.model, history, userMessage, systemInstruction, maxTokens);
    case 'kimi':
      return chatOpenAiCompatible(
        'https://api.moonshot.ai/v1',
        config.apiKey,
        config.model,
        history,
        userMessage,
        systemInstruction,
        maxTokens
      );
    case 'grok':
      return chatOpenAiCompatible(
        'https://api.x.ai/v1',
        config.apiKey,
        config.model,
        history,
        userMessage,
        systemInstruction,
        maxTokens
      );
    case 'claude':
      return chatClaude(config.apiKey, config.model, history, userMessage, systemInstruction, maxTokens);
    case 'custom':
      return chatOpenAiCompatible(
        'https://api.openai.com/v1',
        config.apiKey,
        config.model,
        history,
        userMessage,
        systemInstruction,
        maxTokens
      );
    default:
      throw new Error('Unsupported provider');
  }
}

export async function generateWithParts(
  config: ActiveLlmConfig,
  prompt: string,
  parts: Array<string | { inlineData: { data: string; mimeType: string } }>,
  options: ChatOptions = {}
): Promise<string> {
  const behavior = options.behavior ?? {
    customInstructions: '',
    responseStyle: 'balanced' as const,
    maxOutputTokens: 4096,
  };

  if (config.providerId === 'gemini') {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.model,
      generationConfig: { maxOutputTokens: Math.max(behavior.maxOutputTokens, 2048) },
    });
    const result = await model.generateContent([prompt, ...parts]);
    return result.response.text();
  }

  const textParts = parts.filter((p): p is string => typeof p === 'string');
  return sendChatMessage(config, [], [prompt, ...textParts].join('\n\n'), options);
}
