import { ANIMAL_HEALTH_LIBRARY } from './animalHealthLibrary';
import { FEATURED_ESSAYS } from './featuredEssays';
import { HERBS_LIBRARY } from './herbsLibrary';
import { HOLISTIC_LIBRARY } from './holisticLibrary';
import { HYPNOSIS_ENERGY_LIBRARY } from './hypnosisEnergyLibrary';
import { PLANT_LIBRARY } from './plantLibrary';
import { SUPPLEMENTS_LIBRARY } from './supplementsLibrary';
import { IRIDOLOGY_LIBRARY } from './iridologyLibrary';

export type SiteSearchResultKind =
  | 'plant'
  | 'holistic'
  | 'hypnosis'
  | 'animal-health'
  | 'herbs'
  | 'supplements'
  | 'iridology'
  | 'essay'
  | 'tab';

export type SiteSearchResult = {
  id: string;
  kind: SiteSearchResultKind;
  title: string;
  subtitle: string;
  tab: 'plants' | 'holistic' | 'hypnosis' | 'animal-health' | 'herbs' | 'supplements' | 'iridology' | 'community' | 'home';
  haystack: string;
};

function topicHay(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(' ');
}

function safeApproaches(approaches?: string[]): string[] {
  return Array.isArray(approaches) ? approaches : [];
}

function plantHay(p: (typeof PLANT_LIBRARY)[number]) {
  return [
    p.commonName,
    p.scientificName,
    ...(p.alsoKnownAs ?? []),
    p.habitat,
    p.identification,
    p.edibleNotes,
    p.medicinalNotes,
    p.holisticNotes,
    p.preparation,
    ...(p.lookalikes ?? []),
    ...(p.safetyWarnings ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

/** Client-side index of Living Knowledge library content. */
export function buildSiteSearchIndex(): SiteSearchResult[] {
  const results: SiteSearchResult[] = [];

  for (const p of PLANT_LIBRARY) {
    results.push({
      id: p.id,
      kind: 'plant',
      title: p.commonName,
      subtitle: p.scientificName,
      tab: 'plants',
      haystack: plantHay(p),
    });
  }

  for (const t of HOLISTIC_LIBRARY) {
    if (!t.id || !t.title) continue;
    results.push({
      id: t.id,
      kind: 'holistic',
      title: t.title,
      subtitle: 'Holistic protocols',
      tab: 'holistic',
      haystack: topicHay([t.title, t.summary, t.deepDive, t.whenPeopleExplore, ...safeApproaches(t.approaches)]),
    });
  }

  for (const t of HYPNOSIS_ENERGY_LIBRARY) {
    if (!t.id || !t.title) continue;
    results.push({
      id: t.id,
      kind: 'hypnosis',
      title: t.title,
      subtitle: 'Hypnosis & energy',
      tab: 'hypnosis',
      haystack: topicHay([t.title, t.summary, t.whenPeopleExplore, ...safeApproaches(t.approaches), t.deepDive]),
    });
  }

  for (const t of ANIMAL_HEALTH_LIBRARY) {
    if (!t.id || !t.title) continue;
    results.push({
      id: t.id,
      kind: 'animal-health',
      title: t.title,
      subtitle: 'Animal health',
      tab: 'animal-health',
      haystack: topicHay([t.title, t.summary, t.whenPeopleExplore, ...safeApproaches(t.approaches), t.deepDive]),
    });
  }

  for (const t of HERBS_LIBRARY) {
    if (!t.id || !t.title) continue;
    results.push({
      id: t.id,
      kind: 'herbs',
      title: t.title,
      subtitle: 'Herbs',
      tab: 'herbs',
      haystack: topicHay([t.title, t.summary, t.deepDive, t.whenPeopleExplore, ...safeApproaches(t.approaches)]),
    });
  }

  for (const t of SUPPLEMENTS_LIBRARY) {
    if (!t.id || !t.title) continue;
    results.push({
      id: t.id,
      kind: 'supplements',
      title: t.title,
      subtitle: 'Supplements',
      tab: 'supplements',
      haystack: topicHay([t.title, t.summary, t.deepDive, t.whenPeopleExplore, ...safeApproaches(t.approaches)]),
    });
  }

  for (const t of IRIDOLOGY_LIBRARY) {
    if (!t.id || !t.title) continue;
    results.push({
      id: t.id,
      kind: 'iridology',
      title: t.title,
      subtitle: 'AI Iridology',
      tab: 'iridology',
      haystack: topicHay([t.title, t.summary, t.deepDive, t.whenPeopleExplore, ...safeApproaches(t.approaches)]),
    });
  }

  for (const e of FEATURED_ESSAYS) {
    if (!e.id || !e.title) continue;
    results.push({
      id: e.id,
      kind: 'essay',
      title: e.title,
      subtitle: e.categoryLabel,
      tab:
        e.page === 'holistic'
          ? 'holistic'
          : e.page === 'hypnosis'
            ? 'hypnosis'
            : e.page === 'edibles' || e.page === 'plants-home'
              ? 'plants'
              : 'home',
      haystack: topicHay([e.title, e.summary, e.deepDive, e.whenPeopleExplore, ...safeApproaches(e.approaches)]),
    });
  }

  return results;
}

let siteSearchIndexCache: SiteSearchResult[] | null = null;

function getSiteSearchIndex(): SiteSearchResult[] {
  if (!siteSearchIndexCache) siteSearchIndexCache = buildSiteSearchIndex();
  return siteSearchIndexCache;
}

export function searchSite(query: string, limit = 12): SiteSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const index = getSiteSearchIndex();
  const scored = index
    .map((item) => {
      const hay = (item.haystack || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      let score = 0;
      if (title.includes(q)) score += 10;
      if (hay.includes(q)) score += 5;
      const words = q.split(/\s+/).filter(Boolean);
      for (const w of words) {
        if (title.includes(w)) score += 3;
        if (hay.includes(w)) score += 1;
      }
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.item);
}
