import { GoogleGenAI } from '@google/genai';

const TRIAGE_MODEL = process.env.HIVE_TRIAGE_MODEL || 'gemini-2.5-flash';
const CURSOR_BUILD_MODEL = process.env.HIVE_CURSOR_MODEL || 'composer-2.5';

/** Approximate Composer agent economics for quoting (internal cost, before markup). */
const COMPOSER_INPUT_PER_M = Number(process.env.HIVE_COMPOSER_INPUT_USD_PER_M ?? 1.25);
const COMPOSER_OUTPUT_PER_M = Number(process.env.HIVE_COMPOSER_OUTPUT_USD_PER_M ?? 6.0);

let aiClient;

function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function parseJsonBlock(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  return JSON.parse(raw);
}

function costFromTokens(inputTokens, outputTokens) {
  const input = (Math.max(0, inputTokens) / 1_000_000) * COMPOSER_INPUT_PER_M;
  const output = (Math.max(0, outputTokens) / 1_000_000) * COMPOSER_OUTPUT_PER_M;
  return Math.max(0.25, input + output);
}

/**
 * Estimate Cursor Composer build cost + time. Cursor has no public quote API, so Gemini
 * models token load against Composer 2.5 rates (same basis we use when a build runs).
 *
 * @param {{ message: string, buildPrompt: string, summary?: string }} input
 */
export async function estimateCursorBuildCost(input) {
  const gemini = getGemini();
  const fallback = {
    costUsd: 2.5,
    minutes: 25,
    inputTokens: 80_000,
    outputTokens: 25_000,
    source: 'fallback',
  };

  if (!gemini) return fallback;

  const system = `You estimate INTERNAL cost for a Cursor Cloud Agent build using model ${CURSOR_BUILD_MODEL}.
Cursor does not expose a live quote API — estimate token usage from the implementation prompt.

Composer-style rates (USD per 1M tokens):
- Input: $${COMPOSER_INPUT_PER_M}
- Output: $${COMPOSER_OUTPUT_PER_M}

Respond ONLY with JSON:
{
  "inputTokens": number,
  "outputTokens": number,
  "minutes": number,
  "rationale": "one short sentence"
}

Guidelines:
- Tiny UI (calculator, one screen): ~40k–90k input, ~8k–20k output, 10–20 min
- Small feature: ~90k–180k input, ~20k–45k output, 20–35 min
- Medium feature: ~180k–320k input, ~45k–90k output, 35–50 min
- Be conservative, not inflated.`;

  try {
    const response = await gemini.models.generateContent({
      model: TRIAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `User request: ${input.message}\nSummary: ${input.summary || ''}\n\nBuild prompt:\n${input.buildPrompt}`,
            },
          ],
        },
      ],
      config: { systemInstruction: system },
    });

    const parsed = parseJsonBlock(response.text || '');
    const inputTokens = Math.max(10_000, Number(parsed.inputTokens) || 80_000);
    const outputTokens = Math.max(5_000, Number(parsed.outputTokens) || 25_000);
    const minutes = Math.max(10, Math.min(60, Number(parsed.minutes) || 25));
    const costUsd = costFromTokens(inputTokens, outputTokens);

    return {
      costUsd: Math.round(costUsd * 100) / 100,
      minutes,
      inputTokens,
      outputTokens,
      rationale: parsed.rationale || '',
      source: 'gemini_cursor_model',
    };
  } catch (err) {
    console.warn('[hive] cursor estimate failed:', err.message);
    return fallback;
  }
}
