/**
 * Proactive assistant — Grok 3 mini for low-cost daily briefs & insights.
 */
import { grokChat } from './socialPosts/grokProvider.js';
import * as hiveUsage from './hiveUsage.js';

const PROACTIVE_MODEL = process.env.PROACTIVE_GROK_MODEL || 'grok-3-mini';
const BRIEF_RAW_COST = 0.0015;
const INSIGHT_RAW_COST = 0.001;

function getXaiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

function snapshotText(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return '';
  const lines = [];
  if (snapshot.jobCount != null) {
    lines.push(
      `Jobs: ${snapshot.jobCount} total, ${snapshot.submittedJobs || 0} submitted, ${snapshot.interviewingJobs || 0} interviewing.`
    );
  }
  if (Array.isArray(snapshot.recentJobs) && snapshot.recentJobs.length) {
    lines.push(
      `Recent: ${snapshot.recentJobs.map((j) => `${j.company} (${j.status})`).join('; ')}.`
    );
  }
  if (snapshot.buildingApps) lines.push(`${snapshot.buildingApps} app(s) building.`);
  if (Array.isArray(snapshot.recentResearch) && snapshot.recentResearch.length) {
    lines.push(`Research: ${snapshot.recentResearch.join(', ')}.`);
  }
  if (Array.isArray(snapshot.recentScreens) && snapshot.recentScreens.length) {
    lines.push(`Visited: ${snapshot.recentScreens.join(', ')}.`);
  }
  return lines.join('\n');
}

function parseJsonLoose(text) {
  const raw = String(text || '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(start, end + 1));
}

export async function runProactiveDailyBrief(db, userId, snapshot) {
  const apiKey = getXaiKey();
  if (!apiKey) {
    return { ok: false, error: 'Proactive AI not configured.' };
  }

  const budget = await hiveUsage.checkTokenBudget(db, userId, BRIEF_RAW_COST * 1.2, 'proactive_brief');
  if (!budget.ok) {
    return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.01 };
  }

  const system = [
    'You write a short daily push notification for AiBhive (jobs, app building, research).',
    'Tone: warm, motivational, action-oriented — help them get the amazing job or build momentum.',
    'JSON only: {"title":"...","body":"...","actionHint":"..."}',
    'Title max 40 chars, body max 220 chars.',
  ].join(' ');

  const prompt = `User snapshot:\n${snapshotText(snapshot)}\n\nWrite today's motivational notification plus one concrete action in AiBhive today.`;

  try {
    const raw = await grokChat(apiKey, PROACTIVE_MODEL, prompt, system);
    const parsed = parseJsonLoose(raw);
    const charge = await hiveUsage.recordTokenUsage(db, userId, {
      rawCostUsd: BRIEF_RAW_COST,
      feature: 'proactive_brief',
      summary: 'Daily motivational brief',
    });
    if (!charge.ok) {
      return { ok: false, needPayment: true, amountUsd: charge.amountUsd ?? 0.01 };
    }
    return {
      ok: true,
      title: String(parsed.title || '🐝 AiBhive daily').slice(0, 48),
      body: String(parsed.body || '').slice(0, 280),
      actionHint: parsed.actionHint ? String(parsed.actionHint).slice(0, 80) : undefined,
      chargedUsd: charge.chargedUsd ?? 0,
    };
  } catch (err) {
    return { ok: false, error: err.message || 'Brief failed.' };
  }
}

export async function runProactiveInsights(db, userId, snapshot) {
  const apiKey = getXaiKey();
  if (!apiKey) {
    return { ok: false, error: 'Proactive AI not configured.' };
  }

  const budget = await hiveUsage.checkTokenBudget(db, userId, INSIGHT_RAW_COST * 1.2, 'proactive_insights');
  if (!budget.ok) {
    return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.01 };
  }

  const prompt = `Return JSON {"bullets":["","",""]} — exactly 3 short helpful suggestions (max 90 chars each) based on:\n${snapshotText(snapshot)}`;
  try {
    const raw = await grokChat(apiKey, PROACTIVE_MODEL, prompt, 'Respond ONLY with valid JSON.');
    const parsed = parseJsonLoose(raw);
    await hiveUsage.recordTokenUsage(db, userId, {
      rawCostUsd: INSIGHT_RAW_COST,
      feature: 'proactive_insights',
      summary: 'Quick activity insights',
    });
    return { ok: true, bullets: (parsed.bullets || []).slice(0, 3).map(String) };
  } catch (err) {
    return { ok: false, error: err.message || 'Insights failed.' };
  }
}
