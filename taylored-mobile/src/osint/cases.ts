import AsyncStorage from '@react-native-async-storage/async-storage';
import { OSINT_TOOLS } from './tools/registry';
import type { IntelCase, IntelTargetType, OsintToolId } from './types';

const CASES_KEY = 'aibhive_intel_cases_v1';

function newId(): string {
  return `intel_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function listIntelCases(): Promise<IntelCase[]> {
  try {
    const raw = await AsyncStorage.getItem(CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IntelCase[];
    return parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

async function saveAll(cases: IntelCase[]): Promise<void> {
  await AsyncStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

export async function getIntelCase(id: string): Promise<IntelCase | null> {
  const cases = await listIntelCases();
  return cases.find((c) => c.id === id) ?? null;
}

export async function createIntelCase(
  partial: Pick<IntelCase, 'target' | 'enabledTools'>
): Promise<IntelCase> {
  const now = new Date().toISOString();
  const intelCase: IntelCase = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    target: partial.target,
    enabledTools: partial.enabledTools,
    toolResults: [],
  };
  const cases = await listIntelCases();
  cases.unshift(intelCase);
  await saveAll(cases);
  return intelCase;
}

export async function updateIntelCase(id: string, patch: Partial<IntelCase>): Promise<IntelCase | null> {
  const cases = await listIntelCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const updated: IntelCase = {
    ...cases[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  cases[idx] = updated;
  await saveAll(cases);
  return updated;
}

export async function deleteIntelCase(id: string): Promise<void> {
  const cases = await listIntelCases();
  await saveAll(cases.filter((c) => c.id !== id));
}

export function resolveDomainFromTarget(label: string, explicit?: string, targetType?: IntelTargetType): string {
  if (targetType === 'person' && !explicit?.trim()) {
    return '';
  }
  if (explicit?.trim()) {
    return explicit.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  }
  const trimmed = label.trim();
  if (/^[a-z0-9][-a-z0-9.]*\.[a-z]{2,}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (targetType === 'domain') {
    return '';
  }
  const guess = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .replace(/(inc|llc|ltd|corp|co)$/i, '');
  return guess ? `${guess}.com` : '';
}

/** Guess target mode from a free-form label (home assistant, quick start). */
export function inferTargetTypeFromLabel(label: string): IntelTargetType {
  const trimmed = label.trim();
  if (!trimmed) return 'company';
  if (/^[a-z0-9][-a-z0-9.]*\.[a-z]{2,}$/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return 'domain';
  }
  if (/linkedin\.com\/in\//i.test(trimmed) || /^@[a-z0-9._-]+$/i.test(trimmed)) {
    return 'person';
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 4 && !/\b(inc|llc|ltd|corp|company|group|holdings)\b/i.test(trimmed)) {
    return 'person';
  }
  return 'company';
}

export function estimateRunSeconds(toolIds: OsintToolId[]): number {
  return toolIds.reduce((sum, id) => {
    const def = OSINT_TOOLS.find((t) => t.id === id);
    return sum + (def?.estSeconds ?? 5);
  }, 0);
}
