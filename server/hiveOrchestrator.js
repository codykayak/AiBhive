import { GoogleGenAI } from '@google/genai';
import { getToolsManifestForPrompt, HIVE_REPO } from './hiveTools.js';

const TRIAGE_MODEL = process.env.HIVE_TRIAGE_MODEL || 'gemini-2.0-flash';
const CURSOR_API = 'https://api.cursor.com/v1';

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
 * @param {string} message
 * @returns {Promise<{
 *   route: 'local' | 'cursor' | 'clarify',
 *   summary: string,
 *   estimate?: { costUsd: number, minutes: number },
 *   localReply?: string,
 *   clarifyingQuestion?: string,
 *   buildPrompt?: string,
 * }>}
 */
export async function triageHiveTask(message) {
  const gemini = getGemini();
  if (!gemini) {
    return {
      route: 'local',
      summary: 'Server AI offline',
      localReply:
        'The Hive orchestrator is warming up. Add GEMINI_API_KEY on the server, or use Apps for resume and intel tools now.',
    };
  }

  const system = `You are the AiBhive Hive orchestrator. Decide if a user request can be handled by EXISTING app tools or needs a CODE CHANGE (new screen, feature, integration, dependency).

Existing tools:
${getToolsManifestForPrompt()}

Respond ONLY with JSON (no markdown outside the object):
{
  "route": "local" | "cursor" | "clarify",
  "summary": "one sentence for the user",
  "estimate": { "costUsd": number, "minutes": number },
  "localReply": "helpful answer if route is local — tell them which App to open if relevant",
  "clarifyingQuestion": "only if route is clarify",
  "buildPrompt": "detailed implementation prompt for a coding agent if route is cursor"
}

Rules:
- route=local if existing tools suffice (even if user must open Apps tab).
- route=cursor if new UI, new feature, new API integration, or missing capability.
- route=clarify if request is vague.
- estimate.costUsd: $1–8 for small UI, $5–25 for medium features.
- estimate.minutes: 10–45 typical.
- buildPrompt must reference taylored-mobile/ for mobile UI and server/ for backend.`;

  const response = await gemini.models.generateContent({
    model: TRIAGE_MODEL,
    contents: [{ role: 'user', parts: [{ text: `User request: ${message}` }] }],
    config: { systemInstruction: system },
  });

  const text = response.text || '';
  try {
    const parsed = parseJsonBlock(text);
    return {
      route: parsed.route || 'clarify',
      summary: parsed.summary || 'Let me understand what you need.',
      estimate: parsed.estimate || { costUsd: 3, minutes: 20 },
      localReply: parsed.localReply,
      clarifyingQuestion: parsed.clarifyingQuestion,
      buildPrompt: parsed.buildPrompt || message,
    };
  } catch {
    return {
      route: 'clarify',
      summary: 'I need a bit more detail.',
      clarifyingQuestion: 'What should this feature do, and where in the app should it live?',
      estimate: { costUsd: 0, minutes: 0 },
    };
  }
}

function cursorAuthHeader() {
  const key = process.env.CURSOR_API_KEY;
  if (!key) return null;
  return `Bearer ${key}`;
}

/**
 * @param {string} buildPrompt
 * @param {string} taskId
 */
export async function spawnCursorAgent(buildPrompt, taskId) {
  const auth = cursorAuthHeader();
  if (!auth) {
    throw new Error('CURSOR_API_KEY is not configured on the server yet.');
  }

  const agentPrompt = `${buildPrompt}

Context: This is for the AiBhive Taylored Mobile app (taylored-mobile/) and Express backend (server/).
Task ID: ${taskId}
Match existing amber/dark theme in taylored-mobile/src/theme/colors.ts.
Keep changes focused. Open a PR when done.`;

  const res = await fetch(`${CURSOR_API}/agents`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: { text: agentPrompt },
      repos: [{ url: HIVE_REPO.url, startingRef: HIVE_REPO.branch }],
      autoCreatePR: true,
      name: `Hive: ${buildPrompt.slice(0, 60)}`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cursor API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    agentId: data.agent?.id,
    runId: data.run?.id,
    agentUrl: data.agent?.url,
    status: data.run?.status || data.agent?.status,
  };
}

/**
 * @param {string} agentId
 * @param {string} runId
 */
export async function getCursorRunStatus(agentId, runId) {
  const auth = cursorAuthHeader();
  if (!auth || !agentId || !runId) return null;

  const res = await fetch(`${CURSOR_API}/agents/${agentId}/runs/${runId}`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} taskId
 */
export function startCursorRunPoller(db, taskId) {
  const intervalMs = 15000;
  let attempts = 0;
  const maxAttempts = 120;

  const timer = setInterval(async () => {
    attempts += 1;
    try {
      const snap = await db.collection('hive_tasks').doc(taskId).get();
      if (!snap.exists) {
        clearInterval(timer);
        return;
      }
      const task = snap.data();
      if (!task.cursorAgentId || !task.cursorRunId || task.status === 'complete' || task.status === 'failed') {
        clearInterval(timer);
        return;
      }

      const run = await getCursorRunStatus(task.cursorAgentId, task.cursorRunId);
      if (!run) return;

      const runStatus = (run.status || '').toUpperCase();
      const updates = {
        cursorStatus: runStatus,
        updatedAt: new Date().toISOString(),
      };

      if (runStatus === 'COMPLETED' || runStatus === 'FINISHED' || runStatus === 'DONE') {
        updates.status = 'complete';
        updates.reply =
          'Your feature is built and the PR is ready. Pull to refresh Apps — or install the next update when it ships.';
        if (run.prUrl) updates.prUrl = run.prUrl;
        clearInterval(timer);
      } else if (runStatus === 'FAILED' || runStatus === 'CANCELLED' || runStatus === 'ERROR') {
        updates.status = 'failed';
        updates.reply = 'The build agent hit a snag. Check the Cursor agent link for details.';
        clearInterval(timer);
      } else {
        updates.status = 'building';
        updates.reply = `Build agent is working… (${runStatus || 'in progress'})`;
      }

      await db.collection('hive_tasks').doc(taskId).update(updates);
    } catch (err) {
      console.error('[hive] poll error', taskId, err.message);
    }

    if (attempts >= maxAttempts) clearInterval(timer);
  }, intervalMs);
}
