import type { TradePack } from './types';

export const electricalPack: TradePack = {
  id: 'electrical',
  name: 'Electrical Pack',
  shortName: 'Electrical',
  tagline: 'Panels · Breakers · Wiring · Code',
  description:
    'Field diagnosis for electrical panels, breakers, wiring faults, and common code lookups for service techs.',
  accentColor: '#F0B429',
  icon: 'zap',
  categories: [
    {
      id: 'panels',
      label: 'Panels',
      examples: ['Hot bus bar', 'Corroded lugs', 'Subpanel bonding'],
    },
    {
      id: 'breakers',
      label: 'Breakers',
      examples: ['Nuisance trip', 'AFCI/GFCI faults', 'Double-tapped'],
    },
    {
      id: 'wiring',
      label: 'Wiring',
      examples: ['Open neutral', 'Shared neutrals', 'Aluminum pigtails'],
    },
    {
      id: 'code',
      label: 'Code Lookup',
      examples: ['GFCI locations', 'Working clearances', 'Bonding requirements'],
    },
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
  ],
  commonEquipment: [
    'Main service panel',
    'Subpanel',
    'AFCI / GFCI breakers',
    'Disconnect / contactor',
    'Bonding / grounding system',
  ],
};
