import { GC_GROUND_UP, GC_TI, GC_VALUE_ADD, stackMultiplier } from './assumptions';
import type { Deal, GcStack, SubQuote, TradeLine } from './types';

interface Seed {
  id: string;
  csi: string;
  trade: string;
  scope: string;
  unit: string;
  basis: 'sf' | 'unit' | 'fixed';
  qty: number;
  cost: number;
  labor: number;
  material: number;
  equipment: number;
  waste: number;
  subs: [string, string, string];
}

function quotes(names: [string, string, string]): SubQuote[] {
  const factors = [0.94, 1, 1.08];
  const days = [70, 110, 145];
  const notes = [
    'Excludes night work and owner-furnished equipment',
    'Full scope, tax included, normal hours',
    'Includes bond, overtime, and a schedule premium',
  ];
  return names.map((company, index) => ({
    company,
    factor: factors[index],
    amount: null,
    linked: true,
    exclusions: notes[index],
    days: days[index],
    selected: false,
  }));
}

function lineTotal(qty: number, cost: number, seed: Seed): number {
  const share = seed.labor + seed.material + seed.equipment || 1;
  const material = qty * cost * (seed.material / share);
  return qty * cost + material * seed.waste;
}

export function materialize(seeds: Seed[], sf: number, units: number, directTarget: number, gc: GcStack): TradeLine[] {
  const multiplier = stackMultiplier(gc);
  const targetDirect = directTarget / multiplier;
  const drafted = seeds.map((seed) => {
    const qty = seed.basis === 'sf' ? sf * seed.qty : seed.basis === 'unit' ? Math.max(units, 1) * seed.qty : seed.qty;
    return { seed, qty };
  });
  const raw = drafted.reduce((sum, item) => sum + lineTotal(item.qty, item.seed.cost, item.seed), 0) || 1;
  const scale = targetDirect > 0 ? targetDirect / raw : 1;
  return drafted.map(({ seed, qty }) => ({
    id: seed.id,
    csi: seed.csi,
    trade: seed.trade,
    scope: seed.scope,
    unit: seed.unit,
    qty,
    unitCost: seed.cost * scale,
    laborShare: seed.labor,
    materialShare: seed.material,
    equipmentShare: seed.equipment,
    waste: seed.waste,
    included: true,
    bids: quotes(seed.subs),
  }));
}

const logisticsCapex: Seed[] = [
  { id: 'demo', csi: '02 41 00', trade: 'Demolition', scope: 'Selective demo at docks, offices, and failed slab', unit: 'SF', basis: 'sf', qty: 0.18, cost: 4.2, labor: 0.62, material: 0.18, equipment: 0.2, waste: 0.02, subs: ['Fieldline Demo', 'Plainshore Abatement', 'Northspan Strip-out'] },
  { id: 'roof', csi: '07 50 00', trade: 'Roofing', scope: '60-mil TPO recover, drains, and 20-year warranty', unit: 'SF', basis: 'sf', qty: 1, cost: 7.4, labor: 0.38, material: 0.55, equipment: 0.07, waste: 0.08, subs: ['Red River Roofing', 'Highline Membrane', 'Atlas Envelope'] },
  { id: 'dock', csi: '11 13 00', trade: 'Dock equipment', scope: 'Levelers, seals, lights, and restraint systems', unit: 'EA', basis: 'fixed', qty: 86, cost: 18500, labor: 0.42, material: 0.5, equipment: 0.08, waste: 0.02, subs: ['Metro Dock & Door', 'Harbor Gate', 'Pinnacle Loading'] },
  { id: 'slab', csi: '03 30 00', trade: 'Concrete', scope: 'Dock approaches, trench drains, and slab repair', unit: 'SF', basis: 'sf', qty: 0.12, cost: 9.5, labor: 0.4, material: 0.48, equipment: 0.12, waste: 0.05, subs: ['Trinity Flatwork', 'Basin Concrete', 'Keystone Pours'] },
  { id: 'hvac', csi: '23 00 00', trade: 'HVAC', scope: 'RTU replacement, destratification, and controls', unit: 'SF', basis: 'sf', qty: 1, cost: 3.8, labor: 0.46, material: 0.48, equipment: 0.06, waste: 0.03, subs: ['Vesper Mechanical', 'Coolspan', 'Lumen Air'] },
  { id: 'elec', csi: '26 00 00', trade: 'Electrical', scope: 'LED high bay, ESFR power, and EV-ready gear', unit: 'SF', basis: 'sf', qty: 1, cost: 4.1, labor: 0.55, material: 0.4, equipment: 0.05, waste: 0.04, subs: ['Grid & Co.', 'North Current', 'Relay Electric'] },
  { id: 'fire', csi: '21 00 00', trade: 'Fire protection', scope: 'ESFR head and branch-line upgrades', unit: 'SF', basis: 'sf', qty: 1, cost: 1.6, labor: 0.48, material: 0.47, equipment: 0.05, waste: 0.04, subs: ['Sentinel Fire', 'Wetline', 'Ashland Sprinkler'] },
  { id: 'pave', csi: '32 12 00', trade: 'Paving', scope: 'Truck-court mill and overlay, striping, bollards', unit: 'SF', basis: 'sf', qty: 0.55, cost: 3.4, labor: 0.35, material: 0.4, equipment: 0.25, waste: 0.04, subs: ['Court & Asphalt', 'Mile Marker Paving', 'Range Sitework'] },
  { id: 'office', csi: '09 00 00', trade: 'Office TI', scope: 'Spec office refresh, restrooms, and break rooms', unit: 'SF', basis: 'sf', qty: 0.06, cost: 78, labor: 0.52, material: 0.43, equipment: 0.05, waste: 0.07, subs: ['Atelier Interiors', 'Benchmill', 'Harbor Finish'] },
];

const podium: Seed[] = [
  { id: 'site', csi: '31 00 00', trade: 'Sitework', scope: 'Mass excavation, shoring allowance, and utilities', unit: 'SF', basis: 'sf', qty: 1, cost: 28, labor: 0.42, material: 0.28, equipment: 0.3, waste: 0.04, subs: ['Deep Cut Civil', 'Foundation West', 'Urban Grade'] },
  { id: 'structure', csi: '03 30 00', trade: 'Structure', scope: 'Podium concrete, post-tension decks, and core', unit: 'SF', basis: 'sf', qty: 1, cost: 92, labor: 0.4, material: 0.5, equipment: 0.1, waste: 0.05, subs: ['Pier & Deck', 'Cadence Concrete', 'Highform'] },
  { id: 'envelope', csi: '07 00 00', trade: 'Envelope', scope: 'Unitized curtain wall, roofing, and waterproofing', unit: 'SF', basis: 'sf', qty: 1, cost: 64, labor: 0.36, material: 0.58, equipment: 0.06, waste: 0.06, subs: ['Glassline', 'Meridian Facade', 'Northlight'] },
  { id: 'interiors', csi: '09 00 00', trade: 'Interiors', scope: 'Units, corridors, lobby, and amenity build-out', unit: 'SF', basis: 'sf', qty: 1, cost: 70, labor: 0.55, material: 0.4, equipment: 0.05, waste: 0.08, subs: ['Suitecraft', 'Common Room Co.', 'Finish Theory'] },
  { id: 'hvac', csi: '23 00 00', trade: 'HVAC', scope: 'Central plant, DOAS, and in-unit distribution', unit: 'SF', basis: 'sf', qty: 1, cost: 38, labor: 0.45, material: 0.5, equipment: 0.05, waste: 0.03, subs: ['Vesper Mechanical', 'Stack Air', 'Thermal Union'] },
  { id: 'plumb', csi: '22 00 00', trade: 'Plumbing', scope: 'Risers, fixtures, and grease waste for retail', unit: 'SF', basis: 'sf', qty: 1, cost: 22, labor: 0.5, material: 0.45, equipment: 0.05, waste: 0.05, subs: ['Rise Plumbing', 'Main Stack', 'Copper & Co.'] },
  { id: 'elec', csi: '26 00 00', trade: 'Electrical', scope: 'Service, units, house power, and low voltage', unit: 'SF', basis: 'sf', qty: 1, cost: 32, labor: 0.56, material: 0.39, equipment: 0.05, waste: 0.04, subs: ['Grid & Co.', 'Relay Electric', 'City Current'] },
  { id: 'fire', csi: '21 00 00', trade: 'Fire protection', scope: 'Wet system, pump, and high-rise standpipes', unit: 'SF', basis: 'sf', qty: 1, cost: 9, labor: 0.48, material: 0.47, equipment: 0.05, waste: 0.04, subs: ['Sentinel Fire', 'Standpipe Co.', 'Wetline'] },
  { id: 'vert', csi: '14 20 00', trade: 'Elevators', scope: 'Passenger and service cabs', unit: 'LS', basis: 'fixed', qty: 1, cost: 2400000, labor: 0.35, material: 0.6, equipment: 0.05, waste: 0.01, subs: ['Liftwright', 'Cab & Rail', 'Vertical Union'] },
];

const unitTurns: Seed[] = [
  { id: 'turns', csi: '09 00 00', trade: 'Unit turns', scope: 'Floors, paint, fixtures, appliances, and doors', unit: 'UNIT', basis: 'unit', qty: 0.62, cost: 9800, labor: 0.58, material: 0.38, equipment: 0.04, waste: 0.06, subs: ['Turnkey Living', 'Unit Lab', 'Resident Finish'] },
  { id: 'amenity', csi: '09 00 00', trade: 'Amenities', scope: 'Club, pool deck, and leasing gallery', unit: 'LS', basis: 'fixed', qty: 1, cost: 1850000, labor: 0.52, material: 0.42, equipment: 0.06, waste: 0.05, subs: ['Common Room Co.', 'Poolform', 'Gallery Build'] },
  { id: 'envelope', csi: '07 00 00', trade: 'Envelope', scope: 'Siding, balcony coatings, and roof repairs', unit: 'SF', basis: 'sf', qty: 0.35, cost: 8.5, labor: 0.45, material: 0.48, equipment: 0.07, waste: 0.06, subs: ['Atlas Envelope', 'Balcony Coat', 'Highline Membrane'] },
  { id: 'mep', csi: '23 00 00', trade: 'MEP', scope: 'Water heaters, HVAC sleeves, and house electrical', unit: 'UNIT', basis: 'unit', qty: 1, cost: 2100, labor: 0.5, material: 0.45, equipment: 0.05, waste: 0.03, subs: ['Vesper Mechanical', 'Rise Plumbing', 'Grid & Co.'] },
  { id: 'site', csi: '32 00 00', trade: 'Site', scope: 'Asphalt, lighting, fencing, and drainage', unit: 'LS', basis: 'fixed', qty: 1, cost: 960000, labor: 0.4, material: 0.35, equipment: 0.25, waste: 0.04, subs: ['Court & Asphalt', 'Range Sitework', 'Mile Marker Paving'] },
  { id: 'life', csi: '21 00 00', trade: 'Life safety', scope: 'Alarms, devices, and attic drafts', unit: 'UNIT', basis: 'unit', qty: 1, cost: 640, labor: 0.55, material: 0.4, equipment: 0.05, waste: 0.03, subs: ['Sentinel Fire', 'Signal House', 'Wetline'] },
];

const clinical: Seed[] = [
  { id: 'demo', csi: '02 41 00', trade: 'Demolition', scope: 'Suite demo, abatement allowance, and make-safe', unit: 'SF', basis: 'sf', qty: 1, cost: 8, labor: 0.7, material: 0.15, equipment: 0.15, waste: 0.02, subs: ['Plainshore Abatement', 'Fieldline Demo', 'Clinical Strip'] },
  { id: 'partitions', csi: '09 20 00', trade: 'Partitions', scope: 'Lead-lined rooms, exam walls, and ceilings', unit: 'SF', basis: 'sf', qty: 1, cost: 28, labor: 0.55, material: 0.4, equipment: 0.05, waste: 0.07, subs: ['Suitecraft', 'Leadline Interiors', 'Finish Theory'] },
  { id: 'mech', csi: '23 00 00', trade: 'HVAC', scope: 'Clinical air changes, exhaust, and controls', unit: 'SF', basis: 'sf', qty: 1, cost: 42, labor: 0.44, material: 0.5, equipment: 0.06, waste: 0.03, subs: ['Vesper Mechanical', 'Sterile Air', 'Lumen Air'] },
  { id: 'plumb', csi: '22 00 00', trade: 'Plumbing', scope: 'Med gas rough, fixtures, and process waste', unit: 'SF', basis: 'sf', qty: 1, cost: 18, labor: 0.5, material: 0.45, equipment: 0.05, waste: 0.04, subs: ['Rise Plumbing', 'MedGas Co.', 'Copper & Co.'] },
  { id: 'elec', csi: '26 00 00', trade: 'Electrical', scope: 'Critical power, lighting, and nurse call', unit: 'SF', basis: 'sf', qty: 1, cost: 36, labor: 0.55, material: 0.4, equipment: 0.05, waste: 0.04, subs: ['Grid & Co.', 'Critical Electric', 'Relay Electric'] },
  { id: 'fire', csi: '21 00 00', trade: 'Fire protection', scope: 'Head relocations and fire alarm', unit: 'SF', basis: 'sf', qty: 1, cost: 6, labor: 0.5, material: 0.45, equipment: 0.05, waste: 0.03, subs: ['Sentinel Fire', 'Wetline', 'Signal House'] },
  { id: 'case', csi: '12 30 00', trade: 'Casework', scope: 'Nurse stations, exam casework, and solids', unit: 'SF', basis: 'sf', qty: 1, cost: 22, labor: 0.35, material: 0.6, equipment: 0.05, waste: 0.05, subs: ['Casework Atelier', 'Clinic Mill', 'Benchmill'] },
  { id: 'equip', csi: '11 70 00', trade: 'Equipment rough-in', scope: 'Imaging pads, supports, and owner-equip coordination', unit: 'LS', basis: 'fixed', qty: 1, cost: 1450000, labor: 0.4, material: 0.45, equipment: 0.15, waste: 0.02, subs: ['Imaging Beds', 'Modality Set', 'Clinical Rough'] },
];

function base(partial: Deal): Deal {
  return partial;
}

export function harborline(): Deal {
  const sf = 5_600_000;
  const gc = GC_VALUE_ADD;
  const hard = 6.4 * sf;
  return base({
    id: 'harborline',
    jobCode: 'BH-2026-041',
    name: 'Harborline Logistics',
    address: 'Six-building Sun Belt portfolio',
    marketId: 'sun-belt',
    assetId: 'logistics',
    strategy: 'value-add',
    quality: 'standard',
    phase: 'Best & Final',
    image: '/bidding/bidding-logistics.jpg',
    sponsor: 'AiBhive Capital',
    team: ['Acquisitions', 'Asset management', 'Construction', 'Capital markets'],
    grossSf: 5_850_000,
    rentableSf: sf,
    units: 6,
    yearBuilt: 2008,
    bidDue: 'Friday, 8:00',
    askingPrice: 124 * sf,
    purchasePrice: 94 * sf,
    prevailingWage: false,
    wageMultiplier: 1.32,
    materialSalesTax: 0.0725,
    vacancy: 0.045,
    inPlaceVacancy: 0.07,
    creditLoss: 0.004,
    rentBasis: 'sf',
    inPlaceRent: 8.05,
    inPlaceOther: 0.12 * sf,
    income: [
      { id: 'rent', label: 'NNN base rent', basis: 'sf', amount: 9.35 },
      { id: 'park', label: 'Trailer parking & other', basis: 'sf', amount: 0.18 },
    ],
    expenses: [
      { id: 'tax', label: 'Property tax', basis: 'price', amount: 0.0105 },
      { id: 'ins', label: 'Insurance', basis: 'sf', amount: 0.32 },
      { id: 'rm', label: 'Repairs & maintenance', basis: 'sf', amount: 0.22 },
      { id: 'ga', label: 'Portfolio G&A', basis: 'sf', amount: 0.07 },
      { id: 'mgmt', label: 'Management', basis: 'egi', amount: 0.02 },
    ],
    reservesPerSf: 0.12,
    reservesPerUnit: 0,
    trades: materialize(logisticsCapex, sf, 6, hard, gc),
    gc,
    architecturePct: 0.035,
    permitsPct: 0.008,
    developerFeePct: 0,
    ffe: 450_000,
    legalFees: 850_000,
    impactFees: 0,
    otherSoft: 600_000,
    closingPct: 0.012,
    closingFixed: 250_000,
    seniorLtc: 0.58,
    mezzLtc: 0,
    interestRate: 0.0615,
    mezzRate: 0.11,
    amortYears: 30,
    ioYears: 2,
    points: 0.0075,
    mezzPoints: 0.01,
    reserveMonths: 4,
    holdYears: 7,
    exitCap: 0.06,
    rentGrowth: 0.03,
    sellingCostPct: 0.012,
    targetCashOnCash: 0.075,
    targetCapRate: 0.0675,
    targetDscr: 1.3,
    minDebtYield: 0.1,
    yocSpread: 0.015,
    earnestPct: 0.02,
    dueDiligenceDays: 45,
    closingDays: 30,
    financingContingency: true,
    inspectionContingency: true,
    scopeName: 'Portfolio capex, not a ground-up shell',
    scopeLow: 4.5,
    scopeHigh: 9,
    groundLow: 55,
    groundHigh: 130,
    notes:
      'Best-and-final on a six-building bulk portfolio. In-place rent is below mark-to-market. Capex is roofs, ESFR, docks, truck courts, and a light office refresh. Illustrative subcontractors are placeholders until live quotes replace them.',
  });
}

export function mercer(): Deal {
  const sf = 468_000;
  const units = 420;
  const gc = GC_GROUND_UP;
  const hard = 205 * sf;
  return base({
    id: 'mercer',
    jobCode: 'BH-2026-055',
    name: 'Mercer Yards',
    address: 'Podium mixed-use, Austin',
    marketId: 'austin',
    assetId: 'mixed-use',
    strategy: 'ground-up',
    quality: 'standard',
    phase: 'GMP',
    image: '/bidding/bidding-mixed-use.jpg',
    sponsor: 'AiBhive Capital',
    team: ['Development', 'Design', 'Construction', 'Leasing'],
    grossSf: 505_000,
    rentableSf: sf,
    units,
    yearBuilt: 2028,
    bidDue: 'GMP review',
    askingPrice: 24_000_000,
    purchasePrice: 16_500_000,
    prevailingWage: false,
    wageMultiplier: 1.32,
    materialSalesTax: 0.0825,
    vacancy: 0.065,
    inPlaceVacancy: 1,
    creditLoss: 0.005,
    rentBasis: 'unit',
    inPlaceRent: 0,
    inPlaceOther: 0,
    income: [
      { id: 'apt', label: 'Apartment rent', basis: 'unit', amount: 3_040 * 12 },
      { id: 'retail', label: 'Retail rent', basis: 'fixed', amount: 1_450_000 },
      { id: 'other', label: 'Parking, pet, and amenity', basis: 'unit', amount: 95 * 12 },
    ],
    expenses: [
      { id: 'tax', label: 'Property tax', basis: 'cost', amount: 0.011 },
      { id: 'ins', label: 'Insurance', basis: 'unit', amount: 780 },
      { id: 'payroll', label: 'Payroll', basis: 'unit', amount: 620 },
      { id: 'util', label: 'Utilities', basis: 'unit', amount: 540 },
      { id: 'rm', label: 'Repairs', basis: 'unit', amount: 380 },
      { id: 'mgmt', label: 'Management', basis: 'egi', amount: 0.03 },
      { id: 'admin', label: 'Admin & marketing', basis: 'fixed', amount: 420_000 },
    ],
    reservesPerSf: 0,
    reservesPerUnit: 300,
    trades: materialize(podium, sf, units, hard, gc),
    gc,
    architecturePct: 0.055,
    permitsPct: 0.018,
    developerFeePct: 0.03,
    ffe: 4_200_000,
    legalFees: 650_000,
    impactFees: 6_400_000,
    otherSoft: 1_100_000,
    closingPct: 0.015,
    closingFixed: 80_000,
    seniorLtc: 0.55,
    mezzLtc: 0,
    interestRate: 0.064,
    mezzRate: 0.115,
    amortYears: 30,
    ioYears: 3,
    points: 0.01,
    mezzPoints: 0.015,
    reserveMonths: 18,
    holdYears: 10,
    exitCap: 0.0525,
    rentGrowth: 0.03,
    sellingCostPct: 0.015,
    targetCashOnCash: 0.07,
    targetCapRate: 0.055,
    targetDscr: 1.25,
    minDebtYield: 0.09,
    yocSpread: 0.0125,
    earnestPct: 0.03,
    dueDiligenceDays: 60,
    closingDays: 45,
    financingContingency: true,
    inspectionContingency: true,
    scopeName: 'Value-engineered podium GMP',
    scopeLow: 185,
    scopeHigh: 340,
    groundLow: 250,
    groundHigh: 520,
    notes:
      'GMP job on a value-engineered podium. Land is the bid variable. Yield on cost has to clear the exit cap by 125 basis points. Subcontractor names are illustrative.',
  });
}

export function cedar(): Deal {
  const units = 1_450;
  const sf = units * 940;
  const gc = GC_VALUE_ADD;
  const hard = 11_500 * units;
  return base({
    id: 'cedar',
    jobCode: 'BH-2026-033',
    name: 'Cedar Court',
    address: '1,450-unit garden community, Phoenix',
    marketId: 'phoenix',
    assetId: 'multifamily',
    strategy: 'value-add',
    quality: 'standard',
    phase: 'IOI',
    image: '/bidding/bidding-multifamily.jpg',
    sponsor: 'AiBhive Capital',
    team: ['Acquisitions', 'Operations', 'Construction'],
    grossSf: sf * 1.08,
    rentableSf: sf,
    units,
    yearBuilt: 1998,
    bidDue: 'IOI window',
    askingPrice: 198_000 * units,
    purchasePrice: 176_000 * units,
    prevailingWage: false,
    wageMultiplier: 1.28,
    materialSalesTax: 0.056,
    vacancy: 0.06,
    inPlaceVacancy: 0.085,
    creditLoss: 0.008,
    rentBasis: 'unit',
    inPlaceRent: 1_390 * 12,
    inPlaceOther: 38 * 12 * units,
    income: [
      { id: 'rent', label: 'Apartment rent', basis: 'unit', amount: 1_585 * 12 },
      { id: 'other', label: 'Parking, pet, laundry', basis: 'unit', amount: 48 * 12 },
    ],
    expenses: [
      { id: 'tax', label: 'Property tax', basis: 'price', amount: 0.0082 },
      { id: 'ins', label: 'Insurance', basis: 'unit', amount: 540 },
      { id: 'payroll', label: 'Payroll', basis: 'unit', amount: 310 },
      { id: 'util', label: 'Utilities', basis: 'unit', amount: 240 },
      { id: 'rm', label: 'Repairs', basis: 'unit', amount: 420 },
      { id: 'mgmt', label: 'Management', basis: 'egi', amount: 0.032 },
      { id: 'admin', label: 'Admin', basis: 'fixed', amount: 380_000 },
    ],
    reservesPerSf: 0,
    reservesPerUnit: 300,
    trades: materialize(unitTurns, sf, units, hard, gc),
    gc,
    architecturePct: 0.02,
    permitsPct: 0.006,
    developerFeePct: 0,
    ffe: 900_000,
    legalFees: 420_000,
    impactFees: 0,
    otherSoft: 250_000,
    closingPct: 0.015,
    closingFixed: 120_000,
    seniorLtc: 0.64,
    mezzLtc: 0,
    interestRate: 0.0635,
    mezzRate: 0.11,
    amortYears: 30,
    ioYears: 2,
    points: 0.0075,
    mezzPoints: 0,
    reserveMonths: 3,
    holdYears: 7,
    exitCap: 0.055,
    rentGrowth: 0.03,
    sellingCostPct: 0.015,
    targetCashOnCash: 0.08,
    targetCapRate: 0.06,
    targetDscr: 1.25,
    minDebtYield: 0.09,
    yocSpread: 0.015,
    earnestPct: 0.01,
    dueDiligenceDays: 30,
    closingDays: 30,
    financingContingency: true,
    inspectionContingency: true,
    scopeName: 'Unit turns and community capex',
    scopeLow: 8,
    scopeHigh: 18,
    groundLow: 190,
    groundHigh: 450,
    notes:
      'IOI on a 1998 garden asset. The bid assumes 62% of units turn during the hold and amenities are rebuilt once. Illustrative trade partners only.',
  });
}

export function lumen(): Deal {
  const sf = 168_000;
  const gc = GC_TI;
  const hard = 85 * sf;
  return base({
    id: 'lumen',
    jobCode: 'BH-2026-062',
    name: 'Lumen Pavilion',
    address: 'Medical office, Austin',
    marketId: 'austin',
    assetId: 'medical',
    strategy: 'value-add',
    quality: 'standard',
    phase: 'IC memo',
    image: '/bidding/bidding-medical.jpg',
    sponsor: 'AiBhive Capital',
    team: ['Healthcare', 'Development', 'Leasing'],
    grossSf: 182_000,
    rentableSf: sf,
    units: 1,
    yearBuilt: 2014,
    bidDue: 'IC Monday',
    askingPrice: 265 * sf,
    purchasePrice: 210 * sf,
    prevailingWage: false,
    wageMultiplier: 1.3,
    materialSalesTax: 0.0825,
    vacancy: 0.05,
    inPlaceVacancy: 0.18,
    creditLoss: 0.005,
    rentBasis: 'sf',
    inPlaceRent: 22,
    inPlaceOther: 80_000,
    income: [
      { id: 'rent', label: 'Clinical NNN rent', basis: 'sf', amount: 32 },
      { id: 'cam', label: 'Expense recoveries above base', basis: 'fixed', amount: 220_000 },
    ],
    expenses: [
      { id: 'tax', label: 'Property tax', basis: 'price', amount: 0.016 },
      { id: 'ins', label: 'Insurance', basis: 'sf', amount: 0.55 },
      { id: 'rm', label: 'Structural reserves ops', basis: 'sf', amount: 0.35 },
      { id: 'mgmt', label: 'Management', basis: 'egi', amount: 0.025 },
    ],
    reservesPerSf: 0.25,
    reservesPerUnit: 0,
    trades: materialize(clinical, sf, 1, hard, gc),
    gc,
    architecturePct: 0.07,
    permitsPct: 0.012,
    developerFeePct: 0.015,
    ffe: 2_400_000,
    legalFees: 280_000,
    impactFees: 350_000,
    otherSoft: 420_000,
    closingPct: 0.015,
    closingFixed: 40_000,
    seniorLtc: 0.58,
    mezzLtc: 0,
    interestRate: 0.063,
    mezzRate: 0.11,
    amortYears: 25,
    ioYears: 1,
    points: 0.01,
    mezzPoints: 0,
    reserveMonths: 8,
    holdYears: 8,
    exitCap: 0.065,
    rentGrowth: 0.025,
    sellingCostPct: 0.015,
    targetCashOnCash: 0.075,
    targetCapRate: 0.065,
    targetDscr: 1.25,
    minDebtYield: 0.09,
    yocSpread: 0.012,
    earnestPct: 0.02,
    dueDiligenceDays: 40,
    closingDays: 30,
    financingContingency: true,
    inspectionContingency: true,
    scopeName: 'Clinical suite renovation',
    scopeLow: 60,
    scopeHigh: 160,
    groundLow: 190,
    groundHigh: 432,
    notes:
      'Buy the shell and fund a clinical TI for a credit tenancy. TI is benchmarked against 2026 medical TI ranges, not a hospital. Trade names are placeholders.',
  });
}

export const PRESETS: Deal[] = [harborline(), mercer(), cedar(), lumen()];

export function freshPortfolio(): { activeId: string; deals: Deal[] } {
  return { activeId: 'harborline', deals: PRESETS.map((deal) => structuredClone(deal)) };
}
