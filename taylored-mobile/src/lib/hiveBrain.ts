import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildTriageSystemPrompt } from '../lib/hivePromptBuilder';
import type { HiveTask } from './hiveApi';
import type { ActiveLlmConfig } from './settings';
import { formatBuildOffer } from '../constants/hiveCopy';

function parseJsonBlock(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  return JSON.parse(raw);
}

type TriageResult = {
  route: 'local' | 'cursor' | 'clarify';
  summary: string;
  estimate?: { costUsd: number; minutes: number };
  localReply?: string;
  clarifyingQuestion?: string;
  buildPrompt?: string;
};

export async function triageLocally(config: ActiveLlmConfig, message: string): Promise<Omit<HiveTask, 'id' | 'message'>> {
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: buildTriageSystemPrompt(),
    generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
  });

  const result = await model.generateContent(`User request: ${message}`);
  const text = result.response.text();

  try {
    const parsed = parseJsonBlock(text) as TriageResult;
    return taskFromTriage(message, parsed);
  } catch {
    return {
      route: 'local',
      status: 'complete',
      summary: 'Here is a quick answer.',
      reply:
        'I can help with chat, Job Tracker, and Auto-Bot Resume in My Apps. For something new, keep Build mode on — describe it, approve the estimate, and we\'ll notify you when it\'s ready.',
    };
  }
}

function taskFromTriage(message: string, parsed: TriageResult): Omit<HiveTask, 'id' | 'message'> {
  if (parsed.route === 'clarify') {
    return {
      route: 'clarify',
      status: 'clarify',
      summary: parsed.summary,
      reply: parsed.clarifyingQuestion || parsed.summary,
      estimate: parsed.estimate ?? null,
    };
  }

  if (parsed.route === 'cursor') {
    return {
      route: 'cursor',
      status: 'awaiting_approval',
      summary: parsed.summary,
      estimate: parsed.estimate ?? { costUsd: 3, minutes: 20 },
      buildPrompt: parsed.buildPrompt || message,
      reply: formatBuildOffer(
        parsed.summary,
        parsed.estimate?.costUsd ?? 3,
        parsed.estimate?.minutes ?? 20
      ) + '\n\n(Connect to our build service to start — or try again shortly.)',
    };
  }

  return {
    route: 'local',
    status: 'complete',
    summary: parsed.summary,
    reply: parsed.localReply || parsed.summary,
    estimate: null,
  };
}

export function localTaskToHiveTask(
  message: string,
  partial: Omit<HiveTask, 'id' | 'message'>,
  id?: string
): HiveTask {
  return {
    id: id || `local_${Date.now()}`,
    message,
    ...partial,
  };
}
