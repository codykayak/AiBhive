import type { IntelWebCase } from './intelWebApi';

const KEY = 'aibhive_intel_web_cases_v1';

export function listIntelWebCases(): IntelWebCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IntelWebCase[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  } catch {
    return [];
  }
}

function saveAll(cases: IntelWebCase[]) {
  localStorage.setItem(KEY, JSON.stringify(cases.slice(0, 30)));
}

export function getIntelWebCase(id: string): IntelWebCase | null {
  return listIntelWebCases().find((c) => c.id === id) ?? null;
}

export function createIntelWebCase(
  partial: Pick<IntelWebCase, 'target' | 'enabledTools'>
): IntelWebCase {
  const now = new Date().toISOString();
  const intelCase: IntelWebCase = {
    id: `intel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    target: partial.target,
    enabledTools: partial.enabledTools,
    toolResults: [],
  };
  const cases = listIntelWebCases();
  cases.unshift(intelCase);
  saveAll(cases);
  return intelCase;
}

export function updateIntelWebCase(id: string, patch: Partial<IntelWebCase>): IntelWebCase | null {
  const cases = listIntelWebCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const updated: IntelWebCase = {
    ...cases[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  cases[idx] = updated;
  saveAll(cases);
  return updated;
}

export function deleteIntelWebCase(id: string) {
  saveAll(listIntelWebCases().filter((c) => c.id !== id));
}
