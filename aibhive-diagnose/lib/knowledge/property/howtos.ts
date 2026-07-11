export type HowToGuide = {
  id: string;
  packId: 'property' | 'pool' | 'electrical';
  category: string;
  title: string;
  minutes: number;
  summary: string;
  steps: string[];
  tools: string[];
  image?: number;
  relatedFaultIds?: string[];
};

export const HOW_TO_GUIDES: HowToGuide[] = [
  {
    id: 'howto-hvac-filter',
    packId: 'property',
    category: 'hvac-basics',
    title: 'Replace air handler / furnace filter',
    minutes: 10,
    summary: 'Restore airflow and prevent coil icing with a correct-size filter swap.',
    steps: [
      'Note arrow direction on old filter (airflow toward blower).',
      'Slide out dirty filter; vacuum the rack.',
      'Insert new filter — size and MERV per property standard.',
      'Write install month on frame; run fan to confirm.',
    ],
    tools: ['Correct filter', 'Flashlight', 'Marker'],
    image: require('../../../assets/howtos/hvac-filter.jpg'),
    relatedFaultIds: ['prop-hvac-filter'],
  },
  {
    id: 'howto-disposal-jam',
    packId: 'property',
    category: 'appliances',
    title: 'Clear a jammed garbage disposal',
    minutes: 15,
    summary: 'Free a humming disposal safely with the hex key and reset.',
    steps: [
      'Turn off wall switch and/or unplug.',
      'Insert 1/4" hex into bottom socket; rock both ways.',
      'Fish debris with tongs — never fingers with power available.',
      'Press red reset; restore power; run cold water and test.',
    ],
    tools: ['1/4" hex key', 'Tongs', 'Flashlight'],
    image: require('../../../assets/howtos/disposal.jpg'),
    relatedFaultIds: ['prop-disposal-hum'],
  },
  {
    id: 'howto-fridge-filter',
    packId: 'property',
    category: 'appliances',
    title: 'Replace refrigerator water filter',
    minutes: 10,
    summary: 'Restore ice maker / dispenser flow and clear filter errors.',
    steps: [
      'Locate filter (grille, interior corner, or external).',
      'Twist/pull per model; catch drips.',
      'Install new OEM or approved filter; reset filter indicator if required.',
      'Dispense 1–2 gallons to purge air.',
    ],
    tools: ['Towel', 'Replacement filter'],
    image: require('../../../assets/howtos/fridge-filter.jpg'),
    relatedFaultIds: ['prop-ice-maker-dead'],
  },
  {
    id: 'howto-wh-flush',
    packId: 'property',
    category: 'water-heaters',
    title: 'Flush a tank water heater',
    minutes: 45,
    summary: 'Reduce sediment noise and extend element life.',
    steps: [
      'Kill power/gas. Shut cold supply.',
      'Attach hose to drain; open T&P or hot faucet for air.',
      'Drain until clear; briefly open cold to stir sediment.',
      'Close drain; refill completely before restoring power/gas.',
    ],
    tools: ['Garden hose', 'Bucket', 'Screwdriver'],
    image: require('../../../assets/howtos/water-heater-flush.jpg'),
    relatedFaultIds: ['prop-wh-no-hot'],
  },
];

export function getHowToGuides(packId?: string, category?: string) {
  return HOW_TO_GUIDES.filter((g) => {
    if (packId && g.packId !== packId) return false;
    if (category && g.category !== category) return false;
    return true;
  });
}

export function getHowToById(id: string) {
  return HOW_TO_GUIDES.find((g) => g.id === id);
}
