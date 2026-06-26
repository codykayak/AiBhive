/**
 * Web Intel Agent — runs Hive Cloud OSINT tools + Gemini synthesis (mirrors mobile Intel Agent).
 */
import { GoogleGenAI } from '@google/genai';
import * as hiveUsage from './hiveUsage.js';
import { runIntelCloudTool } from './intelOsint.js';

const INTEL_MODEL = process.env.INTEL_AGENT_MODEL || 'gemini-2.5-flash';
const SYNTH_RAW_COST = 0.01;

const SYNTH_SYSTEM = `You are the AiBhive Intel Agent synthesizer.
Produce a professional intelligence brief from raw OSINT tool outputs.
Structure:
1. Executive Summary (3-5 sentences)
2. Key Findings (bullet points with confidence: high/medium/low)
3. Infrastructure & Technology
4. People & Contact Signals
5. Risks, Gaps & Recommended Next Steps
Be factual — only cite data present in the dump. Mark uncertain items clearly.
Do not invent emails, people, or facts not in the source data.`;

let aiClient;

function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function resolveDomain(label, domainOverride, targetType) {
  const override = String(domainOverride || '').trim();
  if (override) {
    return override.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
  if (targetType === 'domain') {
    return String(label || '')
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
  }
  return '';
}

function normalizeTools(tools, targetType, domain) {
  const allowed = ['firecrawl_search', 'firecrawl_scrape', 'serp_search'];
  const picked = (Array.isArray(tools) ? tools : ['firecrawl_search', 'serp_search']).filter((t) =>
    allowed.includes(t)
  );
  const unique = [...new Set(picked.length ? picked : ['firecrawl_search', 'serp_search'])];
  if (domain && !unique.includes('firecrawl_scrape')) {
    unique.push('firecrawl_scrape');
  }
  return unique;
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runIntelResearch(db, userId, payload) {
  const targetType = payload.targetType || 'company';
  const label = String(payload.label || '').trim();
  const userIntent = String(payload.userIntent || '').trim();
  const domainOverride = String(payload.domain || '').trim();
  const domain = resolveDomain(label, domainOverride, targetType);

  if (!label) {
    return { ok: false, error: 'Enter a company, website, or person to research.' };
  }

  const region =
    payload.restrictToRegion && String(payload.location || '').trim()
      ? {
          restrictToRegion: true,
          location: String(payload.location).trim(),
          radiusMiles: Math.min(100, Math.max(30, parseInt(payload.radiusMiles, 10) || 50)),
        }
      : {};

  const tools = normalizeTools(payload.tools, targetType, domain);
  const toolParams = {
    company: label,
    domain,
    userIntent: userIntent || 'Learn everything publicly available about this target.',
    targetType,
    ...region,
  };

  const steps = [];
  const dumps = [];

  for (const toolId of tools) {
    steps.push({ toolId, status: 'running' });
    const scrapeUrl =
      toolId === 'firecrawl_scrape'
        ? domain.startsWith('http')
          ? domain
          : domain
            ? `https://${domain}`
            : ''
        : '';

    const result = await runIntelCloudTool(db, hiveUsage, {
      userId,
      toolId,
      params: { ...toolParams, url: scrapeUrl },
    });

    if (!result.ok) {
      steps[steps.length - 1] = {
        toolId,
        status: 'failed',
        error: result.error || (result.needPayment ? 'Hive credits required' : 'Tool failed'),
        needPayment: !!result.needPayment,
      };
      if (result.needPayment) {
        return {
          ok: false,
          needPayment: true,
          amountUsd: result.amountUsd ?? 0.05,
          steps,
          error: 'This research run needs Hive credits.',
        };
      }
      continue;
    }

    steps[steps.length - 1] = {
      toolId,
      status: 'done',
      summary: result.summary,
      chargedUsd: result.chargedUsd,
    };
    dumps.push(`=== ${toolId} ===\n${result.summary}\n\n${result.data || ''}`);
  }

  if (!dumps.length) {
    return {
      ok: false,
      error: 'All research tools failed. Check Hive credits or try again.',
      steps,
    };
  }

  const gemini = getGemini();
  if (!gemini) {
    return {
      ok: true,
      brief: dumps.join('\n\n---\n\n').slice(0, 16000),
      steps,
      synthesized: false,
    };
  }

  const synthBudget = await hiveUsage.checkTokenBudget(db, userId, SYNTH_RAW_COST * 1.2, 'hive_intel_synthesis');
  if (!synthBudget.ok) {
    return {
      ok: true,
      brief: dumps.join('\n\n---\n\n').slice(0, 16000),
      steps,
      synthesized: false,
      needPayment: true,
      amountUsd: synthBudget.amountUsd ?? 0.02,
    };
  }

  try {
    const response = await gemini.models.generateContent({
      model: INTEL_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `TARGET TYPE: ${targetType}
TARGET: ${label}
DOMAIN: ${domain || 'n/a'}
USER INTENT: ${toolParams.userIntent}
REGION: ${region.location ? `${region.location} (${region.radiusMiles} mi)` : 'global'}

RAW OSINT DATA:
${dumps.join('\n\n---\n\n').slice(0, 28000)}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYNTH_SYSTEM,
        temperature: 0.35,
        maxOutputTokens: 2400,
      },
    });

    const brief = response.text?.trim();
    if (!brief) {
      return {
        ok: true,
        brief: dumps.join('\n\n---\n\n').slice(0, 16000),
        steps,
        synthesized: false,
      };
    }

    const charge = await hiveUsage.recordTokenUsage(db, userId, {
      rawCostUsd: SYNTH_RAW_COST,
      feature: 'hive_intel_synthesis',
      summary: `Intel brief: ${label.slice(0, 60)}`,
    });

    if (!charge.ok) {
      return {
        ok: true,
        brief: dumps.join('\n\n---\n\n').slice(0, 16000),
        steps,
        synthesized: false,
      };
    }

    return {
      ok: true,
      brief,
      steps,
      synthesized: true,
      chargedUsd: charge.chargedUsd,
    };
  } catch (err) {
    console.error('[hive/intel/run] synthesis', err.message || err);
    return {
      ok: true,
      brief: dumps.join('\n\n---\n\n').slice(0, 16000),
      steps,
      synthesized: false,
    };
  }
}
