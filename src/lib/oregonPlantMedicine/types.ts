export type PlantRegion =
  | 'or-willamette'
  | 'or-coast'
  | 'or-portland'
  | 'or-cascades'
  | 'or-klamath'
  | 'or-rogue'
  | 'or-east'
  | 'ca-sierra-foothills'
  | 'ca-silver-lake'
  | 'ca-sacramento'
  | 'ca-shasta'
  | 'ca-north-coast'
  | 'wa-puget-sound'
  | 'wa-olympic-coast'
  | 'wa-cascades'
  | 'wa-eastern'
  /** @deprecated use or-willamette */
  | 'eugene'
  /** @deprecated use or-coast */
  | 'florence'
  /** @deprecated valley + coast OR */
  | 'both';

export type PlantUse = 'edible' | 'medicinal' | 'both' | 'hallucinogenic';

export type PlantImage = {
  url: string;
  credit: string;
  caption?: string;
};

export type PlantCategory =
  | 'herb'
  | 'shrub'
  | 'tree'
  | 'berry'
  | 'fern'
  | 'mushroom'
  | 'lichen'
  | 'seaweed';

export type ExternalLink = {
  label: string;
  url: string;
  description?: string;
};

export type PlantEntry = {
  id: string;
  commonName: string;
  scientificName: string;
  alsoKnownAs?: string[];
  uses: PlantUse;
  category: PlantCategory;
  regions: PlantRegion[];
  habitat: string;
  identification: string;
  /** Toxic or confusing species — especially important on edible entries */
  lookalikes?: string[];
  edibleNotes?: string;
  medicinalNotes?: string;
  holisticNotes?: string;
  preparation?: string;
  harvestSeason: string;
  safetyWarnings: string[];
  imageUrl: string;
  imageCredit: string;
  /** At least two extra ID photos (habitat, fruit, detail, etc.) */
  additionalImages: PlantImage[];
  externalLinks: ExternalLink[];
};

export type ResourceCategory = {
  id: string;
  title: string;
  description: string;
  links: ExternalLink[];
};
