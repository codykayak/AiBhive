export type PipeRow = {
  nominal: string;
  odIn: string;
  idApproxIn: string;
  fixtureUnits: string;
  notes?: string;
};

/** Common copper/PEX nominal sizes — verify against local code tables. */
export const COPPER_PIPE_SIZES: PipeRow[] = [
  { nominal: '1/2"', odIn: '0.625', idApproxIn: '0.527', fixtureUnits: '1–3', notes: 'Branch to single fixture' },
  { nominal: '3/4"', odIn: '0.875', idApproxIn: '0.785', fixtureUnits: '4–8', notes: 'Common branch / WH supply' },
  { nominal: '1"', odIn: '1.125', idApproxIn: '1.025', fixtureUnits: '9–20', notes: 'Main trunk residential' },
  { nominal: '1-1/4"', odIn: '1.375', idApproxIn: '1.265', fixtureUnits: '21–35', notes: 'Larger homes / manifolds' },
  { nominal: '1-1/2"', odIn: '1.625', idApproxIn: '1.505', fixtureUnits: '36–55', notes: 'Main supply / WH manifold' },
  { nominal: '2"', odIn: '2.125', idApproxIn: '1.985', fixtureUnits: '56+', notes: 'Main line / commercial branch' },
];

export type DrainRow = {
  size: string;
  use: string;
  slope: string;
  notes: string;
};

export const DRAIN_SIZING: DrainRow[] = [
  { size: '1-1/2"', use: 'Lavatory / bar sink', slope: '1/4" per ft min', notes: 'Short runs only' },
  { size: '2"', use: 'Shower / tub / laundry', slope: '1/4" per ft', notes: 'Most branch drains' },
  { size: '3"', use: 'Toilet branch / small building drain', slope: '1/8"–1/4" per ft', notes: 'Verify local minimum' },
  { size: '4"', use: 'Building drain / main', slope: '1/8"–1/4" per ft', notes: 'Cleanouts per code spacing' },
];

export type VentQuick = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const PLUMBING_CODE_REFS: VentQuick[] = [
  {
    id: 'trap-seal',
    title: 'Trap seal depth',
    summary: 'P-traps need water seal to block sewer gas — typically 2"–4" depending on fixture.',
    bullets: [
      'Never use S-traps (siphon risk)',
      'Trap arm length limits apply per fixture',
      'Double trapping causes poor drainage',
      'Prime floor drains that dry out in summer',
    ],
  },
  {
    id: 'venting-basics',
    title: 'DWV venting basics',
    summary: 'Vents protect trap seals and allow drainage air behind the water slug.',
    bullets: [
      'Each trap needs vent protection within developed length limits',
      'Wet venting rules vary — check IPC/UPC local adoption',
      'Studor vents are allowed only where code permits',
      'Blocked vents can gurgle and pull trap seals',
    ],
  },
  {
    id: 'water-heater-tp',
    title: 'T&P discharge rules',
    summary: 'Temperature & pressure relief must discharge safely to an approved location.',
    bullets: [
      'Discharge pipe full size — no reductions at valve outlet',
      'Terminate 6"–24" above floor / approved receptor',
      'No threads or caps on open end',
      'Dripping T&P = investigate pressure, expansion, or failed element',
    ],
  },
  {
    id: 'backflow',
    title: 'Backflow / cross-connection',
    summary: 'Potable water must be protected from contamination sources.',
    bullets: [
      'RPZ / DCVA / PVB per hazard level',
      'Annual test required on many assemblies',
      'Hose bib vacuum breakers on sillcocks',
      'Irrigation tie-ins need proper device',
    ],
  },
  {
    id: 'gas-piping',
    title: 'Gas piping reminders',
    summary: 'Gas work requires permit/licensing in most jurisdictions.',
    bullets: [
      'Soap-test all joints — never use open flame to find leaks',
      'CSST bonding per manufacturer and NEC',
      'Shut off gas at meter/appliance before disassembly',
      'CO detectors where fuel appliances operate',
    ],
  },
];

export type PressureRow = {
  label: string;
  psi: string;
  note: string;
};

export const PRESSURE_TARGETS: PressureRow[] = [
  { label: 'Typical residential static', psi: '40–80', note: 'Many codes cap at 80 psi — PRV if higher' },
  { label: 'PRV outlet target', psi: '50–60', note: 'Adjust after thermal expansion check' },
  { label: 'Expansion tank precharge', psi: 'Match static supply', note: 'Check with no system pressure' },
  { label: 'Water heater relief', psi: '150 psi / 210°F', note: 'Factory T&P rating — do not alter' },
];
