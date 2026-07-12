import type { TradePack } from './types';

export const plumbingPack: TradePack = {
  id: 'plumbing',
  name: 'Plumbing Pack',
  shortName: 'Plumbing',
  tagline: 'Drains · Supply · Fixtures · Water heaters',
  description:
    'Field diagnosis for residential and light commercial plumbing — drain systems, water supply, fixtures, water heaters, backflow, and gas piping basics.',
  accentColor: '#4A9FD4',
  icon: 'droplets',
  heroImage: require('../../assets/categories/plumbing-basics.jpg'),
  categories: [
    {
      id: 'drains',
      label: 'Drains & sewer',
      examples: ['Main line backup', 'Slow kitchen drain', 'Vent blockage', 'Cleanout access'],
      heroImage: require('../../assets/categories/plumbing-basics.jpg'),
    },
    {
      id: 'supply',
      label: 'Water supply',
      examples: ['Low pressure', 'PRV failure', 'Hammer / water surge', 'Frozen / burst pipe'],
      heroImage: require('../../assets/categories/plumbing-basics.jpg'),
    },
    {
      id: 'fixtures',
      label: 'Fixtures',
      examples: ['Running toilet', 'Faucet drip', 'Shower valve', 'Angle stop seized'],
      heroImage: require('../../assets/categories/plumbing-basics.jpg'),
    },
    {
      id: 'water-heaters',
      label: 'Water heaters',
      examples: ['No hot water', 'T&P discharge', 'Tankless flame failure', 'Sediment rumble'],
      heroImage: require('../../assets/categories/water-heaters.jpg'),
    },
    {
      id: 'gas-backflow',
      label: 'Gas & backflow',
      examples: ['Gas odor at appliance', 'Backflow dripping', 'Sump pump out', 'Sewer gas smell'],
      heroImage: require('../../assets/categories/plumbing-basics.jpg'),
    },
  ],
  systemPrompt: `You are AiBhive Diagnose — a voice-first field co-pilot for licensed plumbing technicians and apprentices.
Focus on drain/waste/vent systems, potable water supply, fixtures, water heaters (tank and tankless), backflow assemblies, sump pumps, and basic gas piping to appliances.
Lead with shutoff locations, scald/burn risk, sewer gas exposure, and gas leak protocols. Never advise opening gas lines without proper training and permits.
Give glove-friendly step-by-step troubleshooting. Ask for pipe material (copper, PEX, CPVC, galvanized, cast iron), fixture brand, and whether the issue is isolated or whole-house.
Reference IPC/UPC concepts in plain language — verify local amendments. Escalate slab leaks, main sewer collapses, and cross-connection hazards to appropriate specialists.`,
  quickPrompts: [
    'Main line backing up into tub when toilet flushes',
    'Whole-house low water pressure',
    'Toilet runs every few minutes — new flapper didn’t fix it',
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
};
