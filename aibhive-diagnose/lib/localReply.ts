import type { TradePack } from './packs/types';

/** Fallback reply when the fault library has no strong match. */
export function buildLocalDiagnosisReply(pack: TradePack, userText: string, hasPhoto: boolean): string {
  const equipmentHint = pack.commonEquipment.slice(0, 2).join(' / ');
  const firstCategory = pack.categories[0];

  return [
    `**${pack.shortName} field check**`,
    '',
    hasPhoto
      ? `Photo received. Working from the ${pack.name} knowledge base.`
      : `Got it — running this through the ${pack.name}.`,
    '',
    `**Quick summary**`,
    userText.trim()
      ? `Looking at: “${userText.trim()}”. Start with the most common ${firstCategory?.label.toLowerCase() ?? 'equipment'} faults on ${equipmentHint}.`
      : `No notes attached. Begin with a visual + power check on ${equipmentHint}.`,
    '',
    `**Likely causes**`,
    ...pack.categories.slice(0, 3).flatMap((c) => [`- ${c.label}: ${c.examples[0]}`]),
    '',
    `**Step-by-step**`,
    '1. Confirm power / lockout is safe for the task.',
    '2. Inspect connections, seals, and error indicators.',
    '3. Verify the symptom with a basic operational test.',
    '4. Apply the pack-specific fix for the matching fault code or symptom.',
    '',
    `**Safety**`,
    pack.id === 'electrical'
      ? '- De-energize and verify absence of voltage before opening enclosures.'
      : '- Kill power at the breaker before opening pump or heater compartments. Mind chemical exposure.',
    '',
    `_Tip: try Guided Diagnose or Fault Library for faster matches._`,
  ].join('\n');
}
