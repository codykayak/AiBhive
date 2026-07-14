export type LossBudgetRow = {
  element: string;
  typicalLossDb: string;
  notes?: string;
};

/** Typical field loss allowances — verify against project spec. */
export const FIBER_LOSS_BUDGET: LossBudgetRow[] = [
  { element: 'Fusion splice (SM)', typicalLossDb: '0.05–0.10', notes: 'Rework if > 0.15 on backbone' },
  { element: 'Mechanical splice (SM)', typicalLossDb: '0.2–0.5', notes: 'Temporary restore only' },
  { element: 'Mated SC/APC pair', typicalLossDb: '0.1–0.3', notes: 'Clean + inspect before mate' },
  { element: 'Mated LC pair', typicalLossDb: '0.1–0.3', notes: 'Check polarity' },
  { element: '1×2 splitter', typicalLossDb: '~3.5', notes: 'Plus uniformity' },
  { element: '1×8 splitter', typicalLossDb: '~10.5', notes: 'Plan cascade carefully' },
  { element: '1×16 splitter', typicalLossDb: '~13.5', notes: '' },
  { element: '1×32 splitter', typicalLossDb: '~17', notes: 'Common FTTH' },
  { element: 'SM fiber @ 1310 nm', typicalLossDb: '0.35 dB/km', notes: 'G.652 typical' },
  { element: 'SM fiber @ 1550 nm', typicalLossDb: '0.22 dB/km', notes: 'G.652 typical' },
];

export type WavelengthRef = {
  use: string;
  nm: string;
  notes: string;
};

export const FIBER_WAVELENGTHS: WavelengthRef[] = [
  { use: 'GPON downstream', nm: '1490', notes: 'Measure RX at ONT with meter on 1490' },
  { use: 'GPON upstream', nm: '1310', notes: 'OLT receive band' },
  { use: 'OTDR SM (common)', nm: '1310 / 1550', notes: '1550 shows bends more' },
  { use: 'XGS-PON downstream', nm: '1577', notes: 'Do not use GPON optics' },
  { use: 'XGS-PON upstream', nm: '1270', notes: 'Verify SFP class' },
];

export const FIBER_CODE_REFS = [
  {
    id: 'laser-safety',
    title: 'Laser safety',
    summary: 'Never view live fiber directly; cap open ports.',
    bullets: [
      'PON downstream can exceed eye-safe levels at connector face',
      'Use filtered inspection scope or power meter',
      'Class 1M/3R — follow company LOTO on powered OLT ports',
    ],
  },
  {
    id: 'bend-radius',
    title: 'Minimum bend radius',
    summary: 'Macro-bends cause loss and OTDR events.',
    bullets: [
      'G.652 SM: ~30 mm minimum during install',
      'G.657 bend-insensitive: tighter but still use service loops',
      'No zip ties on buffer tube — use Velcro guides',
    ],
  },
];
