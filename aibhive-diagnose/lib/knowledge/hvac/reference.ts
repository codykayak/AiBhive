export type SuperheatRow = {
  refrigerant: string;
  targetSuperheatF: string;
  conditions: string;
  notes: string;
};

/** Rule-of-thumb targets — always use manufacturer charging charts for the job. */
export const SUPERHEAT_TARGETS: SuperheatRow[] = [
  { refrigerant: 'R-410A', targetSuperheatF: '8–12°F', conditions: 'TXV, 95°F outdoor / 75°F indoor typical', notes: 'Use subcooling method on fixed orifice' },
  { refrigerant: 'R-22', targetSuperheatF: '10–15°F', conditions: 'Legacy systems — verify charge method', notes: 'No new R-22 installs' },
  { refrigerant: 'R-32', targetSuperheatF: 'Per OEM chart', conditions: 'A2L — follow label and safety data', notes: 'Flammability precautions' },
];

export type SubcoolRow = {
  refrigerant: string;
  targetSubcoolF: string;
  notes: string;
};

export const SUBCOOL_TARGETS: SubcoolRow[] = [
  { refrigerant: 'R-410A', targetSubcoolF: '10–15°F', notes: 'TXV systems — stable after 10 min run' },
  { refrigerant: 'R-410A piston', targetSubcoolF: 'Use superheat 8–12°F', notes: 'Piston metering uses superheat not subcool' },
];

export type DeltaTRow = {
  mode: string;
  healthySplitF: string;
  notes: string;
};

export const DELTA_T_TARGETS: DeltaTRow[] = [
  { mode: 'Cooling', healthySplitF: '16–22°F', notes: 'Return vs supply dry-bulb at air handler' },
  { mode: 'Heat pump heat', healthySplitF: '15–25°F', notes: 'Depends on outdoor temp and aux stages' },
  { mode: 'Gas furnace', healthySplitF: '35–65°F', notes: 'High limit and heat exchanger safety first' },
];

export type FilterRow = {
  size: string;
  merv: string;
  changeInterval: string;
  notes: string;
};

export const FILTER_GUIDE: FilterRow[] = [
  { size: '16x25x1', merv: '8–11', changeInterval: '1–3 months', notes: 'Most residential 1" pleated' },
  { size: '20x25x4', merv: '11–13', changeInterval: '6–12 months', notes: 'Media cabinet — check static' },
  { size: 'Washable', merv: 'Low', changeInterval: 'Monthly wash/dry', notes: 'Never reinstall wet' },
];

export type HvacCodeQuick = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const HVAC_CODE_REFS: HvacCodeQuick[] = [
  {
    id: 'disconnect',
    title: 'Outdoor disconnect / working space',
    summary: 'Service switches must be accessible and within sight of equipment.',
    bullets: [
      'Fusible or non-fused disconnect per local code',
      'Maintain manufacturer clearances around condenser',
      'Lockable when required for commercial',
    ],
  },
  {
    id: 'condensate',
    title: 'Condensate disposal',
    summary: 'Primary drain plus overflow protection required in most areas.',
    bullets: [
      'Trap depth per negative/positive pressure design',
      'Secondary pan switch or float on air handler',
      'Terminate to approved receptor — not roof gutter',
    ],
  },
  {
    id: 'combustion',
    title: 'Furnace combustion air',
    summary: 'Sealed combustion vs atmospheric venting rules differ.',
    bullets: [
      'Inspect heat exchanger for cracks before any heat season',
      'Flue pipe slope and support per manufacturer',
      'CO alarm recommended in sleeping areas',
    ],
  },
  {
    id: 'refrigerant',
    title: 'Refrigerant handling',
    summary: 'EPA Section 608 — recover before opening system.',
    bullets: [
      'No intentional venting',
      'Use scale for charge by weight when specified',
      'Leak check with electronic detector — soap on fittings',
    ],
  },
];

export function suggestFilterMerv(staticPressureInWc: number): string {
  if (staticPressureInWc > 0.9) return 'High static — try lower MERV or check duct sizing.';
  if (staticPressureInWc > 0.5) return 'Moderate static — MERV 8–11 typical for residential.';
  return 'Low static — room for higher MERV if air quality needs it.';
}
