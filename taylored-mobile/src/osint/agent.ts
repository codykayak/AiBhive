import { getActiveLlmConfig, getFirecrawlApiKey, sendChatMessage } from '../lib/ai';
import { getSerpApiKey } from '../lib/settings';
import { resolveDomainFromTarget, updateIntelCase } from './cases';
import { buildRawDump } from './export';
import { OSINT_TOOLS, getToolDef } from './tools/registry';
import { canRunTool, runOsintTool } from './tools/runners';
import type {
  AgentPlan,
  AgentProgressEvent,
  IntelCase,
  OsintToolId,
  ToolRunResult,
} from './types';

const PLANNER_SYSTEM = `You are the AiBhive Intel Agent — an OSINT research planner.
Given a target and user intent, output a JSON execution plan ONLY (no markdown fences).
Pick tools from the allowed list. Order logically: infrastructure first, then content, then search.
Skip tools that need API keys if marked unavailable.
Keep the plan focused — typically 6-12 tools max unless user asks for exhaustive research.

JSON schema:
{
  "focusAreas": ["string"],
  "notes": "optional one sentence",
  "steps": [{ "toolId": "tool_id", "reason": "why this tool" }]
}`;

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

function parseJsonFromModel(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  return JSON.parse(cleaned);
}

function defaultPlan(enabledTools: OsintToolId[]): AgentPlan {
  return {
    focusAreas: ['infrastructure', 'public web presence', 'contact signals'],
    notes: 'Default plan — AI planner unavailable, running all enabled tools.',
    steps: enabledTools.map((toolId) => ({
      toolId,
      reason: getToolDef(toolId).description,
    })),
  };
}

async function buildPlannerPrompt(intelCase: IntelCase, firecrawlAvailable: boolean, serpAvailable: boolean): Promise<string> {
  const domain = resolveDomainFromTarget(intelCase.target.label, intelCase.target.domain);
  const toolList = OSINT_TOOLS.map((t) => {
    let status = 'available';
    if (t.apiKeyField === 'firecrawl' && !firecrawlAvailable) status = 'NO API KEY — skip';
    if (t.apiKeyField === 'serpapi' && !serpAvailable) status = 'NO API KEY — skip';
    if (!intelCase.enabledTools.includes(t.id)) status = 'disabled by user — skip';
    return `- ${t.id}: ${t.name} — ${t.description} [${status}]`;
  }).join('\n');

  return `TARGET TYPE: ${intelCase.target.type}
TARGET LABEL: ${intelCase.target.label}
DOMAIN (resolved): ${domain || 'unknown'}
USER INTENT: ${intelCase.target.userIntent || 'Learn everything publicly available about this target'}

ENABLED TOOLS (user selection):
${intelCase.enabledTools.join(', ')}

AVAILABLE TOOLS:
${toolList}

Create an efficient research plan using ONLY enabled tools that are available (have API keys if required).
Prioritize based on user intent. Return JSON only.`;
}

export async function planResearch(intelCase: IntelCase): Promise<AgentPlan> {
  const llm = await getActiveLlmConfig();
  const firecrawlKey = await getFirecrawlApiKey();
  const serpKey = await getSerpApiKey();

  if (!llm) {
    return defaultPlan(intelCase.enabledTools);
  }

  try {
    const prompt = await buildPlannerPrompt(intelCase, !!firecrawlKey, !!serpKey);
    const raw = await sendChatMessage(
      llm,
      [],
      prompt,
      {
        behavior: {
          customInstructions: PLANNER_SYSTEM,
          responseStyle: 'concise',
          maxOutputTokens: 2048,
        },
      }
    );
    const parsed = parseJsonFromModel(raw) as AgentPlan;
    if (!parsed.steps?.length) return defaultPlan(intelCase.enabledTools);
    const allowed = new Set(intelCase.enabledTools);
    parsed.steps = parsed.steps.filter((s) => allowed.has(s.toolId));
    if (!parsed.steps.length) return defaultPlan(intelCase.enabledTools);
    return parsed;
  } catch {
    return defaultPlan(intelCase.enabledTools);
  }
}

async function synthesizeBrief(intelCase: IntelCase, rawDump: string): Promise<string> {
  const llm = await getActiveLlmConfig();
  if (!llm) {
    return [
      'AI brief unavailable — add an AI provider API key in Settings.',
      '',
      'Raw data has been collected. Review the tool results below or export as TXT.',
      '',
      `Tools completed: ${intelCase.toolResults.filter((r) => r.status === 'done').length}`,
    ].join('\n');
  }

  const truncated = rawDump.slice(0, 28000);
  const prompt = `TARGET: ${intelCase.target.label}
USER INTENT: ${intelCase.target.userIntent || 'General company/domain intelligence'}

RAW OSINT DATA:
${truncated}`;

  return sendChatMessage(llm, [], prompt, {
    behavior: {
      customInstructions: SYNTH_SYSTEM,
      responseStyle: 'detailed',
      maxOutputTokens: 4096,
    },
  });
}

export async function runIntelAgent(
  caseId: string,
  onProgress?: (event: AgentProgressEvent) => void
): Promise<IntelCase | null> {
  const emit = (event: AgentProgressEvent) => onProgress?.(event);

  let intelCase = await updateIntelCase(caseId, { status: 'planning', error: undefined, toolResults: [] });
  if (!intelCase) {
    emit({ type: 'error', message: 'Case not found' });
    return null;
  }

  const llm = await getActiveLlmConfig();
  const firecrawlKey = await getFirecrawlApiKey();
  const serpapiKey = await getSerpApiKey();
  const domain = resolveDomainFromTarget(intelCase.target.label, intelCase.target.domain);
  const company = intelCase.target.label;

  emit({ type: 'status', status: 'planning', message: 'AI agent is planning research…' });

  const plan = await planResearch(intelCase);
  intelCase = (await updateIntelCase(caseId, {
    plan,
    status: 'running',
    agentProvider: llm?.providerLabel,
    agentModel: llm?.model,
    target: { ...intelCase.target, domain: domain || intelCase.target.domain },
  }))!;

  emit({ type: 'plan', plan });
  emit({ type: 'status', status: 'running', message: `Running ${plan.steps.length} research modules…` });

  const ctx = {
    domain,
    company,
    userIntent: intelCase.target.userIntent,
    firecrawlKey,
    serpapiKey,
  };

  const results: ToolRunResult[] = [];

  for (const step of plan.steps) {
    const startedAt = new Date().toISOString();
    emit({ type: 'tool_start', toolId: step.toolId });

    const gate = canRunTool(step.toolId, ctx);
    if (!gate.ok) {
      const skipped: ToolRunResult = {
        toolId: step.toolId,
        status: 'skipped',
        startedAt,
        finishedAt: new Date().toISOString(),
        summary: gate.reason,
      };
      results.push(skipped);
      emit({ type: 'tool_done', result: skipped });
      continue;
    }

    try {
      const { summary, data } = await runOsintTool(step.toolId, ctx);
      const done: ToolRunResult = {
        toolId: step.toolId,
        status: 'done',
        startedAt,
        finishedAt: new Date().toISOString(),
        summary,
        data,
      };
      results.push(done);
      emit({ type: 'tool_done', result: done });
      await updateIntelCase(caseId, { toolResults: [...results] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tool failed';
      const failed: ToolRunResult = {
        toolId: step.toolId,
        status: 'error',
        startedAt,
        finishedAt: new Date().toISOString(),
        error: message,
      };
      results.push(failed);
      emit({ type: 'tool_done', result: failed });
      await updateIntelCase(caseId, { toolResults: [...results] });
    }
  }

  emit({ type: 'status', status: 'synthesizing', message: 'AI agent synthesizing intelligence brief…' });
  await updateIntelCase(caseId, { status: 'synthesizing', toolResults: results });

  const partialCase = (await updateIntelCase(caseId, { toolResults: results }))!;
  const rawDump = buildRawDump({ ...partialCase, toolResults: results });
  let aiBrief: string;
  try {
    aiBrief = await synthesizeBrief(partialCase, rawDump);
  } catch (err) {
    aiBrief = `Synthesis failed: ${err instanceof Error ? err.message : 'unknown error'}. Raw data is still available below.`;
  }

  const finalCase = await updateIntelCase(caseId, {
    status: 'complete',
    toolResults: results,
    rawDump,
    aiBrief,
  });

  if (finalCase) {
    emit({ type: 'brief', brief: aiBrief, rawDump });
    emit({ type: 'status', status: 'complete', message: 'Research complete' });
  }

  return finalCase;
}
