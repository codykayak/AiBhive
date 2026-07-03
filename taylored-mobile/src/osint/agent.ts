import { getActiveLlmConfig, getFirecrawlApiKey, sendChatMessage } from '../lib/ai';
import { getSerpApiKey } from '../lib/settings';
import { synthesizeIntelViaServer } from '../lib/intelCloud';
import { resolveDomainFromTarget, updateIntelCase } from './cases';
import { buildRawDump } from './export';
import { formatRegionLabel } from './regionalQuery';
import { toolDelay } from './safeFetch';
import { OSINT_TOOLS, getToolDef, isToolApplicable } from './tools/registry';
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
You receive RAW output from automated OSINT tools.

Your job:
1. Read the user's inquiry and target carefully.
2. Sort through ALL raw tool output.
3. KEEP only findings that directly help answer the user's inquiry.
4. DISCARD boilerplate, unrelated DNS noise, and duplicate data unless critical to the inquiry.
5. Never invent facts not supported by source data.

Structure:
1. Executive Summary (2-4 sentences — answer the inquiry directly)
2. Key Findings (bullets with confidence: high/medium/low and source tool)
3. Gaps & Limits (what we could not verify)
4. Recommended Next Steps

Plain English. No raw JSON dumps unless a value is critical evidence.`;

function parseJsonFromModel(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  return JSON.parse(cleaned);
}

function defaultPlan(enabledTools: OsintToolId[], targetType: IntelCase['target']['type']): AgentPlan {
  const steps = enabledTools
    .filter((id) => isToolApplicable(id, targetType))
    .map((toolId) => ({
      toolId,
      reason: getToolDef(toolId).description,
    }));
  return {
    focusAreas:
      targetType === 'discovery'
        ? ['web search', 'closure signals', 'list building']
        : targetType === 'person'
        ? ['public profiles', 'social signals', 'regional mentions']
        : targetType === 'domain'
          ? ['infrastructure', 'public web presence', 'technology']
          : ['leadership', 'public web presence', 'contact signals'],
    notes: 'Default plan — AI planner unavailable, running enabled tools for this target type.',
    steps,
  };
}

async function buildPlannerPrompt(
  intelCase: IntelCase,
  firecrawlAvailable: boolean,
  serpAvailable: boolean,
  hiveCloud: boolean
): Promise<string> {
  const domain = resolveDomainFromTarget(intelCase.target.label, intelCase.target.domain, intelCase.target.type);
  const regionLabel = formatRegionLabel(intelCase.target.region);
  const toolList = OSINT_TOOLS.map((t) => {
    let status = 'available';
    if (!t.applicableTargets.includes(intelCase.target.type)) status = 'wrong target type — skip';
    if (t.apiKeyField === 'firecrawl' && !firecrawlAvailable && !hiveCloud) status = 'NO KEY — skip unless Hive Cloud';
    if (t.apiKeyField === 'serpapi' && !serpAvailable && !hiveCloud) status = 'NO KEY — skip unless Hive Cloud';
    if (t.apiKeyField === 'firecrawl' && !firecrawlAvailable && hiveCloud) status = 'Hive Cloud available';
    if (t.apiKeyField === 'serpapi' && !serpAvailable && hiveCloud) status = 'Hive Cloud available';
    if (!intelCase.enabledTools.includes(t.id)) status = 'disabled by user — skip';
    return `- ${t.id}: ${t.name} — ${t.description} [${status}]`;
  }).join('\n');

  return `TARGET TYPE: ${intelCase.target.type} (company | domain/website | person)
TARGET LABEL: ${intelCase.target.label}
DOMAIN (resolved): ${domain || 'none — skip website-only tools'}
REGION FILTER: ${regionLabel || 'none (global search)'}
USER INTENT: ${intelCase.target.userIntent || 'Learn everything publicly available about this target'}

For PERSON targets: prioritize username_probe, person dorks, Firecrawl/Serp people search.
For COMPANY targets: leadership, news, contacts; use regional filter in search queries when set.
For DOMAIN/WEBSITE targets: infrastructure, DNS, tech stack, site content first.

ENABLED TOOLS (user selection):
${intelCase.enabledTools.join(', ')}

AVAILABLE TOOLS:
${toolList}

Create an efficient research plan using ONLY enabled tools that match the target type and are available.
Prioritize based on user intent and region filter. Return JSON only.`;
}

export async function planResearch(intelCase: IntelCase): Promise<AgentPlan> {
  const llm = await getActiveLlmConfig();
  const firecrawlKey = await getFirecrawlApiKey();
  const serpKey = await getSerpApiKey();
  let hiveCloud = true;

  if (!llm) {
    return defaultPlan(intelCase.enabledTools, intelCase.target.type);
  }

  try {
    const prompt = await buildPlannerPrompt(intelCase, !!firecrawlKey, !!serpKey, hiveCloud);
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
    if (!parsed.steps?.length) return defaultPlan(intelCase.enabledTools, intelCase.target.type);
    const allowed = new Set(intelCase.enabledTools);
    parsed.steps = parsed.steps.filter(
      (s) => allowed.has(s.toolId) && isToolApplicable(s.toolId, intelCase.target.type)
    );
    if (!parsed.steps.length) return defaultPlan(intelCase.enabledTools, intelCase.target.type);
    return parsed;
  } catch {
    return defaultPlan(intelCase.enabledTools, intelCase.target.type);
  }
}

async function synthesizeBrief(intelCase: IntelCase, rawDump: string): Promise<string> {
  const llm = await getActiveLlmConfig();

  const serverResult = await synthesizeIntelViaServer({
    target: intelCase.target,
    toolResults: intelCase.toolResults,
    userIntent: intelCase.target.userIntent,
  });
  if (serverResult.ok && serverResult.text.trim()) {
    return serverResult.text;
  }
  if (serverResult.ok === false && serverResult.needPayment) {
    return [
      `AI brief needs Hive credits (~$${(serverResult.amountUsd ?? 0.02).toFixed(2)}). Add credits in Settings.`,
      '',
      'Raw tool results are still available below and in export.',
      '',
      `Tools completed: ${intelCase.toolResults.filter((r) => r.status === 'done').length}`,
    ].join('\n');
  }

  if (!llm) {
    return [
      serverResult.ok === false
        ? `AI brief unavailable (${serverResult.error}).`
        : 'AI brief unavailable — add Hive credits or an AI provider key in Settings.',
      '',
      'Raw data has been collected. Review the tool results below or export as TXT.',
      '',
      `Tools completed: ${intelCase.toolResults.filter((r) => r.status === 'done').length}`,
    ].join('\n');
  }

  const truncated = rawDump.slice(0, 28000);
  const prompt = `TARGET TYPE: ${intelCase.target.type}
TARGET: ${intelCase.target.label}
REGION: ${formatRegionLabel(intelCase.target.region) || 'global'}
USER INTENT: ${intelCase.target.userIntent || 'General intelligence'}

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
  const useHiveCloud = true;
  const domain = resolveDomainFromTarget(intelCase.target.label, intelCase.target.domain, intelCase.target.type);
  const company = intelCase.target.label;
  const username =
    intelCase.target.type === 'person'
      ? intelCase.target.label.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : undefined;

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
    targetType: intelCase.target.type,
    domain,
    company,
    username,
    userIntent: intelCase.target.userIntent,
    region: intelCase.target.region,
    firecrawlKey,
    serpapiKey,
    useHiveCloud,
  };

  const results: ToolRunResult[] = [];

  for (const step of plan.steps) {
    await toolDelay(350);
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
