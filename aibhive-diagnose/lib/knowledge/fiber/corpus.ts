/**
 * Fiber optics local RAG corpus — vendor alarms, OTDR notes, PON thresholds, connector specs.
 */

export type FiberDoc = {
  id: string;
  vendor?: string;
  category: string;
  topics: string[];
  snippets: string[];
  relatedFaultIds: string[];
};

export const FIBER_CORPUS: FiberDoc[] = [
  {
    id: 'gpon-rx-levels',
    vendor: 'ITU-T G.984',
    category: 'distribution',
    topics: ['gpon', 'rx power', 'ont sensitivity', 'optical budget', '1490', '1310'],
    snippets: [
      'Typical GPON ONT RX at 1490 nm: -8 to -27 dBm (verify vendor sheet).',
      'Below -27 dBm often shows LOS; above -8 dBm may saturate some ONTs.',
      'Always measure at customer NID with meter set to downstream wavelength.',
    ],
    relatedFaultIds: ['fiber-ont-los-alarm', 'fiber-power-meter-high-loss'],
  },
  {
    id: 'xgs-pon-notes',
    vendor: 'XGS-PON',
    category: 'distribution',
    topics: ['xgs-pon', '10g pon', 'symmetric', '1577', '1270'],
    snippets: [
      'XGS-PON uses different optics than GPON — do not mix ONT or SFP types on same port.',
      'Downstream often 1577 nm; upstream 1270 nm — confirm meter wavelength.',
    ],
    relatedFaultIds: ['fiber-gpon-xgs-mismatch', 'fiber-ont-not-registering'],
  },
  {
    id: 'otdr-bidirectional',
    category: 'testing',
    topics: ['otdr', 'bidirectional', 'averaging', 'ghost', 'event loss'],
    snippets: [
      'Bidirectional OTDR: shoot both directions and average splice loss for true dB.',
      'Ghost events often appear at multiples of near-end reflection — use shorter pulse.',
      'Set IOR from cable datasheet — default 1.465 can shift locate distance hundreds of feet.',
    ],
    relatedFaultIds: ['fiber-otdr-ghost-event', 'fiber-otdr-wrong-ior'],
  },
  {
    id: 'apc-cleaning',
    category: 'premises',
    topics: ['sc apc', 'green connector', 'cleaning', 'inspection', 'ferrule'],
    snippets: [
      'SC/APC: dry stick cleaner only; never mate UPC into APC.',
      'Inspect 200× before mate — one dirt particle can add > 1 dB.',
      'APC connectors should click once; do not spin while mated.',
    ],
    relatedFaultIds: ['fiber-dirty-sc-apc', 'fiber-connector-endface-scratch'],
  },
  {
    id: 'fusion-splice-targets',
    category: 'splicing',
    topics: ['fusion', 'splice loss', 'single mode', '0.05', '0.1 db'],
    snippets: [
      'Single-mode fusion target: ≤ 0.1 dB typical field spec; rework if > 0.15 dB on backbone.',
      'Re-cleave both ends before third fusion attempt — do not fuse over bad cleaves.',
      'Run electrode maintenance per cut count — worn electrodes cause bubbles.',
    ],
    relatedFaultIds: ['fiber-fusion-high-loss', 'fiber-fusion-bubble'],
  },
  {
    id: 'splitter-loss-budget',
    category: 'distribution',
    topics: ['splitter', '1x32', '1x16', 'insertion loss', 'budget'],
    snippets: [
      'Approx splitter loss: 1×8 ~10.5 dB, 1×16 ~13.5 dB, 1×32 ~17 dB (plus uniformity).',
      'Cascade splitters multiply loss — engineering must approve cascaded designs.',
    ],
    relatedFaultIds: ['fiber-splitter-failure', 'fiber-pon-olt-high-ont-count'],
  },
  {
    id: 'vfl-locate',
    category: 'testing',
    topics: ['vfl', 'red light', 'locate break', 'visual fault'],
    snippets: [
      'VFL bright leak = macro-bend or break; dim glow through jacket may be tight bend only.',
      'Shoot from both ends on long drops to find mid-span cut faster than OTDR setup.',
    ],
    relatedFaultIds: ['fiber-vfl-no-light-customer', 'fiber-otdr-no-backscatter'],
  },
  {
    id: 'mpo-polarity-tia',
    category: 'premises',
    topics: ['mpo', 'polarity', 'type a', 'type b', 'cassette'],
    snippets: [
      'TIA-568 polarity methods A/B/C — trunk and cassette must match site standard.',
      'Half the strands dead on MPO often polarity, not bad optics.',
    ],
    relatedFaultIds: ['fiber-mpo-polarity', 'fiber-lc-duplex-polarity'],
  },
  {
    id: 'bend-radius-g657',
    category: 'premises',
    topics: ['g657', 'bend insensitive', 'bend radius', 'macro bend'],
    snippets: [
      'G.657.A1 allows tighter bends than G.652 but still needs proper service loop at ONT.',
      'Macro-bend loss shows on OTDR as gradual slope event — not always a discrete spike.',
    ],
    relatedFaultIds: ['fiber-macro-bend-rack', 'fiber-bend-insensitive-g657'],
  },
  {
    id: 'ont-alarm-los-auth',
    vendor: 'Generic ONT',
    category: 'distribution',
    topics: ['los', 'auth fail', 'register', 'omci', 'serial'],
    snippets: [
      'LOS = no usable optical power — fix optics before EMS provisioning tickets.',
      'Auth fail with good RX: serial number, line profile, or PON technology mismatch.',
    ],
    relatedFaultIds: ['fiber-ont-los-alarm', 'fiber-ont-not-registering'],
  },
  {
    id: 'drop-aerial-restore',
    category: 'troubleshooting',
    topics: ['aerial', 'drop', 'emergency restore', 'mechanical splice'],
    snippets: [
      'Emergency: mechanical splice + service loop, then schedule fusion when weather allows.',
      'Photo damage and GPS for carrier damage claims on aerial cuts.',
    ],
    relatedFaultIds: ['fiber-drop-cut-aerial', 'fiber-mechanical-splice-loss'],
  },
  {
    id: 'laser-safety',
    category: 'troubleshooting',
    topics: ['laser safety', 'class 1m', 'eye safety', 'live fiber'],
    snippets: [
      'Never look into fiber or port — PON downstream can exceed comfortable levels.',
      'Use power meter or camera scope; cap unused ports immediately.',
    ],
    relatedFaultIds: [],
  },
  {
    id: 'olts-certification',
    category: 'testing',
    topics: ['olts', 'tier 1', 'certification', 'insertion loss', 'length'],
    snippets: [
      'Clean reference cords before every OLTS session — #1 cause of false fail.',
      'Match test standard to cable rating (OM4 vs OM3, OS2).',
    ],
    relatedFaultIds: ['fiber-olts-fail-report'],
  },
  {
    id: 'fdh-water-ingress',
    category: 'troubleshooting',
    topics: ['fdh', 'handhole', 'water', 'closure', 'flooding'],
    snippets: [
      'After water event, re-splice all mechanical splices in closure — corrosion is silent.',
      'Replace gaskets and entry seals; pump vault before entry per confined-space policy.',
    ],
    relatedFaultIds: ['fiber-handhole-water', 'fiber-splitter-failure'],
  },
  {
    id: 'sm-mm-identification',
    category: 'troubleshooting',
    topics: ['single mode', 'multimode', 'os2', 'om3', 'om4', 'yellow', 'orange'],
    snippets: [
      'Yellow jacket often OS2 SM; orange/aqua OM multimode — verify print legend on cable.',
      'SM optics on MM fiber causes high loss and wrong distance on OTDR.',
    ],
    relatedFaultIds: ['fiber-sm-mm-mismatch'],
  },
];

export function searchFiberCorpus(query: string): FiberDoc[] {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  return FIBER_CORPUS.map((doc) => {
    const blob = [
      doc.vendor || '',
      doc.category,
      ...doc.topics,
      ...doc.snippets,
    ]
      .join(' ')
      .toLowerCase();
    let score = 0;
    if (blob.includes(q)) score += 8;
    for (const t of tokens) {
      if (blob.includes(t)) score += 2;
    }
    return { doc, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.doc);
}

export function formatFiberCorpusHit(doc: FiberDoc): string {
  return `**${doc.vendor || doc.category}** — ${doc.snippets[0] || doc.topics.join(', ')}`;
}
