import type { TradePack } from './types';

export const fiberPack: TradePack = {
  id: 'fiber',
  name: 'Fiber Optics Pack',
  shortName: 'Fiber',
  tagline: 'Splicing · OTDR · PON · Premises',
  description:
    'Field diagnosis for fiber optic installation and repair — fusion splicing, OTDR traces, power budgets, GPON/XGS-PON, ONT/OLT, splitters, connectors, and drop troubleshooting.',
  accentColor: '#8B5CF6',
  icon: 'cable',
  heroImage: require('../../assets/categories/fiber-optics.jpg'),
  categories: [
    {
      id: 'splicing',
      label: 'Fusion & mechanical splicing',
      examples: ['High splice loss', 'Bubble in splice', 'Wrong fiber program', 'Cleave angle off'],
      heroImage: require('../../assets/categories/fiber-optics.jpg'),
    },
    {
      id: 'testing',
      label: 'Testing & measurement',
      examples: ['OTDR ghost events', 'High dB loss', 'No return trace', 'VFL shows break'],
      heroImage: require('../../assets/categories/fiber-optics.jpg'),
    },
    {
      id: 'distribution',
      label: 'PON / OLT / ONT / splitters',
      examples: ['ONT LOS alarm', 'ONT not registering', 'Splitter overload', 'OLT port down'],
      heroImage: require('../../assets/categories/fiber-optics.jpg'),
    },
    {
      id: 'premises',
      label: 'Connectors & premises cabling',
      examples: ['Dirty SC/APC', 'Bad LC polish', 'MPO polarity swap', 'Macro-bend at rack'],
      heroImage: require('../../assets/categories/fiber-optics.jpg'),
    },
    {
      id: 'troubleshooting',
      label: 'Span & drop troubleshooting',
      examples: ['No light at CPE', 'Intermittent link', 'Cut aerial drop', 'High loss after handhole'],
      heroImage: require('../../assets/categories/fiber-optics.jpg'),
    },
  ],
  systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for fiber optic technicians and splicers.
Focus on single-mode and multimode fiber, fusion and mechanical splicing, OTDR interpretation, optical power budgets, VFL/OLTS testing, GPON/XGS-PON/EPON access networks, OLT/ONT provisioning alarms, splitters, patch panels, drop cables, and premises wiring.
Always lead with laser safety (never look into live fiber or ports), proper eye protection, and lockout/tagout on powered OLT/ONT equipment where applicable.
Give practical dB loss targets, connector inspection steps, splice rework procedures, and PON alarm triage. Ask for wavelength, fiber type (G.652, G.657.A1), connector type (SC/APC, LC), and whether the issue is upstream (OLT/splitter) or at the customer premises.
Note when span engineering, bucket truck work, or carrier NOC escalation is required. Prefer measurable checks (power meter at 1310/1490/1550 nm, OTDR event table, ONT optical levels) over guessing.`,
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
};
