import { PLANT_LIBRARY } from './plantLibrary';
import type { PlantEntry, PlantImage } from './types';
import type { PlantPhotoIdCandidate } from './plantMedicineApi';

export type PlantIdVisual = PlantPhotoIdCandidate & {
  imageUrl: string | null;
  imageCredit: string | null;
  additionalImages: PlantImage[];
  plant: PlantEntry | null;
};

function findPlant(plantId: string | null | undefined, commonName?: string, scientificName?: string): PlantEntry | null {
  if (plantId) {
    const byId = PLANT_LIBRARY.find((p) => p.id === plantId);
    if (byId) return byId;
  }
  const sci = (scientificName || '').toLowerCase().trim();
  const common = (commonName || '').toLowerCase().trim();
  if (sci) {
    const exact = PLANT_LIBRARY.find((p) => p.scientificName.toLowerCase() === sci);
    if (exact) return exact;
  }
  if (common) {
    const exact = PLANT_LIBRARY.find((p) => p.commonName.toLowerCase() === common);
    if (exact) return exact;
    const aka = PLANT_LIBRARY.find((p) => (p.alsoKnownAs || []).some((a) => a.toLowerCase() === common));
    if (aka) return aka;
  }
  return null;
}

export function enrichPlantIdVisual(row: PlantPhotoIdCandidate): PlantIdVisual {
  const plant = findPlant(row.plantId, row.commonName, row.scientificName);
  return {
    ...row,
    plantId: plant?.id || row.plantId,
    imageUrl: plant?.imageUrl || null,
    imageCredit: plant?.imageCredit || null,
    additionalImages: plant?.additionalImages || [],
    plant,
  };
}

export function enrichPlantPhotoIdResult(opts: {
  candidates: PlantPhotoIdCandidate[];
  dangerousLookalikes: PlantPhotoIdCandidate[];
}): { candidates: PlantIdVisual[]; dangerousLookalikes: PlantIdVisual[] } {
  return {
    candidates: opts.candidates.map(enrichPlantIdVisual),
    dangerousLookalikes: opts.dangerousLookalikes.map(enrichPlantIdVisual),
  };
}
