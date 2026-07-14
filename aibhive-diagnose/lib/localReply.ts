import type { TradePack } from './packs/types';
import { detectEquipment } from './knowledge/search';

/** Equipment-aware offline checklists when the fault library has no strong match. */
function equipmentChecklist(equip: string[], pack: TradePack, userText: string): string[] | null {
  const q = userText.toLowerCase();
  if (equip.includes('plumbing') || /\b(bathtub|tub|shower|sink|drain)\b/.test(q)) {
    if (/\b(bathtub|tub|shower|bath)\b/.test(q)) {
      return [
        '- Pull the stopper / overflow plate and clear visible hair and soap scum.',
        '- Fill the tub a few inches and release — note flow rate and gurgles.',
        '- Snake the trap / trap arm via overflow when possible (better access than the shoe).',
        '- Check the nearest lav or toilet for shared branch backup.',
        '- If it reclogs fast, camera the branch for scale or belly.',
      ];
    }
    if (/\bsink|lav\b/.test(q)) {
      return [
        '- Bail standing water, then open the P-trap into a bucket.',
        '- Clear trap and trap arm; check the baffle tee if a disposal is upstream.',
        '- Run water while watching the cleanout / adjacent fixtures for backup.',
      ];
    }
    return [
      '- Identify which fixtures are slow (single fixture vs whole branch).',
      '- Start mechanical clearing before chemical drain openers.',
      '- Verify venting if multiple fixtures gurgle together.',
    ];
  }
  if (equip.includes('dishwasher') || /\bdishwasher\b/.test(q)) {
    return [
      '- Check the air gap / high loop and disposal knockout plug.',
      '- Clean the filter sump and check the drain hose for kink or food plug.',
      '- Run a drain cycle while listening for the drain pump.',
    ];
  }
  if (equip.includes('washer') || /\bwasher|washing machine\b/.test(q)) {
    return [
      '- Check the drain pump filter / coin trap for lint and debris.',
      '- Confirm the standpipe height and that the drain hose is not pushed too deep.',
      '- Listen for the drain pump during spin — hum with no water move often means impeller jam.',
    ];
  }
  if (equip.includes('hvac') || equip.includes('thermostat')) {
    return [
      '- Verify thermostat call, filter condition, and outdoor unit power.',
      '- Check condensate drain / float switch trips before condemning the system.',
    ];
  }
  if (equip.includes('electrical')) {
    return [
      '- Confirm the exact dead outlet / circuit before opening the panel.',
      '- Test GFCI/AFCI resets and verify LINE/LOAD orientation on GFCIs.',
    ];
  }
  if (equip.includes('pool')) {
    return [
      '- Check strainer basket, pump lid o-ring, and multiport position.',
      '- Verify prime and look for suction-side air leaks before chasing the impeller.',
    ];
  }
  if (equip.includes('fiber') || pack.id === 'fiber') {
    return [
      '- Never look into live fiber — measure with power meter or VFL.',
      '- Clean and inspect SC/APC or LC connectors before re-testing loss.',
      '- Segment test: OLT/splitter → field → ONT to isolate high loss.',
      '- For ONT LOS: confirm RX dBm before opening provisioning tickets.',
    ];
  }
  // Pack-generic fallbacks from categories
  return pack.categories.slice(0, 3).flatMap((c) => [`- ${c.label}: ${c.examples[0]}`]);
}

/** Fallback reply when the fault library has no strong match. */
export function buildLocalDiagnosisReply(pack: TradePack, userText: string, hasPhoto: boolean): string {
  const equipment = detectEquipment(userText);
  const equipmentHint =
    equipment.length > 0
      ? equipment.join(', ')
      : pack.commonEquipment.slice(0, 2).join(' / ');
  const checklist = equipmentChecklist(equipment, pack, userText) || [];
  const named = userText.trim();

  return [
    `**${pack.shortName} field check**`,
    '',
    hasPhoto
      ? `Photo received. Working from the ${pack.name} knowledge base.`
      : `Got it — running this through the ${pack.name}.`,
    '',
    `**Quick summary**`,
    named
      ? `Looking at: “${named}”. Focusing on **${equipmentHint}** — not unrelated equipment.`
      : `No notes attached. Begin with a visual + power check on ${equipmentHint}.`,
    '',
    `**Likely checks**`,
    ...checklist,
    '',
    `**Step-by-step**`,
    '1. Confirm power / lockout / water shutoff is safe for the task.',
    '2. Reproduce the symptom once and note what changed.',
    '3. Clear the most common restriction or safety trip for this equipment.',
    '4. Re-test before ordering parts.',
    '',
    `**Safety**`,
    pack.id === 'electrical'
      ? '- De-energize and verify absence of voltage before opening enclosures.'
      : pack.id === 'fiber'
        ? '- Laser safety: never view live fiber. Cap open ports. PON power can exceed eye-safe levels.'
        : pack.id === 'property' || pack.id === 'plumbing'
        ? '- Lock out power/gas/water before opening cabinets. Watch wet tub floors — use mats.'
        : '- Kill power at the breaker before opening pump or heater compartments. Mind chemical exposure.',
    '',
    `_Tip: name the equipment (bathtub, dishwasher, breaker…) for a tighter library match. Connect Pros AI for deeper reasoning when signed in._`,
  ].join('\n');
}
