/**
 * Generate a HiveAppSpec from a plain-English user request.
 *
 * This is the heart of the "instant operational app" experience: instead of
 * paying Cursor to write React Native code that requires a Play Store
 * install, we ask Gemini to emit a structured JSON spec that the existing
 * AiBhive app renders dynamically.
 *
 * The mobile DynamicAppHost interprets the spec at runtime, so any v1.4.1+
 * install can run any user's app the moment Gemini finishes thinking.
 */

import { GoogleGenAI } from '@google/genai';
import { PAGE_TYPES, THEMES, ICONS, normalizeAppSpec } from './hiveAppsApi.js';

const TRIAGE_MODEL = process.env.HIVE_TRIAGE_MODEL || 'gemini-2.5-flash';

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

/**
 * @param {{ message: string, ownerId: string, slug: string, title?: string, previous?: any }} input
 */
export async function generateAppSpec(input) {
  const gemini = getGemini();
  if (!gemini) throw new Error('Gemini not configured — set GEMINI_API_KEY.');

  const system = `You are the AiBhive spec writer. Convert a plain-English app
request into a HiveAppSpec JSON document that the mobile app will render
dynamically (no app store update needed).

Constraints:
- Pages can ONLY use these types: ${PAGE_TYPES.join(', ')}.
- Themes: ${THEMES.join(', ')}.
- Icons: ${ICONS.join(', ')}.
- Storage is "local" unless the user clearly needs cross-device sync.
- 1–4 pages is ideal. 6 is the absolute cap.
- Page configs are described below.

Page types:
- "list" — checklist of items. config:
    { addPlaceholder, emptyMessage, seed: [string], showCheckbox: boolean }
- "tracker" — log entries with date+value (habits, expenses, weight, etc.). config:
    { unit, prompt, defaultValue, aggregate: "sum"|"avg"|"count"|"latest", timeframeDays }
- "note" — free-form long text. config:
    { placeholder, seedText }
- "calculator" — fields + formula. config:
    { inputs: [ { id, label, unit, defaultValue } ], formula, resultLabel, resultUnit }
    formula uses input ids: "weight * heightFactor + 5"
- "info" — static guidance. config:
    { body, bullets: [string], links: [ { label, url } ] }

ALWAYS respond with ONLY this JSON shape (no commentary, no markdown fence):
{
  "title": "string (2-6 words)",
  "tagline": "one short sentence",
  "summary": "1-2 sentence description",
  "theme": "amber" | one of the themes,
  "icon": one of the icons,
  "storage": "local" | "cloud",
  "pages": [
    { "id": "kebab-id", "title": "Page Title", "type": "list"|"tracker"|"note"|"calculator"|"info", "config": { ... } }
  ]
}

Pick a tasteful theme that matches the topic. Be opinionated. Default first
page to the most useful one (tracker for habits, list for grocery, calculator
for finance, etc.). Always include a friendly "info" or seed content so the
empty app already looks useful.`;

  const userParts = [`User request: ${input.message}`];
  if (input.previous) {
    userParts.push(
      `Iterating on the existing spec (modify fields rather than re-create from scratch):\n${JSON.stringify(input.previous, null, 2)}`
    );
  }

  const response = await gemini.models.generateContent({
    model: TRIAGE_MODEL,
    contents: [{ role: 'user', parts: [{ text: userParts.join('\n\n') }] }],
    config: { systemInstruction: system },
  });

  const text = response.text || '';
  let parsed;
  try {
    parsed = parseJsonBlock(text);
  } catch (err) {
    throw new Error(`Gemini did not return valid spec JSON: ${err.message}`);
  }

  // Carry forward identity fields from caller, then normalize.
  parsed.slug = input.slug;
  parsed.title = parsed.title || input.title || 'My App';
  parsed.id = input.previous?.id;
  parsed.createdAt = input.previous?.createdAt;
  parsed.version = (input.previous?.version || 0) + 1;

  return normalizeAppSpec(parsed, {
    ownerId: input.ownerId,
    sourceTaskId: input.sourceTaskId,
  });
}
