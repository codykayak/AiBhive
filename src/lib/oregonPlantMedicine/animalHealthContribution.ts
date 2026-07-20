import { BUILDER_PATH, ANIMAL_HEALTH_CONTRIBUTION_USD } from './branding';

export function buildAddAnimalHealthTopicPrompt(topicTitle?: string): string {
  const focus = topicTitle?.trim()
    ? `Focus topic: "${topicTitle.trim()}".`
    : 'Choose an animal health topic that is not yet in the library.';
  return [
    'Add a new entry to Living Knowledge Animal Health.',
    '',
    focus,
    '',
    'Follow the data model in src/lib/oregonPlantMedicine/animalHealthLibrary.ts (AnimalHealthTopic type).',
    '',
    'Each topic must include:',
    '- title, category (holistic-vet | dogs-cats | horses-livestock | herbs-nutrition | energy-modalities | legal-safety)',
    '- summary, deepDive (250–500 words, educational tone)',
    '- imageUrl (Wikimedia Commons), imageCredit',
    '- whenPeopleExplore, approaches[], relatedPlantIds[], safetyWarnings[], sources[]',
    '',
    'Do NOT provide veterinary prescriptions, essential oil recipes for cats, or livestock drug dosing.',
    '',
    `Contributor fee: $${ANIMAL_HEALTH_CONTRIBUTION_USD} Hive credits to publish for the whole community.`,
  ].join('\n');
}

export function builderUrlForAnimalHealthTopic(topicTitle?: string): string {
  return `${BUILDER_PATH}?q=${encodeURIComponent(buildAddAnimalHealthTopicPrompt(topicTitle))}`;
}
