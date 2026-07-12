import type { TradePackId } from '@/lib/packs/types';

import { MANUAL_CORPUS } from './corpus';
import type { EquipmentManual } from './types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s/.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip spaces/dashes for model-number matching (e.g. W3SP3202 vs W3 SP3202). */
function compactModel(text: string): string {
  return normalize(text).replace(/[\s.-]/g, '');
}

export function searchManuals(
  query: string,
  packId?: TradePackId
): Array<EquipmentManual & { score: number }> {
  const q = query.trim();
  if (!q) {
    const base = packId ? MANUAL_CORPUS.filter((m) => m.packId === packId) : MANUAL_CORPUS;
    return base.slice(0, 12).map((m) => ({ ...m, score: 0 }));
  }

  const nq = normalize(q);
  const cq = compactModel(q);

  return MANUAL_CORPUS.map((doc) => {
    let score = 0;
    const blob = normalize(
      [doc.brand, doc.title, doc.category, doc.summary, ...doc.modelPrefixes].join(' ')
    );

    if (nq.length >= 3 && blob.includes(nq)) score += 10;
    for (const part of nq.split(/\s+/)) {
      if (part.length >= 2 && blob.includes(part)) score += 1;
    }

    for (const prefix of doc.modelPrefixes) {
      const cp = compactModel(prefix);
      if (cp.length >= 3 && (cq.includes(cp) || cp.includes(cq))) score += 18;
      if (nq.includes(normalize(prefix))) score += 12;
    }

    if (packId && doc.packId === packId) score += 4;

    return { ...doc, score };
  })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export function getManualById(id: string): EquipmentManual | undefined {
  return MANUAL_CORPUS.find((m) => m.id === id);
}

export function formatManualHit(doc: EquipmentManual): string {
  return [
    `**${doc.brand} — ${doc.title}**`,
    `Models: ${doc.modelPrefixes.slice(0, 6).join(', ')}`,
    doc.summary,
  ].join('\n');
}
