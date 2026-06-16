import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildTriageSystemPrompt } from '../lib/hivePromptBuilder';
import type { HiveTask } from './hiveApi';
import type { ActiveLlmConfig } from './settings';

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
        'I can help via chat, Job Tracker, and Auto-Bot Resume. For new features, Hive Magic can spawn a Cursor build agent after you approve the estimate — keep Magic ON.',
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
      reply: `I can build that with our Cursor agent.\n\n${parsed.summary}\n\nEstimated ~$${parsed.estimate?.costUsd ?? 3} · ~${parsed.estimate?.minutes ?? 20} min\n\nTap Approve to start. (Requires Hive server online.)`,
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
