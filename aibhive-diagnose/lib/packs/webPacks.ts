/**
 * Trade pack metadata for web (no native asset requires).
 */
import type { TradePack, TradePackId } from './types';

export const WEB_TRADE_PACKS: Record<TradePackId, TradePack> = {
  pool: {
    id: 'pool',
    name: 'Pool Services Pack',
    shortName: 'Pool',
    tagline: 'Pumps · Filters · Salt · Automation',
    description:
      'Field diagnosis for pool equipment — pumps, filters, salt systems, heaters, and automation controllers.',
    accentColor: '#2BB8C8',
    icon: 'waves',
    categories: [
      { id: 'pumps', label: 'Pumps', examples: ['Won’t prime', 'Loud bearing noise', 'VS pump error codes'] },
      { id: 'filters', label: 'Filters', examples: ['High pressure', 'DE grid tear', 'Multiport leaks'] },
      { id: 'salt', label: 'Salt Systems', examples: ['Low salt false alarm', 'Cell scaling', 'No chlorine output'] },
      { id: 'automation', label: 'Automation', examples: ['Pentair IntelliCenter', 'Jandy iAqualink', 'Relay failures'] },
    ],
    systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for pool service technicians.
Focus on pumps, filters, salt chlorine generators, heaters, and pool automation.
Give practical, glove-friendly step-by-step guidance. Call out electrical/chemical safety first.
Prefer common field fixes before parts replacement. Ask for model/brand when it changes the procedure.`,
    quickPrompts: [
      'Pump won’t prime after filter clean',
      'Salt cell shows low salt but chemistry is fine',
      'Heater ignites then shuts off',
      'Automation relay stuck on spa mode',
      'Filter pressure high / weak returns',
      'Green algae bloom after rain',
    ],
    commonEquipment: [
      'Variable-speed pump',
      'Cartridge / DE / sand filter',
      'Salt chlorine generator',
      'Gas / heat-pump heater',
      'Automation controller',
    ],
  },
  electrical: {
    id: 'electrical',
    name: 'Electrical Pack',
    shortName: 'Electrical',
    tagline: 'Panels · Breakers · Wiring · Code',
    description:
      'Field diagnosis for electrical panels, breakers, wiring faults, and common code lookups for service techs.',
    accentColor: '#F0B429',
    icon: 'zap',
    categories: [
      { id: 'panels', label: 'Panels', examples: ['Hot bus bar', 'Corroded lugs', 'Subpanel bonding'] },
      { id: 'breakers', label: 'Breakers', examples: ['Nuisance trip', 'AFCI/GFCI faults', 'Double-tapped'] },
      { id: 'wiring', label: 'Wiring', examples: ['Open neutral', 'Shared neutrals', 'Aluminum pigtails'] },
      { id: 'code', label: 'Code Lookup', examples: ['GFCI locations', 'Working clearances', 'Bonding requirements'] },
    ],
    systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for electrical technicians.
Focus on panels, breakers, wiring faults, bonding/grounding, and practical code guidance.
Always lead with lockout/tagout and shock hazards. Never encourage unsafe live work.
Give clear step-by-step troubleshooting. Note when a licensed electrician or utility involvement is required.`,
    quickPrompts: [
      'Breaker trips when AC starts',
      'Panel feels warm near main lugs',
      'GFCI won’t reset after rain',
      'Open neutral symptoms in kitchen',
      'AFCI trips with vacuum',
      'Tingle at pool ladder',
    ],
    commonEquipment: [
      'Main service panel',
      'Subpanel',
      'AFCI / GFCI breakers',
      'Disconnect / contactor',
      'Bonding / grounding system',
    ],
  },
  property: {
    id: 'property',
    name: 'Property Maintenance Pack',
    shortName: 'Property',
    tagline: 'Appliances · HVAC · Plumbing · Unit turns',
    description:
      'Apartment and property maintenance — appliances, water heaters, unit turns. Cross-trade with pool and electrical when needed.',
    accentColor: '#7C9A6E',
    icon: 'wrench',
    crossPackSearch: true,
    categories: [
      { id: 'appliances', label: 'Appliances', examples: ['Washer won’t drain', 'Fridge not cooling', 'Dryer no heat', 'Dishwasher leak'] },
      { id: 'water-heaters', label: 'Water heaters', examples: ['No hot water', 'T&P discharge', 'Pilot out', 'Sediment noise'] },
      { id: 'hvac-basics', label: 'HVAC basics', examples: ['Dirty filter', 'Thermostat blank', 'Frozen coil', 'No call for cool'] },
      { id: 'plumbing-basics', label: 'Plumbing basics', examples: ['Clogged disposal', 'Supply valve drip', 'Toilet running', 'Angle stop seize'] },
      { id: 'unit-turns', label: 'Unit turns', examples: ['Punch list', 'GFCI dead', 'Smoke detector chirp', 'Door hardware'] },
    ],
    systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for property maintenance technicians and apartment turn crews.
Cover appliances, water heaters, basic HVAC, and common unit-turn punch items.
When the symptom is clearly electrical or pool-related, apply those playbooks too.
Keep steps glove-friendly. Lock out power/gas/water before opening cabinets.`,
    quickPrompts: [
      'Washer fills then won’t drain / spin',
      'Fridge warm, freezer still cold',
      'Electric dryer tumbles but no heat',
      'Gas water heater pilot won’t stay lit',
      'AC blowing warm — filter looks dirty',
      'Garbage disposal hums but won’t grind',
    ],
    commonEquipment: [
      'Washer / dryer',
      'Refrigerator / ice maker',
      'Dishwasher',
      'Range / oven / microwave',
      'Garbage disposal',
      'Water heater',
      'Thermostat / air handler filter',
    ],
  },
  plumbing: {
    id: 'plumbing',
    name: 'Plumbing Pack',
    shortName: 'Plumbing',
    tagline: 'Drains · Supply · Fixtures · Water heaters',
    description:
      'Field diagnosis for residential and light commercial plumbing — drains, supply, fixtures, water heaters, and backflow.',
    accentColor: '#4A9FD4',
    icon: 'droplets',
    categories: [
      { id: 'drains', label: 'Drains & sewer', examples: ['Main line backup', 'Slow kitchen drain', 'Vent blockage', 'Cleanout access'] },
      { id: 'supply', label: 'Water supply', examples: ['Low pressure', 'PRV failure', 'Hammer / water surge', 'Frozen / burst pipe'] },
      { id: 'fixtures', label: 'Fixtures', examples: ['Running toilet', 'Faucet drip', 'Shower valve', 'Angle stop seized'] },
      { id: 'water-heaters', label: 'Water heaters', examples: ['No hot water', 'T&P discharge', 'Tankless flame failure', 'Sediment rumble'] },
      { id: 'gas-backflow', label: 'Gas & backflow', examples: ['Gas odor at appliance', 'Backflow dripping', 'Sump pump out', 'Sewer gas smell'] },
    ],
    systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for plumbing technicians.
Focus on drain/waste/vent, potable supply, fixtures, water heaters, and backflow.
Lead with shutoff locations, scald/burn risk, and gas leak protocols.`,
    quickPrompts: [
      'Main line backing up into tub when toilet flushes',
      'Whole-house low water pressure',
      'Toilet runs every few minutes',
      'Tankless flashes error and no hot water',
      'Water hammer when washing machine shuts off',
      'Sewer smell in bathroom — trap looks fine',
    ],
    commonEquipment: [
      'Main shutoff / meter',
      'PRV / expansion tank',
      'Toilet / fill valve / flapper',
      'Tank / tankless water heater',
      'Cleanout / sewer camera access',
      'Backflow preventer / RPZ',
      'Sump pump / ejector',
    ],
  },
  hvac: {
    id: 'hvac',
    name: 'HVAC Pack',
    shortName: 'HVAC',
    tagline: 'Cooling · Heating · Airflow · Controls',
    description:
      'Field diagnosis for residential HVAC — split systems, heat pumps, furnaces, thermostats, airflow, and refrigeration.',
    accentColor: '#7B9FD4',
    icon: 'wind',
    categories: [
      { id: 'cooling', label: 'Cooling / AC', examples: ['Warm air at vents', 'Frozen coil', 'High head pressure', 'Condensate overflow'] },
      { id: 'heating', label: 'Heating', examples: ['Furnace no heat', 'Ignitor failure', 'Heat pump aux heat', 'Gas valve issues'] },
      { id: 'airflow', label: 'Airflow & ducts', examples: ['Weak room airflow', 'Dirty filter', 'Duct leak', 'Blower issues'] },
      { id: 'controls', label: 'Controls', examples: ['Thermostat blank', 'No Y call', 'Zoning damper', 'Communicating faults'] },
      { id: 'refrigeration', label: 'Refrigeration', examples: ['Low charge signs', 'Compressor hard start', 'TXV hunting', 'Leak search basics'] },
    ],
    systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for HVAC technicians.
Focus on split-system AC, heat pumps, furnaces, thermostats, and refrigeration cycle diagnostics.
Always lead with electrical lockout, gas leak / CO protocols, and refrigerant handling rules.`,
    quickPrompts: [
      'AC blowing warm — outdoor unit running',
      'Evaporator coil frozen solid',
      'Furnace ignites then shuts off in 3 seconds',
      'Heat pump won’t switch to heat mode',
      'Thermostat blank — no display',
      'High head pressure on R-410A system',
    ],
    commonEquipment: [
      'Split-system condenser',
      'Air handler / furnace',
      'Heat pump outdoor unit',
      'Thermostat / zone panel',
      'TXV / piston metering',
      'Condensate pump / safety switch',
      'Recovery / manifold gauges',
    ],
  },
  fiber: {
    id: 'fiber',
    name: 'Fiber Optics Pack',
    shortName: 'Fiber',
    tagline: 'Splicing · OTDR · PON · Premises',
    description:
      'Field diagnosis for fiber optic installation and repair — splicing, OTDR, PON, ONT/OLT, splitters, and drops.',
    accentColor: '#8B5CF6',
    icon: 'cable',
    categories: [
      { id: 'splicing', label: 'Fusion & mechanical splicing', examples: ['High splice loss', 'Bubble in splice', 'Wrong fiber program', 'Cleave angle off'] },
      { id: 'testing', label: 'Testing & measurement', examples: ['OTDR ghost events', 'High dB loss', 'No return trace', 'VFL shows break'] },
      { id: 'distribution', label: 'PON / OLT / ONT / splitters', examples: ['ONT LOS alarm', 'ONT not registering', 'Splitter overload', 'OLT port down'] },
      { id: 'premises', label: 'Connectors & premises cabling', examples: ['Dirty SC/APC', 'Bad LC polish', 'MPO polarity swap', 'Macro-bend at rack'] },
      { id: 'troubleshooting', label: 'Span & drop troubleshooting', examples: ['No light at CPE', 'Intermittent link', 'Cut aerial drop', 'High loss after handhole'] },
    ],
    systemPrompt: `You are AiBhive Diagnose — a field co-pilot for fiber optic technicians and splicers.
Focus on fusion splicing, OTDR, optical power budgets, GPON/XGS-PON, OLT/ONT, splitters, and premises wiring.
Always lead with laser safety — never look into live fiber or ports.`,
    quickPrompts: [
      'Fusion splice loss too high on single-mode',
      'OTDR shows ghost event at 2 km',
      'ONT LOS red alarm — no light at customer',
      'Dirty SC/APC connector high loss',
      'GPON ONT won’t register after splice',
      'Aerial drop cut — emergency restore',
    ],
    commonEquipment: [
      'Fusion splicer',
      'OTDR',
      'Optical power meter',
      'VFL / red light source',
      'OLT / ONT (GPON)',
      '1×32 splitter',
      'SC/APC patch cords',
      'Cleaver & IPA wipes',
    ],
  },
};

export const WEB_TRADE_PACK_LIST = Object.values(WEB_TRADE_PACKS);

export function getWebTradePack(id: TradePackId) {
  return WEB_TRADE_PACKS[id];
}
