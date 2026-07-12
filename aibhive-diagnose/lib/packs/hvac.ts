import type { TradePack } from './types';

export const hvacPack: TradePack = {
  id: 'hvac',
  name: 'HVAC Pack',
  shortName: 'HVAC',
  tagline: 'Cooling · Heating · Airflow · Controls',
  description:
    'Field diagnosis for residential HVAC — split systems, heat pumps, furnaces, thermostats, airflow, and refrigeration fundamentals.',
  accentColor: '#7B9FD4',
  icon: 'wind',
  heroImage: require('../../assets/categories/hvac-basics.jpg'),
  categories: [
    {
      id: 'cooling',
      label: 'Cooling / AC',
      examples: ['Warm air at vents', 'Frozen coil', 'High head pressure', 'Condensate overflow'],
      heroImage: require('../../assets/categories/hvac-basics.jpg'),
    },
    {
      id: 'heating',
      label: 'Heating',
      examples: ['Furnace no heat', 'Ignitor failure', 'Heat pump aux heat', 'Gas valve issues'],
      heroImage: require('../../assets/categories/hvac-basics.jpg'),
    },
    {
      id: 'airflow',
      label: 'Airflow & ducts',
      examples: ['Weak room airflow', 'Dirty filter', 'Duct leak', 'Blower issues'],
      heroImage: require('../../assets/categories/hvac-basics.jpg'),
    },
    {
      id: 'controls',
      label: 'Controls',
      examples: ['Thermostat blank', 'No Y call', 'Zoning damper', 'Communicating faults'],
      heroImage: require('../../assets/categories/hvac-basics.jpg'),
    },
    {
      id: 'refrigeration',
      label: 'Refrigeration',
      examples: ['Low charge signs', 'Compressor hard start', 'TXV hunting', 'Leak search basics'],
      heroImage: require('../../assets/categories/hvac-basics.jpg'),
    },
  ],
  systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for HVAC technicians.
Focus on split-system AC, heat pumps, gas/electric furnaces, air handlers, thermostats, zoning, ductwork, and refrigeration cycle diagnostics.
Always lead with electrical lockout, gas leak / CO protocols, and refrigerant handling rules (EPA Section 608 — no venting, recover before opening).
Give practical superheat/subcool interpretation, airflow checks, and control voltage troubleshooting. Ask for refrigerant type, equipment model, and indoor/outdoor symptoms.
Note when sealed-system work, combustion analysis, or manufacturer proprietary boards require escalation. Prefer measurable checks (delta-T, static pressure, amp draws) over guessing.`,
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
};
