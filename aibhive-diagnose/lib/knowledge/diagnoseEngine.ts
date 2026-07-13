import type { TradePack } from '@/lib/packs';
import { buildLocalDiagnosisReply } from '@/lib/localReply';
import {
  detectEquipment,
  formatFaultAsReply,
  formatRagAppendix,
  searchCodes,
  searchFaults,
} from './search';

export type LocalDiagnosis = {
  reply: string;
  matchedFaultIds: string[];
  matchedCodes: string[];
};

const VAGUE_GENERIC_REPLIES = [
  'Could you tell me more about the problem so I can help?',
  'Please describe what the equipment is doing — or not doing — and I’ll narrow it down.',
  'What are you working on today? Brand, model, and any error codes help a lot.',
  'Give me the symptom in your own words and I’ll walk you through the next checks.',
];

function isVagueMessage(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (t.length <= 3) return true;
  if (/^(hi|hey|hello|help|yo|sup|thanks|thank you|ok|okay|test)[!.?\s]*$/.test(t)) return true;
  if (/^(good morning|good afternoon|what'?s up)[!.?\s]*$/.test(t)) return true;
  return false;
}

function pickGenericReply(): string {
  return VAGUE_GENERIC_REPLIES[Math.floor(Math.random() * VAGUE_GENERIC_REPLIES.length)]!;
}

export function diagnoseLocally(pack: TradePack, userText: string, hasPhoto: boolean): LocalDiagnosis {
  const text = userText.trim();
  const equipment = detectEquipment(text);
  const faults = searchFaults(text, pack.id).slice(0, 3);
  const codes = searchCodes(text, pack.id).slice(0, 2);

  if (faults.length === 0 && codes.length === 0) {
    if (!hasPhoto && isVagueMessage(text)) {
      return {
        reply: pickGenericReply(),
        matchedFaultIds: [],
        matchedCodes: [],
      };
    }
    const rag = pack.id === 'property' || equipment.length ? formatRagAppendix(text) : '';
    return {
      reply: `${buildLocalDiagnosisReply(pack, text, hasPhoto)}${rag}`,
      matchedFaultIds: [],
      matchedCodes: [],
    };
  }

  const sections: string[] = [];

  if (hasPhoto) {
    sections.push(`Photo noted — cross-checking the **${pack.name}** field library.`);
    sections.push('');
  }

  if (equipment.length && faults[0] && faults[0].packId !== pack.id) {
    sections.push(
      `_Matched a **${faults[0].packId}** playbook for “${equipment.join(', ')}” even though **${pack.shortName}** is active._`
    );
    sections.push('');
  }

  if (codes.length) {
    sections.push(`**Error code hits**`);
    for (const code of codes) {
      sections.push(`- **${code.code}** (${code.brand ?? 'generic'}): ${code.meaning}`);
      sections.push(...code.fix.map((f) => `  · ${f}`));
    }
    sections.push('');
  }

  if (faults[0]) {
    sections.push(formatFaultAsReply(faults[0]));
  }

  // Only list closely related alternates (same category / shared equipment token).
  const related = faults.slice(1).filter((f) => {
    if (!faults[0]) return false;
    if (f.category === faults[0].category) return true;
    const blob = `${f.id} ${f.title}`.toLowerCase();
    return equipment.some((e) => blob.includes(e.replace('-', '')));
  });
  if (related.length) {
    sections.push('');
    sections.push(`**Also consider**`);
    for (const f of related.slice(0, 2)) {
      sections.push(`- ${f.title} (${f.severity})`);
    }
  }

  if (pack.id === 'property' || equipment.length) {
    const rag = formatRagAppendix(text);
    if (rag) sections.push(rag);
  }

  sections.push('');
  sections.push(`_Offline-capable pack intelligence. Connect Grok for vision + deeper reasoning._`);

  return {
    reply: sections.join('\n'),
    matchedFaultIds: faults.map((f) => f.id),
    matchedCodes: codes.map((c) => c.id),
  };
}
