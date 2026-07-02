/**
 * Anthropic Messages API — used only by Intel Research (web).
 */

export function anthropicApiKey() {
  return (
    process.env.ANTHROPIC_API_KEY ||
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_KEY ||
    ''
  ).trim();
}

export function intelClaudeModel() {
  return process.env.INTEL_CLAUDE_MODEL || 'claude-sonnet-5';
}

/**
 * @param {string} apiKey
 * @param {string} model
 * @param {Array<{ role: string; content: string }>} messages — system messages excluded
 * @param {string} systemInstruction
 * @param {number} maxTokens
 */
export async function claudeChatMessages(apiKey, model, messages, systemInstruction, maxTokens = 2400) {
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
      system: String(systemInstruction || '').slice(0, 12000),
      messages: messages.map((m) => ({
        role: m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 8000),
      })),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error (${res.status})`);
  }

  const block = (data.content || []).find((c) => c.type === 'text');
  return block?.text?.trim() || '';
}
