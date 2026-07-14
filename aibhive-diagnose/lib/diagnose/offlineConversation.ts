import type { TradePack } from '@/lib/packs/types';
import { getFaultById, searchFaults } from '@/lib/knowledge/search';

/** Greetings and other messages with no fault described yet. */
export function isVagueUserMessage(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (t.length <= 3) return true;
  if (/^(hi|hey|hello|help|yo|sup|thanks|thank you|ok|okay|test|hola)[!.?\s]*$/.test(t)) return true;
  if (/^(good morning|good afternoon|what'?s up|how are you)[!.?\s]*$/.test(t)) return true;
  return false;
}

const GREETING_REPLIES: Record<string, string> = {
  hi: 'Hello! What are you working on today?',
  hey: 'Hey — tell me about the equipment or fault and I’ll walk you through it.',
  hello: 'Hello! What equipment or problem are you on today?',
  hola: 'Hello! What are you working on today?',
  yo: 'Hey — what’s the job?',
  sup: 'Hey — what equipment or fault can I help with?',
  help: 'I’m here — describe the equipment and what it’s doing (or not doing).',
};

export function buildGreetingReply(text: string): string {
  const key = text.trim().toLowerCase().replace(/[!.?\s]+$/g, '');
  const direct = GREETING_REPLIES[key];
  if (direct) return direct;
  if (/^good morning/.test(key)) return 'Good morning! What are you working on today?';
  if (/^good afternoon/.test(key)) return 'Good afternoon! What fault or equipment can I help with?';
  if (/^what'?s up/.test(key)) return 'Hey — what are you working on?';
  return 'Hello! Tell me what you’re working on — equipment, symptom, or error code.';
}

/** User named a fixture/equipment but not a symptom yet (e.g. "sink", "kitchen sink"). */
const SYMPTOM_RE =
  /\b(wont|won't|not|no|slow|clog|clogged|leak|leaking|drip|dripping|backup|backed|gurgle|gurgling|broken|failed|failure|error|code|smell|odor|noise|hum|buzz|trip|tripped|cold|hot|heat|freeze|frozen|overflow|rocking|running|phantom|weak|partial|standing|water|drain|draining|spin|prime|fire|ignite|spark|shock|dead|flicker)\b/i;

const FIXTURE_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: 'sink', re: /\b(sink|lavatory|\blav\b|kitchen sink|bathroom sink)\b/i },
  { id: 'toilet', re: /\btoilet\b/i },
  { id: 'tub', re: /\b(bathtub|bath\s*tub|\btub\b|shower)\b/i },
  { id: 'disposal', re: /\b(disposal|garbage disposal)\b/i },
  { id: 'dishwasher', re: /\bdishwasher\b/i },
  { id: 'washer', re: /\b(washing machine|washer)\b/i },
  { id: 'dryer', re: /\bdryer\b/i },
  { id: 'furnace', re: /\bfurnace\b/i },
  { id: 'ac', re: /\b(air conditioner|a\/c|ac unit|condenser)\b/i },
  { id: 'heat-pump', re: /\bheat\s*pump\b/i },
  { id: 'water-heater', re: /\bwater heater\b/i },
  { id: 'pool-pump', re: /\b(pool pump|filter pump)\b/i },
  { id: 'breaker', re: /\b(breaker|panel|gfci)\b/i },
];

export function detectFixtureMention(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  for (const row of FIXTURE_PATTERNS) {
    if (row.re.test(t)) return row.id;
  }
  return null;
}

export function isEquipmentProbeOnly(text: string): boolean {
  const t = text.trim();
  if (!t || isVagueUserMessage(t)) return false;
  if (SYMPTOM_RE.test(t)) return false;
  const fixture = detectFixtureMention(t);
  if (!fixture) return false;
  const words = t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
  return words.length <= 4;
}

type TopicRef = { faultId: string; prompt: string };

/** Curated related playbooks when the user only names equipment. */
const RELATED_BY_FIXTURE: Record<string, TopicRef[]> = {
  sink: [
    { faultId: 'plumb-kitchen-grease-clog', prompt: 'Slow drain or grease clog' },
    { faultId: 'plumb-under-sink-supply-leak', prompt: 'Leak under the cabinet' },
    { faultId: 'plumb-toilet-weak-flush', prompt: 'Toilet gurgles / weak flush on same branch' },
    { faultId: 'plumb-main-sewer-backup', prompt: 'Multiple fixtures backing up' },
  ],
  toilet: [
    { faultId: 'plumb-toilet-weak-flush', prompt: 'Weak flush or partial clog' },
    { faultId: 'plumb-toilet-running-phantom', prompt: 'Running / phantom flush' },
    { faultId: 'plumb-toilet-wax-ring-leak', prompt: 'Leak or rocking at the base' },
    { faultId: 'plumb-main-sewer-backup', prompt: 'Whole bathroom group backing up' },
  ],
  tub: [
    { faultId: 'plumb-shower-tub-slow-drain', prompt: 'Slow tub or shower drain' },
    { faultId: 'plumb-shower-valve-temp-fault', prompt: 'No hot or scalding at shower' },
    { faultId: 'plumb-main-sewer-backup', prompt: 'Tub backs up with toilet use' },
  ],
  disposal: [
    { faultId: 'plumb-kitchen-grease-clog', prompt: 'Disposal / kitchen line clog' },
  ],
  dishwasher: [
    { faultId: 'prop-dishwasher-no-drain', prompt: 'Won’t drain / standing water' },
    { faultId: 'prop-dishwasher-leak', prompt: 'Leak at door or under unit' },
  ],
  washer: [
    { faultId: 'prop-washer-no-drain', prompt: 'Won’t drain' },
    { faultId: 'prop-washer-no-spin', prompt: 'Drains but won’t spin' },
  ],
  dryer: [
    { faultId: 'prop-dryer-no-heat', prompt: 'Runs but no heat' },
    { faultId: 'prop-dryer-gas-no-heat', prompt: 'Gas dryer — ignites then quits' },
  ],
  furnace: [
    { faultId: 'hvac-furnace-no-heat', prompt: 'No heat / no ignition' },
    { faultId: 'hvac-ignitor-failure', prompt: 'Ignitor glows but no fire' },
    { faultId: 'hvac-flame-sensor-fault', prompt: 'Flame lights then drops out' },
  ],
  ac: [
    { faultId: 'hvac-ac-warm-air', prompt: 'Not cooling / warm air' },
    { faultId: 'hvac-frozen-evaporator-coil', prompt: 'Frozen coil / low airflow' },
  ],
  'heat-pump': [
    { faultId: 'hvac-heat-pump-wont-heat', prompt: 'No heat in heat mode' },
    { faultId: 'hvac-frozen-evaporator-coil', prompt: 'Outdoor unit iced up' },
  ],
  'water-heater': [
    { faultId: 'plumb-tank-wh-no-hot', prompt: 'No hot water' },
    { faultId: 'plumb-tp-valve-dripping', prompt: 'Relief valve dripping' },
  ],
  'pool-pump': [
    { faultId: 'pool-pump-no-prime', prompt: 'Pump won’t prime' },
    { faultId: 'pool-pump-hum-no-spin', prompt: 'Hums but no flow' },
  ],
  breaker: [
    { faultId: 'elec-breaker-nuisance', prompt: 'Breaker keeps tripping' },
    { faultId: 'elec-no-power-circuit', prompt: 'Dead outlet or circuit' },
  ],
};

function fixtureLabel(fixture: string): string {
  const labels: Record<string, string> = {
    sink: 'sink',
    toilet: 'toilet',
    tub: 'tub / shower',
    disposal: 'disposal',
    dishwasher: 'dishwasher',
    washer: 'washer',
    dryer: 'dryer',
    furnace: 'furnace',
    ac: 'A/C',
    'heat-pump': 'heat pump',
    'water-heater': 'water heater',
    'pool-pump': 'pool pump',
    breaker: 'breaker / panel',
  };
  return labels[fixture] || fixture;
}

function followUpQuestion(fixture: string): string {
  const qs: Record<string, string> = {
    sink: 'What’s going on — slow drain, leak under the cabinet, or gurgling when the toilet runs?',
    toilet: 'Is it a weak flush, running constantly, or leaking at the base?',
    tub: 'Is the tub/shower slow to drain, or a valve/temperature issue?',
    furnace: 'No heat at all, ignitor glowing with no fire, or flame that drops out?',
    default: 'Describe the symptom and I’ll narrow the playbook.',
  };
  return qs[fixture] || qs.default;
}

/** Offline reply listing related playbooks for a bare equipment mention. */
export function buildEquipmentProbeReply(pack: TradePack, text: string): {
  reply: string;
  matchedFaultIds: string[];
} {
  const fixture = detectFixtureMention(text) || 'sink';
  const refs = RELATED_BY_FIXTURE[fixture] || [];
  const lines: string[] = [
    `**${fixtureLabel(fixture).charAt(0).toUpperCase() + fixtureLabel(fixture).slice(1)} — what are you seeing?**`,
    '',
    'Common jobs on this equipment:',
  ];

  const matchedFaultIds: string[] = [];
  for (const ref of refs) {
    const fault = getFaultById(ref.faultId);
    if (fault) {
      matchedFaultIds.push(fault.id);
      lines.push(`- **${fault.title}** — ${ref.prompt}`);
    } else {
      lines.push(`- ${ref.prompt}`);
    }
  }

  lines.push('');
  lines.push(followUpQuestion(fixture));
  lines.push('');
  lines.push(`_Active pack: **${pack.shortName}**. Name the symptom (slow drain, leak, no heat…) for step-by-step checks._`);

  return { reply: lines.join('\n'), matchedFaultIds };
}

export function buildOfflineReply(
  pack: TradePack,
  text: string,
  hasPhoto: boolean
): { reply: string; matchedFaultIds: string[]; kind: 'greeting' | 'probe' | 'diagnose' } | null {
  if (!hasPhoto && isVagueUserMessage(text)) {
    return { reply: buildGreetingReply(text), matchedFaultIds: [], kind: 'greeting' };
  }
  if (!hasPhoto && isEquipmentProbeOnly(text)) {
    const probe = buildEquipmentProbeReply(pack, text);
    return { ...probe, kind: 'probe' };
  }
  return null;
}
