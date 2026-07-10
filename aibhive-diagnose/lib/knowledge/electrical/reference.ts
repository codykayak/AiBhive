export type WireRow = {
  awg: string;
  copper60: number;
  copper75: number;
  copper90: number;
  notes?: string;
};

/** Simplified copper ampacity reference (A) — verify against current NEC tables for the job. */
export const COPPER_AMPACITY: WireRow[] = [
  { awg: '14', copper60: 15, copper75: 15, copper90: 15, notes: 'Usually 15A overcurrent' },
  { awg: '12', copper60: 20, copper75: 20, copper90: 20, notes: 'Usually 20A overcurrent' },
  { awg: '10', copper60: 30, copper75: 30, copper90: 30 },
  { awg: '8', copper60: 40, copper75: 50, copper90: 55 },
  { awg: '6', copper60: 55, copper75: 65, copper90: 75 },
  { awg: '4', copper60: 70, copper75: 85, copper90: 95 },
  { awg: '3', copper60: 85, copper75: 100, copper90: 115 },
  { awg: '2', copper60: 95, copper75: 115, copper90: 130 },
  { awg: '1', copper60: 110, copper75: 130, copper90: 145 },
  { awg: '1/0', copper60: 125, copper75: 150, copper90: 170 },
  { awg: '2/0', copper60: 145, copper75: 175, copper90: 195 },
  { awg: '3/0', copper60: 165, copper75: 200, copper90: 225 },
  { awg: '4/0', copper60: 195, copper75: 230, copper90: 260 },
];

export type TorqueRow = {
  item: string;
  torque: string;
  note: string;
};

export const COMMON_TORQUE: TorqueRow[] = [
  { item: 'Breaker lug (typical 15–50A)', torque: 'See breaker body', note: 'Never guess — read the molded spec.' },
  { item: 'Panel neutral/ground bar', torque: 'Often 20–45 in-lb', note: 'Varies by manufacturer.' },
  { item: 'Device screw terminals', torque: 'Often 12–14 in-lb', note: 'CO/ALR may differ.' },
  { item: 'Service lug', torque: 'See panel label', note: 'Critical — under-torque = heat.' },
];

export type CodeQuick = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const CODE_QUICK_REFS: CodeQuick[] = [
  {
    id: 'gfci-locations',
    title: 'GFCI — common required locations',
    summary: 'Bathrooms, kitchens (counters), garages, outdoors, crawlspaces, laundry sinks, pools/spas equipment — verify current cycle.',
    bullets: [
      'Bathroom receptacles',
      'Kitchen countertop receptacles',
      'Outdoor receptacles',
      'Garage / unfinished basement (as applicable)',
      'Pool pump / outdoor equipment disconnects area',
    ],
  },
  {
    id: 'working-space',
    title: 'Panel working space',
    summary: 'Keep clear space in front of panels for safe service.',
    bullets: [
      'Depth typically 36"',
      'Width typically 30" or width of equipment',
      'Headroom typically 6.5"',
      'Dedicated equipment space above/below rules apply',
    ],
  },
  {
    id: 'pool-bonding',
    title: 'Pool bonding basics',
    summary: 'Equipotential bonding ties conductive parts together to reduce shock.',
    bullets: [
      '#8 solid copper common for bond grid',
      'Bond pump, heater, metal, water, rails per code',
      'Listed clamps only',
      'Tingles in water = stop use and investigate',
    ],
  },
  {
    id: 'disconnects',
    title: 'Equipment disconnects',
    summary: 'Motors and HVAC often need a local disconnect in sight.',
    bullets: [
      'In sight from equipment generally',
      'Lockable when required',
      'Proper amp rating and enclosure type (3R outdoors)',
    ],
  },
];

export function suggestWireForAmps(amps: number, tempRating: 60 | 75 | 90 = 75): WireRow | null {
  const key = tempRating === 60 ? 'copper60' : tempRating === 90 ? 'copper90' : 'copper75';
  return COPPER_AMPACITY.find((row) => row[key] >= amps) ?? null;
}
