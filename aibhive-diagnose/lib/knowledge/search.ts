import { electricalErrorCodes, poolErrorCodes } from './codes';
import { electricalFaults } from './electrical/faults';
import { poolFaults } from './pool/faults';
import { propertyFaults } from './property/faults';
import { formatCorpusHit, searchApplianceCorpus } from './property/applianceCorpus';
import type { TradePackId } from '../packs/types';
import type { ErrorCode, FaultEntry } from './types';

export const ALL_FAULTS: FaultEntry[] = [...poolFaults, ...electricalFaults, ...propertyFaults];
export const ALL_CODES: ErrorCode[] = [...poolErrorCodes, ...electricalErrorCodes];

function scoreText(haystack: string, needle: string): number {
  if (!needle) return 0;
  if (haystack === needle) return 10;
  if (haystack.includes(needle)) return 5;
  const parts = needle.split(/\s+/).filter(Boolean);
  return parts.reduce((acc, p) => (haystack.includes(p) ? acc + 1 : acc), 0);
}

function packFilter(packId: TradePackId | undefined, faultPackId: TradePackId): boolean {
  if (!packId) return true;
  if (packId === faultPackId) return true;
  // Property maintenance pulls related electrical / pool playbooks too.
  if (packId === 'property') return true;
  return false;
}

export function searchFaults(query: string, packId?: TradePackId): FaultEntry[] {
  const q = query.trim().toLowerCase();
  const base = ALL_FAULTS.filter((f) => packFilter(packId, f.packId));

  if (!q) {
    if (packId === 'property') return ALL_FAULTS.filter((f) => f.packId === 'property');
    return packId ? ALL_FAULTS.filter((f) => f.packId === packId) : ALL_FAULTS;
  }

  return base
    .map((fault) => {
      const blob = [fault.title, fault.category, ...fault.aliases, ...fault.symptoms, ...fault.likelyCauses]
        .join(' ')
        .toLowerCase();
      let score = scoreText(blob, q);
      // Prefer same-pack hits when property is searching cross-pack.
      if (packId === 'property' && fault.packId === 'property') score += 2;
      return { fault, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.fault);
}

export function searchCodes(query: string, packId?: TradePackId): ErrorCode[] {
  const q = query.trim().toLowerCase();
  const list = packId && packId !== 'property' ? ALL_CODES.filter((c) => c.packId === packId) : ALL_CODES;
  if (!q) return list;
  return list.filter((c) => {
    const blob = `${c.code} ${c.brand ?? ''} ${c.meaning}`.toLowerCase();
    return blob.includes(q) || q.split(/\s+/).some((p) => blob.includes(p));
  });
}

export function getFaultById(id: string): FaultEntry | undefined {
  return ALL_FAULTS.find((f) => f.id === id);
}

export function searchWithApplianceRag(query: string, packId?: TradePackId) {
  const faults = searchFaults(query, packId);
  const corpus = packId === 'property' || !packId ? searchApplianceCorpus(query).slice(0, 3) : [];
  return { faults, corpus };
}

export function formatFaultAsReply(fault: FaultEntry): string {
  const packLabel =
    fault.packId === 'pool' ? 'Pool' : fault.packId === 'electrical' ? 'Electrical' : 'Property Maintenance';
  return [
    `**${fault.title}**`,
    '',
    `**Quick summary**`,
    `Field match in the ${packLabel} pack · severity **${fault.severity}**.`,
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

export function formatRagAppendix(query: string): string {
  const hits = searchApplianceCorpus(query).slice(0, 2);
  if (!hits.length) return '';
  return ['', '**Model / code hits (local corpus)**', ...hits.map((h) => formatCorpusHit(h))].join('\n');
}
