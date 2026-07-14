import { electricalErrorCodes, hvacErrorCodes, plumbingErrorCodes, poolErrorCodes } from './codes';
import { electricalFaults } from './electrical/faults';
import { hvacFaults } from './hvac/faults';
import { plumbingFaults } from './plumbing/faults';
import { poolFaults } from './pool/faults';
import { propertyFaults } from './property/faults';
import { formatCorpusHit, searchApplianceCorpus } from './property/applianceCorpus';
import { isVagueUserMessage } from '../diagnose/vagueMessage';
import type { TradePackId } from '../packs/types';
import type { ErrorCode, FaultEntry } from './types';

export const ALL_FAULTS: FaultEntry[] = [
  ...poolFaults,
  ...electricalFaults,
  ...propertyFaults,
  ...plumbingFaults,
  ...hvacFaults,
];
export const ALL_CODES: ErrorCode[] = [
  ...poolErrorCodes,
  ...electricalErrorCodes,
  ...plumbingErrorCodes,
  ...hvacErrorCodes,
];

const STOP = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'to',
  'of',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'for',
  'with',
  'it',
  'this',
  'that',
  'my',
  'our',
  'not',
  'no',
  'wont',
  'will',
  'does',
  'doesnt',
  'dont',
  'cant',
  'just',
  'about',
  'from',
  'into',
  'then',
  'than',
  'very',
  'really',
  'stuff',
  'thing',
  'things',
  'hi',
  'hey',
  'yo',
  'ha',
  'ok',
]);

/** Equipment families — used to keep cross-pack search on-topic. */
const EQUIPMENT: Array<{ id: string; packHint: TradePackId; terms: string[] }> = [
  {
    id: 'dishwasher',
    packHint: 'property',
    terms: ['dishwasher', 'dish washer', 'dish-washer'],
  },
  {
    id: 'washer',
    packHint: 'property',
    terms: ['washing machine', 'laundry machine', 'front load washer', 'top load washer', 'cabrio'],
  },
  {
    id: 'dryer',
    packHint: 'property',
    terms: ['dryer', 'tumbler'],
  },
  {
    id: 'fridge',
    packHint: 'property',
    terms: ['fridge', 'refrigerator', 'freezer', 'ice maker', 'icemaker'],
  },
  {
    id: 'disposal',
    packHint: 'property',
    terms: ['disposal', 'garbage disposal', 'insinkerator'],
  },
  {
    id: 'range',
    packHint: 'property',
    terms: ['oven', 'range', 'stove', 'burner', 'cooktop'],
  },
  {
    id: 'microwave',
    packHint: 'property',
    terms: ['microwave'],
  },
  {
    id: 'water-heater',
    packHint: 'property',
    terms: ['water heater', 'hot water heater', 'tankless'],
  },
  {
    id: 'hvac',
    packHint: 'hvac',
    terms: [
      'hvac',
      'air conditioner',
      'condenser',
      'evaporator',
      'furnace',
      'heat pump',
      'refrigerant',
      'superheat',
      'subcool',
      'txv',
      'compressor',
      'blower motor',
      'air handler',
    ],
  },
  {
    id: 'sink',
    packHint: 'plumbing',
    terms: ['kitchen sink', 'bathroom sink', 'lavatory sink', 'sink drain', 'under sink'],
  },
  {
    id: 'toilet',
    packHint: 'plumbing',
    terms: ['toilet', 'closet', 'wax ring'],
  },
  {
    id: 'plumbing',
    packHint: 'plumbing',
    terms: [
      'plumber',
      'plumbing',
      'sewer',
      'drain clog',
      'main line',
      'water heater',
      'tankless',
      'toilet',
      'wax ring',
      'prv',
      'backflow',
      'sump pump',
      'pex',
      'angle stop',
      'cleanout',
      'bathtub',
      'bath tub',
      'tub drain',
      'shower drain',
      'shower',
      'tub',
      'bath',
      'floor drain',
    ],
  },
  {
    id: 'thermostat',
    packHint: 'hvac',
    terms: ['thermostat', 'nest', 'ecobee', 'honeywell stat'],
  },
  {
    id: 'pool',
    packHint: 'pool',
    terms: ['pool', 'spa', 'salt cell', 'filter pump', 'skimmer', 'multiport', 'heater'],
  },
  {
    id: 'electrical',
    packHint: 'electrical',
    terms: ['breaker', 'panel', 'gfci', 'afci', 'outlet', 'neutral', 'subpanel', 'lug'],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s/+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export function detectEquipment(query: string): string[] {
  const q = ` ${normalize(query)} `;
  const hits: string[] = [];
  for (const e of EQUIPMENT) {
    const matched = e.terms.some((t) => {
      const term = normalize(t);
      return (
        q.includes(` ${term} `) ||
        q.startsWith(` ${term}`) ||
        q.endsWith(`${term} `) ||
        q === ` ${term} `
      );
    });
    if (matched) hits.push(e.id);
  }
  // Bare "washer" (not dishwasher)
  if (/\bwasher\b/.test(q) && !/\bdish\s*washer\b/.test(q) && !hits.includes('washer')) {
    hits.push('washer');
  }
  // Bare fixture nouns
  if (/\bsink\b/.test(q) && !/\bdish\s*washer\b/.test(q) && !hits.includes('sink')) {
    hits.push('sink');
  }
  if (/\btoilet\b/.test(q) && !hits.includes('toilet')) hits.push('toilet');
  if (
    !hits.includes('plumbing') &&
    /\b(bathtub|bath\s*tub|\btub\b|shower|lavatory|\blav\b|floor\s*drain)\b/.test(q)
  ) {
    hits.push('plumbing');
  }
  // Bare "heater" for pool vs water-heater already handled via phrases
  return hits;
}

function detectedPackHints(query: string): TradePackId[] {
  const ids = detectEquipment(query);
  const hints = new Set<TradePackId>();
  for (const id of ids) {
    const row = EQUIPMENT.find((e) => e.id === id);
    if (row) hints.add(row.packHint);
  }
  return [...hints];
}

function scoreFault(fault: FaultEntry, query: string): number {
  const q = normalize(query);
  const qTokens = tokens(query);
  if (!q) return 0;

  const title = normalize(fault.title);
  const aliases = fault.aliases.map(normalize);
  const category = normalize(fault.category);
  const symptoms = fault.symptoms.map(normalize).join(' ');
  const causes = fault.likelyCauses.map(normalize).join(' ');
  const steps = fault.steps.map(normalize).join(' ');
  const blob = [title, category, ...aliases, symptoms, causes, steps].join(' ');

  let score = 0;

  // Exact / near-exact title or alias
  if (title === q) score += 40;
  if (aliases.some((a) => a === q || a.includes(q) || q.includes(a))) score += 18;
  if (title.includes(q)) score += 16;

  // Token hits — short tokens must match whole words (avoid "hi" → "high"/"ignition").
  for (const t of qTokens) {
    const wordRe = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (wordRe.test(title)) score += 6;
    else if (aliases.some((a) => wordRe.test(a))) score += 4;
    else if (wordRe.test(category)) score += 3;
    else if (wordRe.test(symptoms) || wordRe.test(causes)) score += 2;
    else if (wordRe.test(steps)) score += 1;
    else if (t.length >= 4 && blob.includes(t)) score += 1;
  }

  // Equipment family boost / penalty
  const equip = detectEquipment(query);
  const inFault = normalize(`${fault.id} ${fault.title} ${fault.category} ${fault.aliases.join(' ')}`);
  const isDishwasherFault = inFault.includes('dishwasher');
  const isWasherFault =
    (inFault.includes('washer') || inFault.includes('laundry')) && !isDishwasherFault;
  const isDryerFault = inFault.includes('dryer');
  const isDisposalFault = inFault.includes('disposal');
  const isTubShowerFault =
    /tub|shower|bath|hair clog|strainer/.test(inFault) || fault.id.includes('shower-tub');
  const isSinkDrainFault = /sink|lav|p-trap|ptrap/.test(inFault);
  const isPlumbingDrainFault =
    fault.packId === 'plumbing' && (fault.category === 'drains' || /drain/.test(inFault));

  const mentionsTubBathShower = /\b(bathtub|bath\s*tub|\btub\b|shower|bath)\b/.test(q);
  const mentionsSink = /\b(sink|lavatory|\blav\b)\b/.test(q);
  const drainSymptom =
    /\b(wont|won't|not|no)\s*(drain|draining)\b/.test(q) ||
    /\b(slow\s*drain|clog|clogged|standing\s*water|backup|backed\s*up)\b/.test(q);

  for (const id of equip) {
    if (id === 'dishwasher') {
      if (isDishwasherFault) score += 22;
      else if (isDisposalFault) score += 6; // common drain path
      else if (isWasherFault || isDryerFault || fault.packId === 'pool') score -= 22;
    }
    if (id === 'washer') {
      if (isWasherFault) score += 22;
      else if (isDishwasherFault || isDryerFault) score -= 18;
    }
    if (id === 'dryer') {
      if (isDryerFault) score += 22;
      else if (isWasherFault || isDishwasherFault) score -= 18;
    }
    if (id === 'fridge' && (inFault.includes('fridge') || inFault.includes('ice'))) score += 20;
    if (id === 'disposal' && isDisposalFault) score += 20;
    if (id === 'pool' && fault.packId === 'pool') score += 12;
    if (id === 'electrical' && fault.packId === 'electrical') score += 12;
    if (id === 'plumbing' && fault.packId === 'plumbing') score += 12;
    if (id === 'sink' && isSinkDrainFault) score += 24;
    if (id === 'sink' && isTubShowerFault) score -= 32;
    if (id === 'toilet' && /toilet/.test(inFault)) score += 20;
    if (id === 'hvac' && fault.packId === 'hvac') score += 12;
  }

  // Fixture-named drain queries must not land on dishwasher/washer playbooks.
  if (mentionsSink && !mentionsTubBathShower && !/\bdish/.test(q)) {
    if (isSinkDrainFault) score += 28;
    else if (isPlumbingDrainFault && !isTubShowerFault) score += 14;
    if (isTubShowerFault) score -= 40;
    if (isDishwasherFault) score -= 24;
    if (/toilet/.test(inFault) && fault.packId === 'plumbing') score += 10;
  }
  if (mentionsTubBathShower && !mentionsSink) {
    if (isTubShowerFault || (isPlumbingDrainFault && !isSinkDrainFault)) score += 28;
    if (isDishwasherFault || isWasherFault) score -= 30;
    if (isSinkDrainFault && !isTubShowerFault) score -= 12;
  }
  if (mentionsTubBathShower && mentionsSink) {
    // Both named — prefer whichever fault matches more fixtures.
    if (isTubShowerFault) score += 12;
    if (isSinkDrainFault) score += 12;
  }

  // Phrase: "won't drain" / "not draining"
  if (drainSymptom) {
    if (/wont drain|no drain|not drain|standing water|slow drain|clog/.test(title) || /drain/.test(fault.id)) {
      score += 14;
    }
    if (/wont spin|no spin|drains but/.test(title) || /no-spin/.test(fault.id)) score -= 8;
    if (title.includes('leak') && !title.includes('drain')) score -= 4;

    // Symptom-only drain (no appliance named) → prefer plumbing fixture drains over appliances.
    const namedAppliance = equip.some((id) =>
      ['dishwasher', 'washer', 'dryer', 'disposal', 'fridge', 'range', 'microwave'].includes(id)
    );
    if (!namedAppliance && (mentionsTubBathShower || mentionsSink || equip.includes('plumbing'))) {
      if (isPlumbingDrainFault) score += 18;
      if (isDishwasherFault || isWasherFault) score -= 20;
    } else if (!namedAppliance && !equip.length) {
      // Completely bare "not draining" — still prefer plumbing over random appliance hits.
      if (isPlumbingDrainFault) score += 10;
      if (isDishwasherFault) score -= 8;
    }
  }
  if (/\b(wont|not|no)\s*(spin|spinning)\b/.test(q)) {
    if (/spin/.test(title) || /spin/.test(fault.id)) score += 12;
  }
  if (/\b(no heat|no heat|wont heat|not heating|cold)\b/.test(q)) {
    if (/no heat|no ignition|cold/.test(title) || /no-heat/.test(fault.id)) score += 12;
  }

  return score;
}

function packFilter(
  packId: TradePackId | undefined,
  faultPackId: TradePackId,
  query: string
): boolean {
  if (!packId) return true;
  if (packId === faultPackId) return true;

  // Property may pull other packs when the query clearly points there.
  if (packId === 'property') {
    const hints = detectedPackHints(query);
    // Drain / fixture wording with no appliance → allow plumbing playbooks.
    const q = normalize(query);
    const fixtureDrain =
      /\b(bathtub|bath\s*tub|\btub\b|shower|sink|lavatory|floor\s*drain)\b/.test(q) ||
      (/\b(wont|won't|not|no)\s*(drain|draining)\b/.test(q) &&
        !/\b(dishwasher|washer|washing\s*machine|disposal)\b/.test(q));
    if (fixtureDrain && faultPackId === 'plumbing') return true;

    if (!hints.length) {
      return false;
    }
    const crossTrade = ['pool', 'electrical', 'plumbing', 'hvac'] as const;
    const onlyProperty =
      hints.includes('property') && !crossTrade.some((p) => hints.includes(p));
    if (onlyProperty) {
      return false;
    }
    if (hints.includes(faultPackId)) return true;
    return false;
  }
  // Dedicated trade packs only search their own faults unless property cross-pack rules apply.
  return false;
}

export function searchFaults(query: string, packId?: TradePackId): FaultEntry[] {
  const q = query.trim();
  if (q && isVagueUserMessage(q)) return [];

  const base = ALL_FAULTS.filter((f) => packFilter(packId, f.packId, q));

  if (!normalize(q)) {
    if (packId === 'property') return ALL_FAULTS.filter((f) => f.packId === 'property');
    return packId ? ALL_FAULTS.filter((f) => f.packId === packId) : ALL_FAULTS;
  }

  // If active pack is pool/electrical but query is clearly an appliance, also search property.
  let candidates = base;
  const hints = detectedPackHints(q);
  if (packId && packId !== 'property' && hints.includes('property') && !hints.includes(packId)) {
    candidates = ALL_FAULTS.filter((f) => f.packId === 'property' || f.packId === packId);
  }

  return candidates
    .map((fault) => {
      let score = scoreFault(fault, q);
      if (packId && fault.packId === packId) score += 3;
      if (packId === 'property' && fault.packId === 'property') score += 2;
      return { fault, score };
    })
    .filter((x) => x.score >= 4)
    .sort((a, b) => b.score - a.score || a.fault.title.localeCompare(b.fault.title))
    .map((x) => x.fault);
}

export function searchCodes(query: string, packId?: TradePackId): ErrorCode[] {
  const q = normalize(query);
  const list = packId && packId !== 'property' ? ALL_CODES.filter((c) => c.packId === packId) : ALL_CODES;
  if (!q) return list;
  const qTokens = tokens(query);
  return list
    .map((c) => {
      const blob = normalize(`${c.code} ${c.brand ?? ''} ${c.meaning}`);
      let score = 0;
      if (blob.includes(q)) score += 8;
      for (const t of qTokens) if (blob.includes(t)) score += 1;
      if (normalize(c.code).replace(/\s+/g, '') && q.includes(normalize(c.code).replace(/\s+/g, ''))) {
        score += 10;
      }
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}

export function getFaultById(id: string): FaultEntry | undefined {
  return ALL_FAULTS.find((f) => f.id === id);
}

export function searchWithApplianceRag(query: string, packId?: TradePackId) {
  const faults = searchFaults(query, packId);
  const corpus =
    packId === 'property' || !packId || detectEquipment(query).length
      ? searchApplianceCorpus(query).slice(0, 3)
      : [];
  return { faults, corpus };
}

export function formatFaultAsReply(fault: FaultEntry): string {
  const packLabel =
    fault.packId === 'pool'
      ? 'Pool'
      : fault.packId === 'electrical'
        ? 'Electrical'
        : fault.packId === 'plumbing'
          ? 'Plumbing'
          : fault.packId === 'hvac'
            ? 'HVAC'
            : 'Property Maintenance';
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
