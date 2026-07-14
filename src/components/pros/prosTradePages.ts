import type { LucideIcon } from 'lucide-react';
import { Building2, Cable, Droplets, Wind, Zap } from 'lucide-react';

export type ProsTradeId = 'hvac' | 'property' | 'pool' | 'electrical' | 'fiber';

export type ProsTradePageConfig = {
  id: ProsTradeId;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentColor: string;
  icon: LucideIcon;
  seoTitle: string;
  seoDescription: string;
  heroEyebrow: string;
  categories: { label: string; examples: string[] }[];
  quickPrompts: string[];
  commonEquipment: string[];
  prosFeatures: string[];
};

export const PROS_TRADE_PAGES: Record<ProsTradeId, ProsTradePageConfig> = {
  hvac: {
    id: 'hvac',
    slug: 'hvac',
    name: 'HVAC',
    shortName: 'HVAC',
    tagline: 'Cooling · Heating · Airflow · Controls',
    description:
      'Field diagnosis for residential HVAC — split systems, heat pumps, furnaces, thermostats, airflow, and refrigeration fundamentals.',
    accentColor: '#7B9FD4',
    icon: Wind,
    seoTitle: 'AiBhive Pros for HVAC Companies — Field diagnosis & living knowledge',
    seoDescription:
      'Dispatch HVAC jobs, grow a shop knowledge base from every truck, and give techs AiBhive Diagnose with the HVAC pack — split systems, heat pumps, furnaces, and controls.',
    heroEyebrow: 'HVAC companies',
    categories: [
      { label: 'Cooling / AC', examples: ['Warm air at vents', 'Frozen coil', 'High head pressure', 'Condensate overflow'] },
      { label: 'Heating', examples: ['Furnace no heat', 'Ignitor failure', 'Heat pump aux heat', 'Gas valve issues'] },
      { label: 'Airflow & ducts', examples: ['Weak room airflow', 'Dirty filter', 'Duct leak', 'Blower issues'] },
      { label: 'Controls', examples: ['Thermostat blank', 'No Y call', 'Zoning damper', 'Communicating faults'] },
    ],
    quickPrompts: [
      'AC blowing warm — outdoor unit running',
      'Evaporator coil frozen solid',
      'Furnace ignites then shuts off in 3 seconds',
      'Heat pump won’t switch to heat mode',
    ],
    commonEquipment: [
      'Split-system condenser',
      'Air handler / furnace',
      'Heat pump outdoor unit',
      'Thermostat / zone panel',
    ],
    prosFeatures: [
      'Dispatch cool/heat calls with push updates to Diagnose',
      'Capture “that worked” fixes after every job',
      'OEM manual RAG for model-specific playbooks',
      'Periodic GPS roster — know who’s closest to the callback',
    ],
  },
  property: {
    id: 'property',
    slug: 'property',
    name: 'Property Management',
    shortName: 'Property',
    tagline: 'Appliances · HVAC · Plumbing · Unit turns',
    description:
      'Apartment and property maintenance — appliances, water heaters, unit turns, and cross-trade punch lists when one crew handles everything.',
    accentColor: '#7C9A6E',
    icon: Building2,
    seoTitle: 'AiBhive Pros for Property Management — Maintenance teams & unit turns',
    seoDescription:
      'Run maintenance and turn crews from Pros HQ. Diagnose appliances, water heaters, and unit-turn punch items in the field with a knowledge base that compounds across properties.',
    heroEyebrow: 'Property maintenance',
    categories: [
      { label: 'Appliances', examples: ['Washer won’t drain', 'Fridge not cooling', 'Dryer no heat', 'Dishwasher leak'] },
      { label: 'Water heaters', examples: ['No hot water', 'T&P discharge', 'Pilot out', 'Sediment noise'] },
      { label: 'HVAC basics', examples: ['Dirty filter', 'Thermostat blank', 'Frozen coil', 'No call for cool'] },
      { label: 'Unit turns', examples: ['Punch list', 'GFCI dead', 'Smoke detector chirp', 'Door hardware'] },
    ],
    quickPrompts: [
      'Washer fills then won’t drain / spin',
      'Fridge warm, freezer still cold',
      'Electric dryer tumbles but no heat',
      'Garbage disposal hums but won’t grind',
    ],
    commonEquipment: [
      'Washer / dryer',
      'Refrigerator / ice maker',
      'Dishwasher',
      'Water heater',
    ],
    prosFeatures: [
      'Route turns and work orders to the right tech',
      'Cross-trade tips when electrical or pool issues appear',
      'Shared fixes across your portfolio — not per-building binders',
      'Export job history for owners and asset tracking',
    ],
  },
  pool: {
    id: 'pool',
    slug: 'pool',
    name: 'Pool Service',
    shortName: 'Pool',
    tagline: 'Pumps · Filters · Salt · Automation',
    description:
      'Field diagnosis for pool equipment — pumps, filters, salt systems, heaters, and automation controllers.',
    accentColor: '#2BB8C8',
    icon: Droplets,
    seoTitle: 'AiBhive Pros for Pool Companies — Pumps, salt, automation & field knowledge',
    seoDescription:
      'Pool route and service companies use Pros HQ to dispatch jobs and grow a living knowledge base. Techs diagnose pumps, salt cells, heaters, and automation in AiBhive Diagnose.',
    heroEyebrow: 'Pool service & route techs',
    categories: [
      { label: 'Pumps', examples: ['Won’t prime', 'Loud bearing noise', 'VS pump error codes'] },
      { label: 'Filters', examples: ['High pressure', 'DE grid tear', 'Multiport leaks'] },
      { label: 'Salt systems', examples: ['Low salt false alarm', 'Cell scaling', 'No chlorine output'] },
      { label: 'Automation', examples: ['Pentair IntelliCenter', 'Jandy iAqualink', 'Relay failures'] },
    ],
    quickPrompts: [
      'Pump won’t prime after filter clean',
      'Salt cell shows low salt but chemistry is fine',
      'Heater ignites then shuts off',
      'Filter pressure high / weak returns',
    ],
    commonEquipment: [
      'Variable-speed pump',
      'Cartridge / DE / sand filter',
      'Salt chlorine generator',
      'Automation controller',
    ],
    prosFeatures: [
      'Push route changes and service alerts to techs',
      'Field tips from every truck feed the shop playbook',
      'Manual ingest for Pentair, Jandy, Hayward docs',
      'Job completion prompts capture the actual fix',
    ],
  },
  electrical: {
    id: 'electrical',
    slug: 'electrical',
    name: 'Electrical',
    shortName: 'Electrical',
    tagline: 'Panels · Breakers · Wiring · Code',
    description:
      'Field diagnosis for electrical panels, breakers, wiring faults, and common code lookups for service techs.',
    accentColor: '#F0B429',
    icon: Zap,
    seoTitle: 'AiBhive Pros for Electrical Contractors — Panels, breakers & code-aware diagnosis',
    seoDescription:
      'Electrical service companies run dispatch and knowledge from Pros HQ. Techs get lockout-first troubleshooting, panel playbooks, and GFCI/AFCI guidance in Diagnose.',
    heroEyebrow: 'Electrical contractors',
    categories: [
      { label: 'Panels', examples: ['Hot bus bar', 'Corroded lugs', 'Subpanel bonding'] },
      { label: 'Breakers', examples: ['Nuisance trip', 'AFCI/GFCI faults', 'Double-tapped'] },
      { label: 'Wiring', examples: ['Open neutral', 'Shared neutrals', 'Aluminum pigtails'] },
      { label: 'Code lookup', examples: ['GFCI locations', 'Working clearances', 'Bonding requirements'] },
    ],
    quickPrompts: [
      'Breaker trips when AC starts',
      'Panel feels warm near main lugs',
      'GFCI won’t reset after rain',
      'AFCI trips with vacuum',
    ],
    commonEquipment: [
      'Main service panel',
      'Subpanel',
      'AFCI / GFCI breakers',
      'Bonding / grounding system',
    ],
    prosFeatures: [
      'Safety-first prompts synced to every truck',
      'Document fixes for repeat service calls',
      'Team roster with optional periodic GPS check-ins',
      'Anonymized tips can help the wider trade network',
    ],
  },
  fiber: {
    id: 'fiber',
    slug: 'fiber',
    name: 'Fiber Optics',
    shortName: 'Fiber',
    tagline: 'Splicing · OTDR · PON · Premises',
    description:
      'Field diagnosis for fiber optic installation and repair — fusion splicing, OTDR traces, power budgets, GPON/XGS-PON, ONT/OLT, splitters, connectors, and drop troubleshooting.',
    accentColor: '#8B5CF6',
    icon: Cable,
    seoTitle: 'AiBhive Pros for Fiber Optics — Splicing, OTDR & PON field knowledge',
    seoDescription:
      'Fiber contractors and ISP field crews use Pros HQ to dispatch jobs and grow a living knowledge base. Techs get splice playbooks, OTDR triage, and ONT/OLT alarm guidance in AiBhive Diagnose.',
    heroEyebrow: 'Fiber optic contractors & ISP field techs',
    categories: [
      { label: 'Fusion splicing', examples: ['High splice loss', 'Bubble in splice', 'Wrong fiber program', 'Cleave angle off'] },
      { label: 'Testing & OTDR', examples: ['Ghost events', 'High dB loss', 'No return trace', 'VFL shows break'] },
      { label: 'PON / OLT / ONT', examples: ['ONT LOS alarm', 'ONT not registering', 'Splitter overload', 'OLT port down'] },
      { label: 'Connectors & drops', examples: ['Dirty SC/APC', 'Bad LC polish', 'MPO polarity swap', 'Cut aerial drop'] },
    ],
    quickPrompts: [
      'Fusion splice loss too high on single-mode',
      'OTDR shows ghost event at 2 km',
      'ONT LOS red alarm — no light at customer',
      'Dirty SC/APC connector high loss',
    ],
    commonEquipment: [
      'Fusion splicer',
      'OTDR',
      'Optical power meter',
      'OLT / ONT (GPON)',
    ],
    prosFeatures: [
      'Dispatch splice and restore jobs with push updates to Diagnose',
      'Capture field fixes after every span or drop repair',
      'Manual ingest for OEM splicer and OLT documentation',
      'Laser-safety prompts synced to every truck',
    ],
  },
};

export const PROS_TRADE_LIST = Object.values(PROS_TRADE_PAGES);

export function getProsTradeBySlug(slug: string | undefined): ProsTradePageConfig | null {
  if (!slug) return null;
  return PROS_TRADE_LIST.find((t) => t.slug === slug) ?? null;
}
