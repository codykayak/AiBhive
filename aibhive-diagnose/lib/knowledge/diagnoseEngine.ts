import type { TradePack } from '@/lib/packs';
import { buildOfflineReply } from '@/lib/diagnose/offlineConversation';
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

export function diagnoseLocally(pack: TradePack, userText: string, hasPhoto: boolean): LocalDiagnosis {
  const text = userText.trim();

  const conversational = buildOfflineReply(pack, text, hasPhoto);
  if (conversational) {
    return {
      reply: conversational.reply,
      matchedFaultIds: conversational.matchedFaultIds,
      matchedCodes: [],
    };
  }

  const equipment = detectEquipment(text);
  const faults = searchFaults(text, pack.id).slice(0, 3);
  const codes = searchCodes(text, pack.id).slice(0, 2);

  if (faults.length === 0 && codes.length === 0) {
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

  const primary = faults[0];
  const related = faults.slice(1).filter((f) => {
    if (!primary) return false;
    if (f.category === primary.category) return true;
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
