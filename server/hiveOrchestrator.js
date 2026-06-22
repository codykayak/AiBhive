import { GoogleGenAI } from '@google/genai';
import { getToolsManifestForPrompt, HIVE_REPO } from './hiveTools.js';
import { getMissionPromptBlock } from '../shared/hiveMission.js';
import { sendBuildReadyPush, sendBuildFailedPush } from './hivePush.js';
import { autoMergeTaskPullRequest } from './hiveAutoMerge.js';

const TRIAGE_MODEL = process.env.HIVE_TRIAGE_MODEL || 'gemini-2.5-flash';
const CURSOR_API = 'https://api.cursor.com/v1';
/** Builds only — no Anthropic/OpenAI coding agents unless env overrides. */
const CURSOR_BUILD_MODEL = process.env.HIVE_CURSOR_MODEL || 'composer-2.5';

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

function slugify(input, fallback = 'hive-app') {
  const base = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return base || fallback;
}

/**
 * Find a recent task we should iterate on for this user.
 * Iteration = user message says "change/update/add/remove" AND we have a prior
 * cursor build for that user in the last 14 days.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} userId
 * @param {string} message
 */
export async function findPreviousTaskForIteration(db, userId, message) {
  if (!userId || userId === 'anonymous') return null;
  const re = /\b(change|update|tweak|add|remove|fix|rename|edit|adjust|extend|iterate|improve|continue|tweak it|make it)\b/i;
  if (!re.test(message)) return null;

  try {
    const snap = await db
      .collection('hive_tasks')
      .where('userId', '==', userId)
      .where('route', '==', 'cursor')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    for (const doc of snap.docs) {
      const t = doc.data();
      if (!t.slug) continue;
      const createdAt = Date.parse(t.createdAt || '');
      if (Number.isNaN(createdAt) || createdAt < fourteenDaysAgo) continue;
      if (t.status === 'complete' || t.status === 'building' || t.status === 'awaiting_approval') {
        return {
          taskId: t.id,
          slug: t.slug,
          target: t.target,
          title: t.title || t.summary,
          summary: t.summary,
          branch: t.cursorBranch,
        };
      }
    }
  } catch (err) {
    console.warn('[hive] iteration lookup failed:', err.message);
  }
  return null;
}

/**
 * @param {string} message
 * @param {{ previous?: { slug: string, target?: string, title?: string, summary?: string } | null }} [opts]
 * @returns {Promise<{
 *   route: 'local' | 'cursor' | 'clarify',
 *   target: 'host_screen' | 'web_app' | 'native_app' | 'iteration',
 *   slug: string,
 *   title: string,
 *   summary: string,
 *   estimate?: { costUsd: number, minutes: number },
 *   localReply?: string,
 *   clarifyingQuestion?: string,
 *   buildPrompt?: string,
 * }>}
 */
export async function triageHiveTask(message, opts = {}) {
  const previous = opts.previous || null;
  const gemini = getGemini();
  if (!gemini) {
    return {
      route: 'local',
      target: 'host_screen',
      slug: slugify(message),
      title: 'Server offline',
      summary: 'Server AI offline',
      localReply:
        'The Hive orchestrator is warming up. Add GEMINI_API_KEY on the server, or use Apps for resume and intel tools now.',
    };
  }

  const system = `${getMissionPromptBlock('triage')}

You are the AiBhive Hive orchestrator. Decide whether the user's request needs a NEW build,
an EXISTING tool, a CLARIFICATION, and (if a build) WHICH delivery target.

Existing tools:
${getToolsManifestForPrompt()}

Delivery targets (pick exactly one in JSON field "target"):
- "host_screen" — feature lives inside the AiBhive mobile app (best default for phone tools that use chat/AI/Firebase). Lands at taylored-mobile/src/userApps/<slug>/.
- "web_app" — standalone shareable web tool at https://aibhive.com/u/<userId>/<slug>/ (best for calculators, landing pages, lead forms, dashboards, anything desktop or share-by-link).
- "native_app" — separate Expo project / branded APK for Play Store (rare, expensive). Only when user explicitly asks for a standalone app or Play Store listing.
- "iteration" — modify the user's PREVIOUS build (we know they have one — see Previous build context).

Respond ONLY with JSON (no markdown outside the object):
{
  "route": "local" | "cursor" | "clarify",
  "target": "host_screen" | "web_app" | "native_app" | "iteration",
  "slug": "kebab-case 2-4 word identifier",
  "title": "2-6 word human title",
  "summary": "one sentence the user will see",
  "estimate": { "costUsd": number, "minutes": number },
  "localReply": "SHORT answer if route is local (max 80 words)",
  "clarifyingQuestion": "only if route is clarify",
  "buildPrompt": "detailed implementation prompt for a coding agent if route is cursor"
}

Rules:
- route=local if existing tools suffice OR user asks how building / Hive Magic works.
- route=cursor if new UI, new feature, new API integration, or missing capability.
- route=clarify only if request is truly unintelligible.
- localReply must be concise — never write essays.
- estimate is optional — pricing is computed server-side from Cursor build model after triage.
- buildPrompt must reference taylored-mobile/src/userApps/<slug>/ for host_screen, cody/apps/<userId>/<slug>/ for web_app.
- slug must be short, kebab-case, no leading "hive-".
- If a Previous build is supplied and the user wants to modify it, route=cursor target=iteration and REUSE the previous slug.${
    previous
      ? `

Previous build context (the user has this build already, slug=${previous.slug}, target=${previous.target || 'host_screen'}, title=${previous.title || ''}). If the request modifies it, return target="iteration" and slug="${previous.slug}".`
      : ''
  }`;

  const response = await gemini.models.generateContent({
    model: TRIAGE_MODEL,
    contents: [{ role: 'user', parts: [{ text: `User request: ${message}` }] }],
    config: { systemInstruction: system },
  });

  const text = response.text || '';
  try {
    const parsed = parseJsonBlock(text);
    const route = parsed.route || 'clarify';
    let target = parsed.target || 'host_screen';
    if (!['host_screen', 'web_app', 'native_app', 'iteration'].includes(target)) {
      target = 'host_screen';
    }
    if (target === 'iteration' && !previous) target = 'host_screen';
    const slug =
      target === 'iteration' && previous?.slug
        ? previous.slug
        : slugify(parsed.slug || parsed.title || message);
    return {
      route,
      target,
      slug,
      title: (parsed.title || parsed.summary || 'New Hive build').slice(0, 64),
      summary: parsed.summary || 'Let me understand what you need.',
      estimate: parsed.estimate || { costUsd: 3, minutes: 20 },
      localReply: parsed.localReply,
      clarifyingQuestion: parsed.clarifyingQuestion,
      buildPrompt: parsed.buildPrompt || message,
    };
  } catch {
    return {
      route: 'clarify',
      target: 'host_screen',
      slug: slugify(message),
      title: 'Need details',
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

function buildAgentPrompt(buildPrompt, taskId, ctx) {
  const target = ctx?.target || 'host_screen';
  const slug = ctx?.slug || `hive-${taskId}`;
  const branch = `cursor/hive-${slug}-${taskId.slice(-6)}`;

  const targetLines = {
    host_screen: [
      `Delivery target: HOST_SCREEN. Add the feature INSIDE the AiBhive mobile app.`,
      `All new files MUST live under: taylored-mobile/src/userApps/${slug}/`,
      `Register the new screen by importing it and exporting an entry from taylored-mobile/src/userApps/index.ts (file already exists with a registry helper — append, do not rewrite).`,
      `Do NOT touch any existing screens, navigation, or theme files unless absolutely required. Reuse components from taylored-mobile/src/components/ and theme from taylored-mobile/src/theme/.`,
    ],
    web_app: [
      `Delivery target: WEB_APP. Build a standalone Vite/React web app, NOT a mobile screen.`,
      `All new files MUST live under: cody/apps/${ctx?.userId || 'shared'}/${slug}/`,
      `Use plain HTML/CSS/TS (or React if helpful). Output must be buildable as static files (vite build).`,
      `Append the new app to cody/apps/index.json (slug, title, owner) so the server can route /u/<owner>/<slug>/ to it.`,
    ],
    native_app: [
      `Delivery target: NATIVE_APP. Scaffold a separate Expo project under apps/native/${slug}/.`,
      `Use bundle id com.tayloredmobile.${slug.replace(/-/g, '')} and reuse the Hive amber theme.`,
      `Add a stub README explaining how to eas build --platform android.`,
      `Do NOT touch taylored-mobile/ — this is a new project, not a host-app feature.`,
    ],
    iteration: [
      `Delivery target: ITERATION. Modify the user's previous build at slug "${slug}".`,
      `Look for existing files under taylored-mobile/src/userApps/${slug}/ or cody/apps/*/${slug}/. Edit those files only.`,
      `Do NOT create a parallel folder. Keep the existing component/page names so the launcher entry still works.`,
    ],
  };

  return `${buildPrompt}

${getMissionPromptBlock('cursor')}

=== HIVE BUILD CONTRACT (must follow) ===
Task ID: ${taskId}
Slug: ${slug}
Branch: ${branch}
Build model: ${CURSOR_BUILD_MODEL} only — do not switch models.

${(targetLines[target] || targetLines.host_screen).map((l) => `- ${l}`).join('\n')}

Universal rules:
- Use branch name "${branch}" (or any "cursor/hive-${slug}-*" pattern). DO NOT push to main-fixed directly.
- Match the existing amber/dark theme in taylored-mobile/src/theme/colors.ts.
- Keep changes focused and minimal-diff. No drive-by refactors.
- Do NOT edit .github/workflows unless this task is explicitly about CI.
- Do NOT modify taylored-mobile/app.json version/versionCode unless this task is explicitly a native release.
- Open a PR titled: "hive(${target}): ${ctx?.title || slug} [task ${taskId}]" with a short summary.
- The PR will be auto-merged by the Hive server when checks pass — keep the diff clean.
=== END HIVE BUILD CONTRACT ===`;
}

/**
 * @param {string} buildPrompt
 * @param {string} taskId
 * @param {{ target?: string, slug?: string, title?: string, userId?: string }} [ctx]
 */
export async function spawnCursorAgent(buildPrompt, taskId, ctx = {}) {
  const auth = cursorAuthHeader();
  if (!auth) {
    throw new Error('CURSOR_API_KEY is not configured on the server yet.');
  }

  const agentPrompt = buildAgentPrompt(buildPrompt, taskId, ctx);
  const slug = ctx.slug || `hive-${taskId}`;
  const branchHint = `cursor/hive-${slug}-${taskId.slice(-6)}`;

  const res = await fetch(`${CURSOR_API}/agents`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: { text: agentPrompt },
      model: { id: CURSOR_BUILD_MODEL },
      repos: [{ url: HIVE_REPO.url, startingRef: HIVE_REPO.branch }],
      autoCreatePR: true,
      name: `Hive: ${(ctx.title || buildPrompt).slice(0, 60)} (${taskId.slice(-6)})`,
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
    branchHint,
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

function deliverableForTask(task) {
  if (task.target === 'web_app') {
    const owner = task.userId && task.userId !== 'anonymous' ? task.userId : 'shared';
    return {
      kind: 'web_app',
      url: `https://aibhive.com/u/${owner}/${task.slug}/`,
      label: 'Open web app',
    };
  }
  if (task.target === 'native_app') {
    return {
      kind: 'native_app',
      url: 'https://aibhive.com/download.html',
      label: 'Install your APK',
    };
  }
  return {
    kind: 'host_screen',
    deepLink: `aibhive://userApps/${task.slug}`,
    label: 'Open in AiBhive',
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} taskId
 */
export function startCursorRunPoller(db, taskId) {
  const intervalMs = 15000;
  let attempts = 0;
  const maxAttempts = 240; // up to 60 minutes

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
      if (run.prUrl && !task.prUrl) updates.prUrl = run.prUrl;
      if (run.branch && !task.cursorBranch) updates.cursorBranch = run.branch;

      if (runStatus === 'COMPLETED' || runStatus === 'FINISHED' || runStatus === 'DONE') {
        const prUrl = run.prUrl || task.prUrl;
        const deliverable = deliverableForTask({ ...task, ...updates });

        // Try to auto-merge the PR. If it succeeds, the push-to-main workflow
        // takes over (EAS Update + APK rebuild + manifest bump).
        let mergeResult = { merged: false, reason: 'no_pr_url' };
        if (prUrl) {
          mergeResult = await autoMergeTaskPullRequest({ prUrl, taskId });
        }

        updates.status = 'complete';
        updates.completedAt = new Date().toISOString();
        updates.deliverable = deliverable;
        updates.autoMerge = mergeResult;
        updates.reply = mergeResult.merged
          ? "Done! Your update is rolling out — open AiBhive again in ~2 min, or check My Apps."
          : 'Your build finished. It will go live the next time we ship an update.';
        clearInterval(timer);

        try {
          const after = (await db.collection('hive_tasks').doc(taskId).get()).data();
          await sendBuildReadyPush(db, { ...task, ...updates }, after || {});
        } catch (err) {
          console.warn('[hive] push send failed:', err.message);
        }
      } else if (runStatus === 'FAILED' || runStatus === 'CANCELLED' || runStatus === 'ERROR') {
        updates.status = 'failed';
        updates.reply = 'The build hit a snag. Try again or describe a smaller first version.';
        clearInterval(timer);
        try {
          await sendBuildFailedPush(db, { ...task, ...updates });
        } catch (err) {
          console.warn('[hive] fail-push failed:', err.message);
        }
      } else {
        updates.status = 'building';
        updates.reply = 'Still building your project…';
      }

      await db.collection('hive_tasks').doc(taskId).update(updates);
    } catch (err) {
      console.error('[hive] poll error', taskId, err.message);
    }

    if (attempts >= maxAttempts) clearInterval(timer);
  }, intervalMs);
}
