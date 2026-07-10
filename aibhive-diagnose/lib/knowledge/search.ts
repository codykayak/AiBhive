import { electricalErrorCodes, poolErrorCodes } from './codes';
import { electricalFaults } from './electrical/faults';
import { poolFaults } from './pool/faults';
import type { ErrorCode, FaultEntry } from './types';

export const ALL_FAULTS: FaultEntry[] = [...poolFaults, ...electricalFaults];
export const ALL_CODES: ErrorCode[] = [...poolErrorCodes, ...electricalErrorCodes];

function scoreText(haystack: string, needle: string): number {
  if (!needle) return 0;
  if (haystack === needle) return 10;
  if (haystack.includes(needle)) return 5;
  const parts = needle.split(/\s+/).filter(Boolean);
  return parts.reduce((acc, p) => (haystack.includes(p) ? acc + 1 : acc), 0);
}

export function searchFaults(query: string, packId?: 'pool' | 'electrical'): FaultEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return packId ? ALL_FAULTS.filter((f) => f.packId === packId) : ALL_FAULTS;
  }

  return ALL_FAULTS
    .filter((f) => (packId ? f.packId === packId : true))
    .map((fault) => {
      const blob = [fault.title, fault.category, ...fault.aliases, ...fault.symptoms, ...fault.likelyCauses]
        .join(' ')
        .toLowerCase();
      return { fault, score: scoreText(blob, q) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.fault);
}

export function searchCodes(query: string, packId?: 'pool' | 'electrical'): ErrorCode[] {
  const q = query.trim().toLowerCase();
  const list = packId ? ALL_CODES.filter((c) => c.packId === packId) : ALL_CODES;
  if (!q) return list;
  return list.filter((c) => {
    const blob = `${c.code} ${c.brand ?? ''} ${c.meaning}`.toLowerCase();
    return blob.includes(q) || q.split(/\s+/).some((p) => blob.includes(p));
  });
}

export function getFaultById(id: string): FaultEntry | undefined {
  return ALL_FAULTS.find((f) => f.id === id);
}

export function formatFaultAsReply(fault: FaultEntry): string {
  return [
    `**${fault.title}**`,
    '',
    `**Quick summary**`,
    `Field match in the ${fault.packId === 'pool' ? 'Pool' : 'Electrical'} pack · severity **${fault.severity}**.`,
    '',
    `**Likely causes**`,
    ...fault.likelyCauses.map((c) => `- ${c}`),
    '',
    `**Step-by-step**`,
    ...fault.steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    `**Safety**`,
    ...fault.safety.map((s) => `- ${s}`),
    '',
    `**Tools**`,
    fault.tools.map((t) => t).join(' · ') || 'Standard hand tools',
    '',
    `**Parts to have ready**`,
    fault.parts.map((p) => p).join(' · ') || 'Diagnose before ordering',
    '',
    `**Pro tip**`,
    fault.proTips[0] ?? 'Document with photos before and after.',
  ].join('\n');
}
