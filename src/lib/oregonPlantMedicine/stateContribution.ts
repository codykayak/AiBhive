import { BUILDER_PATH, STATE_CONTRIBUTION_USD } from './branding';

/** Builder prompt template — mirrors how the Oregon seed library was authored. */
export function buildAddStatePrompt(state: string, city?: string): string {
  const place = city?.trim() ? `${city.trim()}, ${state}` : state;
  return [
    `Add a new regional library to Living Knowledge Plants and Medicine for ${state}.`,
    '',
    'This is a contribution to the community living knowledge base. Follow the same data model and depth as the existing Oregon plant library in src/lib/oregonPlantMedicine/plantLibrary.ts.',
    '',
    `Seed geography: ${place} and surrounding wild areas in ${state}.`,
    '',
    'For each plant species, create entries with:',
    '- commonName, scientificName, alsoKnownAs (optional)',
    '- uses: edible | medicinal | both | hallucinogenic',
    '- category: herb | shrub | tree | berry | fern | mushroom | lichen | seaweed',
    '- regions/sub-regions within the state (e.g. coast vs. valley)',
    '- habitat, identification (field-ID detail), toxic look-alikes array',
    '- edibleNotes, medicinalNotes, holisticNotes, preparation (as applicable)',
    '- harvestSeason, safetyWarnings array',
    '- three ID photos per species (primary + two additional with captions)',
    '- externalLinks to USDA, Wikipedia, and reputable regional guides',
    '',
    'Start with 12–20 high-value wild edibles and medicinals local to the region, then expand. Include safety warnings and look-alike notes on every edible.',
    '',
    'Publish so all users browsing this state see the new library in the Living Knowledge app.',
  ].join('\n');
}

export function builderUrlForState(state: string, city?: string): string {
  const q = buildAddStatePrompt(state, city);
  return `${BUILDER_PATH}?q=${encodeURIComponent(q)}`;
}

export function stateContributionSummary(state: string): string {
  return `Add ${state} to the living knowledge base for $${STATE_CONTRIBUTION_USD} in Hive credits.`;
}
