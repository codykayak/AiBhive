/**
 * Lightweight local “RAG” corpus for appliance repair —
 * brand/model families, common codes, and retrieval snippets.
 * diagnoseEngine / searchApplianceCorpus score these at query time.
 */

export type ApplianceDoc = {
  id: string;
  brand: string;
  category: string;
  models: string[];
  codes: Array<{ code: string; meaning: string }>;
  snippets: string[];
  relatedFaultIds: string[];
};

export const APPLIANCE_CORPUS: ApplianceDoc[] = [
  {
    id: 'whirlpool-cabrio-washer',
    brand: 'Whirlpool / Maytag / Kenmore',
    category: 'appliances',
    models: ['Cabrio', 'Bravos', 'MVWB', 'WTW'],
    codes: [
      { code: 'F21 / E21', meaning: 'Long drain — pump or clog' },
      { code: 'F7 E1', meaning: 'Tach / motor speed' },
      { code: 'Lid lock', meaning: 'Won’t lock → no spin' },
    ],
    snippets: [
      'Front service panel hides the drain pump and coin trap on many Cabrio platforms.',
      'F21 almost always drain path — clean filter before replacing pump.',
    ],
    relatedFaultIds: ['prop-washer-no-drain', 'prop-washer-no-spin'],
  },
  {
    id: 'lg-front-load-washer',
    brand: 'LG',
    category: 'appliances',
    models: ['WM', 'WT'],
    codes: [
      { code: 'OE', meaning: 'Drain error' },
      { code: 'UE', meaning: 'Unbalance' },
      { code: 'LE', meaning: 'Motor overloaded / locked' },
      { code: 'dE', meaning: 'Door error' },
    ],
    snippets: [
      'OE: check drain hose height and pump filter behind kickplate.',
      'LE often foreign object between tub and drum — check before inverter.',
    ],
    relatedFaultIds: ['prop-washer-no-drain', 'prop-washer-no-spin'],
  },
  {
    id: 'samsung-washer',
    brand: 'Samsung',
    category: 'appliances',
    models: ['WF', 'WA'],
    codes: [
      { code: '4C / 4E', meaning: 'Water supply' },
      { code: '5C / 5E / OE', meaning: 'Drain' },
      { code: 'DC', meaning: 'Unbalance / door' },
      { code: 'UC', meaning: 'Power fluctuation' },
    ],
    snippets: [
      'Samsung drain errors: clean filter and verify standpipe isn’t sealed airtight.',
    ],
    relatedFaultIds: ['prop-washer-no-drain'],
  },
  {
    id: 'whirlpool-dryer-electric',
    brand: 'Whirlpool / Maytag',
    category: 'appliances',
    models: ['WED', 'MED', 'LER'],
    codes: [
      { code: 'PF', meaning: 'Power failure' },
      { code: 'F01', meaning: 'Control board' },
    ],
    snippets: [
      'No-heat electric: verify both legs of 240V, then thermal fuse on blower housing.',
      'Restricted vent kills fuses — replace fuse only after cleaning vent.',
    ],
    relatedFaultIds: ['prop-dryer-no-heat'],
  },
  {
    id: 'ge-profile-fridge',
    brand: 'GE / Profile / Café',
    category: 'appliances',
    models: ['GFE', 'PFE', 'CFE', 'GSS'],
    codes: [{ code: 'FF', meaning: 'Stuck in freeze mode / control' }],
    snippets: [
      'Warm fresh food + iced evaporator = defrost system.',
      'Start with JHS style start relay click diagnosis if compressor won’t stay in.',
    ],
    relatedFaultIds: ['prop-fridge-warm', 'prop-fridge-not-cold', 'prop-ice-maker-dead'],
  },
  {
    id: 'lg-fridge',
    brand: 'LG',
    category: 'appliances',
    models: ['LFX', 'LRF', 'LTCS'],
    codes: [
      { code: 'IS Err', meaning: 'Ice / water path' },
      { code: 'F / FS', meaning: 'Freezer sensor' },
    ],
    snippets: [
      'LG linear compressor platforms: confirm condenser fan and coils before sealed-system call.',
    ],
    relatedFaultIds: ['prop-fridge-warm', 'prop-ice-maker-dead'],
  },
  {
    id: 'samsung-fridge',
    brand: 'Samsung',
    category: 'appliances',
    models: ['RF', 'RT'],
    codes: [
      { code: '88 88', meaning: 'Forced defrost / showroom' },
      { code: 'Ice Off', meaning: 'Ice maker disabled' },
    ],
    snippets: [
      'Ice maker fill tube freeze is common — check inlet valve dribble.',
      'Class-action era boards: verify model/serial against property replacement policy.',
    ],
    relatedFaultIds: ['prop-ice-maker-dead', 'prop-fridge-warm'],
  },
  {
    id: 'bosch-dishwasher',
    brand: 'Bosch',
    category: 'appliances',
    models: ['SHP', 'SHX', 'SHE'],
    codes: [
      { code: 'E15', meaning: 'Water in base — leak tray' },
      { code: 'E24', meaning: 'Drain' },
    ],
    snippets: [
      'E15: tip unit to drain base float area; find leak source before reset.',
    ],
    relatedFaultIds: ['prop-dishwasher-leak', 'prop-dishwasher-no-drain'],
  },
  {
    id: 'whirlpool-dishwasher',
    brand: 'Whirlpool / KitchenAid',
    category: 'appliances',
    models: ['WDT', 'KUDS'],
    codes: [{ code: 'F2 E2', meaning: 'Stuck key / control' }],
    snippets: [
      'Door leaks: confirm detergent type — pods OK, hand soap = suds flood.',
    ],
    relatedFaultIds: ['prop-dishwasher-leak', 'prop-dishwasher-no-drain'],
  },
  {
    id: 'ao-smith-wh',
    brand: 'A.O. Smith / State / Rheem',
    category: 'water-heaters',
    models: ['GCR', 'XCV', 'XE', 'PRO+'],
    codes: [
      { code: 'ECO', meaning: 'High limit trip on electric' },
      { code: 'Error 4 (tankless)', meaning: 'Flow / ignition vary by brand' },
    ],
    snippets: [
      'Electric: upper ECO reset then ohm elements.',
      'Annual flush reduces pop/crackle sediment noise and element burnout.',
    ],
    relatedFaultIds: ['prop-wh-no-hot', 'prop-wh-pilot'],
  },
  {
    id: 'insinkerator-disposal',
    brand: 'InSinkErator / Waste King',
    category: 'appliances',
    models: ['Badger', 'Evolve', 'Essential'],
    codes: [],
    snippets: [
      'Hum + no spin: hex key jam clear + reset. Continuous trip = replace.',
      'Dishwasher drain tee: verify knockout removed on new installs.',
    ],
    relatedFaultIds: ['prop-disposal-hum', 'prop-dishwasher-no-drain'],
  },
  {
    id: 'ge-range-electric',
    brand: 'GE / Hotpoint',
    category: 'appliances',
    models: ['JB', 'JBS', 'RGB'],
    codes: [{ code: 'F2', meaning: 'Oven sensor / over-temp' }],
    snippets: [
      'No bake + broil OK often means bake element open.',
      'Infinite switch failures usually kill one surface burner only.',
    ],
    relatedFaultIds: ['prop-oven-no-heat', 'prop-range-burner-dead'],
  },
  {
    id: 'whirlpool-microwave',
    brand: 'Whirlpool / KitchenAid / Maytag',
    category: 'appliances',
    models: ['WMH', 'KMHS', 'MMV'],
    codes: [{ code: 'F2 E1', meaning: 'Keypad / membrane' }],
    snippets: [
      'No heat but turntable runs: often magnetron / diode / capacitor — HV hazard.',
      'Door switch stack failures cause no-start or intermittent cook.',
    ],
    relatedFaultIds: ['prop-microwave-dead'],
  },
  {
    id: 'honeywell-thermostat',
    brand: 'Honeywell / Resideo',
    category: 'hvac-basics',
    models: ['T6', 'T9', 'TH', 'RTH'],
    codes: [],
    snippets: [
      'Blank display: check C-wire / batteries before condemning board.',
      'Call for cool with no outdoor unit: confirm Y voltage and outdoor disconnect.',
    ],
    relatedFaultIds: ['prop-hvac-filter', 'prop-thermostat-blank'],
  },
  {
    id: 'carrier-filter-reminder',
    brand: 'Carrier / Bryant / Payne',
    category: 'hvac-basics',
    models: ['FV', 'FE', 'FB'],
    codes: [],
    snippets: [
      'Restricted filter icing: thaw, replace filter, verify return path before sealed-system.',
    ],
    relatedFaultIds: ['prop-hvac-filter', 'prop-thermostat-blank'],
  },
];

export function searchApplianceCorpus(query: string): Array<ApplianceDoc & { score: number }> {
  const q = query.trim().toLowerCase();
  if (!q) return APPLIANCE_CORPUS.map((d) => ({ ...d, score: 0 }));

  return APPLIANCE_CORPUS.map((doc) => {
    const blob = [
      doc.brand,
      doc.category,
      ...doc.models,
      ...doc.codes.map((c) => `${c.code} ${c.meaning}`),
      ...doc.snippets,
    ]
      .join(' ')
      .toLowerCase();
    let score = 0;
    if (blob.includes(q)) score += 8;
    for (const part of q.split(/\s+/)) {
      if (part.length > 1 && blob.includes(part)) score += 1;
    }
    for (const m of doc.models) {
      if (q.includes(m.toLowerCase())) score += 5;
    }
    for (const c of doc.codes) {
      if (q.includes(c.code.toLowerCase().replace(/\s+/g, ''))) score += 6;
    }
    return { ...doc, score };
  })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function formatCorpusHit(doc: ApplianceDoc): string {
  const codes = doc.codes.map((c) => `${c.code}: ${c.meaning}`).join(' · ') || '—';
  return [
    `**${doc.brand}** (${doc.models.slice(0, 4).join(', ')})`,
    doc.snippets[0] ?? '',
    `Codes: ${codes}`,
  ].join('\n');
}
