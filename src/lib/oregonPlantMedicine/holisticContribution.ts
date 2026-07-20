import { BUILDER_PATH, HOLISTIC_CONTRIBUTION_USD } from './branding';

/** Builder prompt for community holistic research contributions. */
export function buildAddHolisticTopicPrompt(topicTitle?: string): string {
  const focus = topicTitle?.trim()
    ? `Focus topic: "${topicTitle.trim()}".`
    : 'Choose a holistic health topic that is not yet in the library.';
  return [
    'Add a new entry to Living Knowledge Holistic Remedies and Protocols.',
    '',
    focus,
    '',
    'Follow the data model in src/lib/oregonPlantMedicine/holisticLibrary.ts (HolisticTopic type).',
    '',
    'Each topic must include:',
    '- title, category (detox | digestive | immune | nervous-system | traditions | modalities | legal-safety)',
    '- summary (2–3 sentences, educational tone)',
    '- whenPeopleExplore (why someone might research this — not a diagnosis)',
    '- approaches[] (bullet points — what traditions and practitioners discuss)',
    '- relatedPlantIds[] (cross-link to existing plant/mushroom IDs in plantLibrary.ts)',
    '- safetyWarnings[] (contraindications, when to see a clinician)',
    '- sources[] (reputable external links — A.R.E., NIH, herbal texts, etc.)',
    '- optional pdfLinks for downloadable references',
    '',
    'Do NOT provide dangerous dosing, chelation protocols, or parasite pharmaceutical instructions.',
    'Frame everything as educational research. Include strong safety warnings.',
    '',
    `Contributor fee: $${HOLISTIC_CONTRIBUTION_USD} Hive credits to publish for the whole community.`,
  ].join('\n');
}

export function builderUrlForHolisticTopic(topicTitle?: string): string {
  return `${BUILDER_PATH}?q=${encodeURIComponent(buildAddHolisticTopicPrompt(topicTitle))}`;
}

export function holisticContributionSummary(topicTitle?: string): string {
  if (topicTitle) {
    return `Add "${topicTitle}" research for $${HOLISTIC_CONTRIBUTION_USD} in Hive credits.`;
  }
  return `Add holistic research to the living knowledge base for $${HOLISTIC_CONTRIBUTION_USD} in Hive credits.`;
}
