import { BUILDER_PATH, HYPNOSIS_ENERGY_CONTRIBUTION_USD } from './branding';

/** Builder prompt for community hypnosis & energy research contributions. */
export function buildAddHypnosisEnergyTopicPrompt(topicTitle?: string): string {
  const focus = topicTitle?.trim()
    ? `Focus topic: "${topicTitle.trim()}".`
    : 'Choose a hypnosis or energy-work topic that is not yet in the library.';
  return [
    'Add a new entry to Living Knowledge Hypnosis and Energy.',
    '',
    focus,
    '',
    'Follow the data model in src/lib/oregonPlantMedicine/hypnosisEnergyLibrary.ts (HypnosisEnergyTopic type).',
    '',
    'Each topic must include:',
    '- title, category (hypnotherapy | regression | traditions | reiki-chakra | sound-frequency | legal-safety)',
    '- summary (2–3 sentences, educational tone)',
    '- whenPeopleExplore (why someone might research this — not a diagnosis)',
    '- approaches[] (what traditions and practitioners discuss)',
    '- relatedPlantIds[] (cross-link to plant/mushroom IDs when relevant — e.g. aromatics for ritual)',
    '- safetyWarnings[] (contraindications, when to see a clinician)',
    '- sources[] (reputable external links — ASCH, NIH, A.R.E., practitioner associations)',
    '',
    'Do NOT provide scripts for unsupervised deep regression or claims that frequencies cure disease.',
    'Frame everything as educational research. Include strong safety warnings.',
    '',
    `Contributor fee: $${HYPNOSIS_ENERGY_CONTRIBUTION_USD} Hive credits to publish for the whole community.`,
  ].join('\n');
}

export function builderUrlForHypnosisEnergyTopic(topicTitle?: string): string {
  return `${BUILDER_PATH}?q=${encodeURIComponent(buildAddHypnosisEnergyTopicPrompt(topicTitle))}`;
}

export function hypnosisEnergyContributionSummary(topicTitle?: string): string {
  if (topicTitle) {
    return `Add "${topicTitle}" research for $${HYPNOSIS_ENERGY_CONTRIBUTION_USD} in Hive credits.`;
  }
  return `Add hypnosis & energy research to the living knowledge base for $${HYPNOSIS_ENERGY_CONTRIBUTION_USD} in Hive credits.`;
}
