import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ActiveLlmConfig } from './settings';

export type ChatTurn = { role: 'user' | 'ai'; content: string };

async function chatOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  history: ChatTurn[],
  userMessage: string,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const messages = [
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
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
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
  userMessage: string
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
      max_tokens: 4096,
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
  userMessage: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const chatModel = genAI.getGenerativeModel({ model });
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
  userMessage: string
): Promise<string> {
  switch (config.providerId) {
    case 'gemini':
      return chatGemini(config.apiKey, config.model, history, userMessage);
    case 'kimi':
      return chatOpenAiCompatible(
        'https://api.moonshot.ai/v1',
        config.apiKey,
        config.model,
        history,
        userMessage
      );
    case 'grok':
      return chatOpenAiCompatible('https://api.x.ai/v1', config.apiKey, config.model, history, userMessage);
    case 'claude':
      return chatClaude(config.apiKey, config.model, history, userMessage);
    case 'custom':
      return chatOpenAiCompatible('https://api.openai.com/v1', config.apiKey, config.model, history, userMessage);
    default:
      throw new Error('Unsupported provider');
  }
}

/** Multimodal generate for resume flow — Gemini only today; falls back to text-only for others. */
export async function generateWithParts(
  config: ActiveLlmConfig,
  prompt: string,
  parts: Array<string | { inlineData: { data: string; mimeType: string } }>
): Promise<string> {
  if (config.providerId === 'gemini') {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: config.model });
    const result = await model.generateContent([prompt, ...parts]);
    return result.response.text();
  }

  const textParts = parts.filter((p): p is string => typeof p === 'string');
  const combined = [prompt, ...textParts].join('\n\n');
  return sendChatMessage(config, [], combined);
}
