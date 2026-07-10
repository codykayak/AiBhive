import { buildLocalDiagnosisReply } from '@/lib/grok';
import type { TradePack } from '@/lib/packs';
import { formatFaultAsReply, searchCodes, searchFaults } from './search';

export type LocalDiagnosis = {
  reply: string;
  matchedFaultIds: string[];
  matchedCodes: string[];
};

export function diagnoseLocally(pack: TradePack, userText: string, hasPhoto: boolean): LocalDiagnosis {
  const text = userText.trim();
  const faults = searchFaults(text, pack.id).slice(0, 3);
  const codes = searchCodes(text, pack.id).slice(0, 2);

  if (faults.length === 0 && codes.length === 0) {
    return {
      reply: buildLocalDiagnosisReply(pack, text, hasPhoto),
      matchedFaultIds: [],
      matchedCodes: [],
    };
  }

  const sections: string[] = [];

  if (hasPhoto) {
    sections.push(`Photo noted — cross-checking the **${pack.name}** field library.`);
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

  if (faults.length > 1) {
    sections.push('');
    sections.push(`**Also consider**`);
    for (const f of faults.slice(1)) {
      sections.push(`- ${f.title} (${f.severity})`);
    }
  }

  sections.push('');
  sections.push(`_Offline-capable pack intelligence. Connect Grok for vision + deeper reasoning._`);

  return {
    reply: sections.join('\n'),
    matchedFaultIds: faults.map((f) => f.id),
    matchedCodes: codes.map((c) => c.id),
  };
}
