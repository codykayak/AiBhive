export type PlantRegion = 'eugene' | 'florence' | 'both';

export type PlantUse = 'edible' | 'medicinal' | 'both';

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
  edibleNotes?: string;
  medicinalNotes?: string;
  holisticNotes?: string;
  preparation?: string;
  harvestSeason: string;
  safetyWarnings: string[];
  imageUrl: string;
  imageCredit: string;
  externalLinks: ExternalLink[];
};

export type ResourceCategory = {
  id: string;
  title: string;
  description: string;
  links: ExternalLink[];
};
