import type { TradePack } from './types';

export const propertyPack: TradePack = {
  id: 'property',
  name: 'Property Maintenance Pack',
  shortName: 'Property',
  tagline: 'Appliances · HVAC · Plumbing · Unit turns',
  description:
    'Apartment and property maintenance — appliances, water heaters, HVAC basics, unit turns. Pulls Pool and Electrical playbooks when the job crosses trades.',
  accentColor: '#7C9A6E',
  icon: 'wrench',
  heroImage: require('../assets/categories/property.jpg'),
  crossPackSearch: true,
  categories: [
    {
      id: 'appliances',
      label: 'Appliances',
      examples: ['Washer won’t drain', 'Fridge not cooling', 'Dryer no heat', 'Dishwasher leak'],
      heroImage: require('../assets/categories/appliances.jpg'),
    },
    {
      id: 'water-heaters',
      label: 'Water heaters',
      examples: ['No hot water', 'T&P discharge', 'Pilot out', 'Sediment noise'],
      heroImage: require('../assets/categories/water-heaters.jpg'),
    },
    {
      id: 'hvac-basics',
      label: 'HVAC basics',
      examples: ['Dirty filter', 'Thermostat blank', 'Frozen coil', 'No call for cool'],
      heroImage: require('../assets/categories/hvac-basics.jpg'),
    },
    {
      id: 'plumbing-basics',
      label: 'Plumbing basics',
      examples: ['Clogged disposal', 'Supply valve drip', 'Toilet running', 'Angle stop seize'],
      heroImage: require('../assets/categories/plumbing-basics.jpg'),
    },
    {
      id: 'unit-turns',
      label: 'Unit turns',
      examples: ['Punch list', 'GFCI dead', 'Smoke detector chirp', 'Door hardware'],
      heroImage: require('../assets/categories/unit-turns.jpg'),
    },
  ],
  systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for property maintenance technicians and apartment turn crews.
Cover appliances (washer, dryer, fridge, dishwasher, range, microwave, disposal), tank/tankless water heaters, basic HVAC (filters, thermostats, condensate), and common unit-turn punch items.
When the symptom is clearly electrical (breakers, GFCI, panels) or pool-related, say so and apply those playbooks too — Property Maintenance is cross-trade.
Keep steps glove-friendly. Lock out power/gas/water before opening cabinets. Ask for brand/model when error codes or parts differ.`,
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
};
