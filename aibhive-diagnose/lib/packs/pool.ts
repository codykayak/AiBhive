import type { TradePack } from './types';

export const poolPack: TradePack = {
  id: 'pool',
  name: 'Pool Services Pack',
  shortName: 'Pool',
  tagline: 'Pumps · Filters · Salt · Automation',
  description:
    'Field diagnosis for pool equipment — pumps, filters, salt systems, heaters, and automation controllers.',
  accentColor: '#2BB8C8',
  icon: 'waves',
  categories: [
    {
      id: 'pumps',
      label: 'Pumps',
      examples: ['Won’t prime', 'Loud bearing noise', 'VS pump error codes'],
    },
    {
      id: 'filters',
      label: 'Filters',
      examples: ['High pressure', 'DE grid tear', 'Multiport leaks'],
    },
    {
      id: 'salt',
      label: 'Salt Systems',
      examples: ['Low salt false alarm', 'Cell scaling', 'No chlorine output'],
    },
    {
      id: 'automation',
      label: 'Automation',
      examples: ['Pentair IntelliCenter', 'Jandy iAqualink', 'Relay failures'],
    },
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
  ],
  commonEquipment: [
    'Variable-speed pump',
    'Cartridge / DE / sand filter',
    'Salt chlorine generator',
    'Gas / heat-pump heater',
    'Automation controller',
  ],
};
