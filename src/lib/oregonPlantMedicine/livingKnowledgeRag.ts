/**
 * Client-side Living Knowledge RAG — works offline and without Hive credits.
 * Indexes plants, research topics, and featured essays for instant retrieval.
 */
import { ANIMAL_HEALTH_LIBRARY } from './animalHealthLibrary';
import { FEATURED_ESSAYS } from './featuredEssays';
import { HOLISTIC_LIBRARY } from './holisticLibrary';
import { HYPNOSIS_ENERGY_LIBRARY } from './hypnosisEnergyLibrary';
import { PLANT_LIBRARY } from './plantLibrary';

export type LivingKnowledgeScope =
  | 'all'
  | 'plants'
  | 'edibles'
  | 'holistic'
  | 'hypnosis'
  | 'animal-health';

export type LivingKnowledgeDocKind = 'plant' | 'topic' | 'essay';

export type LivingKnowledgeDoc = {
  id: string;
  kind: LivingKnowledgeDocKind;
  library: LivingKnowledgeScope;
  title: string;
  subtitle?: string;
  summary: string;
  body: string;
  safety: string[];
  tags: string[];
  /** Open plant detail or research topic */
  plantId?: string;
  topicId?: string;
  topicLibrary?: 'holistic' | 'hypnosis' | 'animal-health';
};

export type LivingKnowledgeHit = LivingKnowledgeDoc & {
  score: number;
  matchedTerms: string[];
};

export type LivingKnowledgeAnswer = {
  query: string;
  documented: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  answer: string;
  hits: LivingKnowledgeHit[];
  contributeSuggested: boolean;
  livingKnowledgeNote: string;
};

const STOP = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'is',
  'are',
  'was',
  'were',
  'be',
  'how',
  'what',
  'when',
  'where',
  'why',
  'who',
  'does',
  'do',
  'can',
  'i',
  'my',
  'me',
  'about',
  'from',
  'this',
  'that',
  'it',
  'as',
  'at',
  'by',
  'into',
  'any',
]);

let cachedIndex: LivingKnowledgeDoc[] | null = null;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function buildIndex(): LivingKnowledgeDoc[] {
  if (cachedIndex) return cachedIndex;

  const docs: LivingKnowledgeDoc[] = [];

  for (const p of PLANT_LIBRARY) {
    const isEdible = p.uses === 'edible' || p.uses === 'both' || p.category === 'mushroom';
    docs.push({
      id: `plant:${p.id}`,
      kind: 'plant',
      library: isEdible ? 'edibles' : 'plants',
      title: p.commonName,
      subtitle: p.scientificName,
      summary: [p.holisticNotes, p.medicinalNotes, p.edibleNotes].filter(Boolean).join(' ').slice(0, 280),
      body: [
        p.habitat,
        p.identification,
        p.edibleNotes,
        p.medicinalNotes,
        p.holisticNotes,
        p.preparation,
        p.harvestSeason,
        ...(p.lookalikes ?? []),
        ...(p.alsoKnownAs ?? []),
      ]
        .filter(Boolean)
        .join('\n'),
      safety: p.safetyWarnings ?? [],
      tags: [p.category, p.uses, ...(p.alsoKnownAs ?? []), p.scientificName],
      plantId: p.id,
    });
  }

  for (const t of HOLISTIC_LIBRARY) {
    docs.push({
      id: `holistic:${t.id}`,
      kind: 'topic',
      library: 'holistic',
      title: t.title,
      subtitle: t.category,
      summary: t.summary,
      body: [t.summary, t.whenPeopleExplore, ...(t.approaches ?? [])].join('\n'),
      safety: t.safetyWarnings ?? [],
      tags: [t.category, ...t.relatedPlantIds],
      topicId: t.id,
      topicLibrary: 'holistic',
    });
  }

  for (const t of HYPNOSIS_ENERGY_LIBRARY) {
    docs.push({
      id: `hypnosis:${t.id}`,
      kind: 'topic',
      library: 'hypnosis',
      title: t.title,
      subtitle: t.category,
      summary: t.summary,
      body: [t.summary, t.deepDive, t.whenPeopleExplore, ...(t.approaches ?? [])].join('\n'),
      safety: t.safetyWarnings ?? [],
      tags: [t.category, ...t.relatedPlantIds],
      topicId: t.id,
      topicLibrary: 'hypnosis',
    });
  }

  for (const t of ANIMAL_HEALTH_LIBRARY) {
    docs.push({
      id: `animal:${t.id}`,
      kind: 'topic',
      library: 'animal-health',
      title: t.title,
      subtitle: t.category,
      summary: t.summary,
      body: [t.summary, t.deepDive, t.whenPeopleExplore, ...(t.approaches ?? [])].join('\n'),
      safety: t.safetyWarnings ?? [],
      tags: [t.category, ...t.relatedPlantIds],
      topicId: t.id,
      topicLibrary: 'animal-health',
    });
  }

  for (const e of FEATURED_ESSAYS) {
    const library: LivingKnowledgeScope =
      e.page === 'plants-home'
        ? 'plants'
        : e.page === 'edibles'
          ? 'edibles'
          : e.page === 'holistic'
            ? 'holistic'
            : 'hypnosis';
    docs.push({
      id: `essay:${e.id}`,
      kind: 'essay',
      library,
      title: e.title,
      subtitle: e.categoryLabel,
      summary: e.summary,
      body: [e.summary, e.deepDive, e.whenPeopleExplore, ...(e.approaches ?? [])].join('\n'),
      safety: e.safetyWarnings ?? [],
      tags: [e.categoryLabel, ...e.relatedPlantIds],
    });
  }

  cachedIndex = docs;
  return docs;
}

function scopeMatch(doc: LivingKnowledgeDoc, scope: LivingKnowledgeScope): boolean {
  if (scope === 'all') return true;
  if (scope === 'plants') return doc.library === 'plants' || doc.library === 'edibles' || doc.kind === 'plant';
  if (scope === 'edibles') {
    return (
      doc.library === 'edibles' ||
      (doc.kind === 'plant' &&
        (doc.tags.includes('edible') ||
          doc.tags.includes('both') ||
          doc.tags.includes('mushroom') ||
          /mushroom|berry|edible|mycelium|forage/i.test(`${doc.title} ${doc.body}`)))
    );
  }
  return doc.library === scope;
}

function scoreDoc(doc: LivingKnowledgeDoc, tokens: string[], rawQuery: string): { score: number; matched: string[] } {
  const q = rawQuery.toLowerCase().trim();
  const title = doc.title.toLowerCase();
  const subtitle = (doc.subtitle ?? '').toLowerCase();
  const hay = `${title} ${subtitle} ${doc.summary} ${doc.body} ${doc.tags.join(' ')}`.toLowerCase();
  let score = 0;
  const matched: string[] = [];

  if (q && title.includes(q)) {
    score += 40;
    matched.push(doc.title);
  } else if (q && subtitle.includes(q)) {
    score += 28;
    matched.push(doc.subtitle ?? '');
  }

  for (const t of tokens) {
    if (title.split(/\s+/).includes(t) || title.includes(t)) {
      score += 12;
      matched.push(t);
    } else if (subtitle.includes(t)) {
      score += 8;
      matched.push(t);
    } else if (hay.includes(t)) {
      score += 3;
      matched.push(t);
    }
  }

  // Phrase bonus
  if (q.length > 4 && hay.includes(q)) score += 10;

  return { score, matched: [...new Set(matched.filter(Boolean))] };
}

export function suggestLivingKnowledgeTerms(
  query: string,
  scope: LivingKnowledgeScope = 'all',
  limit = 8,
): LivingKnowledgeHit[] {
  const q = query.trim();
  const tokens = tokenize(q);
  const docs = buildIndex().filter((d) => scopeMatch(d, scope));

  if (!q) {
    return docs.slice(0, limit).map((d) => ({ ...d, score: 0, matchedTerms: [] }));
  }

  return docs
    .map((d) => {
      const { score, matched } = scoreDoc(d, tokens, q);
      return { ...d, score, matchedTerms: matched };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function extractSnippets(body: string, tokens: string[], maxLen = 220): string {
  const paragraphs = body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40);
  if (!paragraphs.length) return body.slice(0, maxLen);

  let best = paragraphs[0];
  let bestScore = -1;
  for (const p of paragraphs) {
    const lower = p.toLowerCase();
    const s = tokens.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return best.length > maxLen ? `${best.slice(0, maxLen).trim()}…` : best;
}

export function answerLivingKnowledgeQuery(
  query: string,
  scope: LivingKnowledgeScope = 'all',
): LivingKnowledgeAnswer {
  const trimmed = query.trim();
  const tokens = tokenize(trimmed);
  const hits = suggestLivingKnowledgeTerms(trimmed, scope, 5);
  const top = hits[0];
  const livingKnowledgeNote =
    'Every documented answer comes from the Living Knowledge library. When something is missing, your contribution expands the archive for everyone.';

  if (!trimmed) {
    return {
      query: trimmed,
      documented: false,
      confidence: 'none',
      answer: 'Ask about a plant, protocol, hypnosis topic, or edible mushroom in the library.',
      hits: [],
      contributeSuggested: false,
      livingKnowledgeNote,
    };
  }

  if (!top || top.score < 6) {
    return {
      query: trimmed,
      documented: false,
      confidence: 'none',
      answer: `I don’t yet have a Living Knowledge entry that clearly covers “${trimmed}.” You can contribute research so this answer becomes part of the shared library — spreading the wealth of living knowledge for the whole community.`,
      hits: hits.filter((h) => h.score > 0).slice(0, 3),
      contributeSuggested: true,
      livingKnowledgeNote,
    };
  }

  const confidence: LivingKnowledgeAnswer['confidence'] =
    top.score >= 30 ? 'high' : top.score >= 14 ? 'medium' : 'low';
  const contributeSuggested = confidence === 'low' || hits.length < 2;

  const lines: string[] = [];
  lines.push(`**${top.title}**${top.subtitle ? ` — ${top.subtitle}` : ''}`);
  lines.push('');
  lines.push(top.summary || extractSnippets(top.body, tokens));
  const snippet = extractSnippets(top.body, tokens);
  if (snippet && snippet !== top.summary) {
    lines.push('');
    lines.push(snippet);
  }
  if (top.safety.length) {
    lines.push('');
    lines.push(`Safety: ${top.safety.slice(0, 2).join(' · ')}`);
  }
  if (hits.length > 1) {
    lines.push('');
    lines.push(`Also in the library: ${hits.slice(1, 4).map((h) => h.title).join('; ')}.`);
  }
  if (contributeSuggested) {
    lines.push('');
    lines.push(
      'Partial match — if this doesn’t fully answer you, contribute research and grow the Living Knowledge archive.',
    );
  }
  lines.push('');
  lines.push('_Educational reference only — not medical, veterinary, or therapeutic advice._');

  return {
    query: trimmed,
    documented: true,
    confidence,
    answer: lines.join('\n'),
    hits,
    contributeSuggested,
    livingKnowledgeNote,
  };
}

/** Compact context blocks for optional online Bhive Credits enhancement. */
export function buildLivingKnowledgeContextBlocks(hits: LivingKnowledgeHit[], maxChars = 9000): string {
  let out = '';
  for (const h of hits.slice(0, 4)) {
    const block = [
      `### ${h.title}${h.subtitle ? ` (${h.subtitle})` : ''}`,
      `Kind: ${h.kind} · Library: ${h.library}`,
      h.summary,
      h.body.slice(0, 1200),
      h.safety.length ? `Safety: ${h.safety.join(' | ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    if (out.length + block.length > maxChars) break;
    out += `${block}\n\n`;
  }
  return out.trim();
}

const CONTRIBUTE_SEEDS_KEY = 'living_knowledge_contribute_seeds_v1';

export function rememberContributeSeed(query: string, scope: LivingKnowledgeScope) {
  const q = query.trim();
  if (!q) return;
  try {
    const raw = localStorage.getItem(CONTRIBUTE_SEEDS_KEY);
    const prev = raw ? (JSON.parse(raw) as Array<{ query: string; scope: string; at: string }>) : [];
    const next = [{ query: q, scope, at: new Date().toISOString() }, ...prev.filter((s) => s.query !== q)].slice(
      0,
      40,
    );
    localStorage.setItem(CONTRIBUTE_SEEDS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Diagnose-style: greetings / empty asks get a clarifying probe (short species names are NOT vague). */
export function isVagueLivingKnowledgeAsk(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (t.length <= 2) return true;
  if (/^(hi|hey|hello|help|yo|sup|thanks|thank you|ok|okay|test|hola)[!.?\s]*$/.test(t)) return true;
  if (/^(good morning|good afternoon|what'?s up|how are you)[!.?\s]*$/.test(t)) return true;
  if (/^(what can you do|who are you|help me|how do you work)[!.?\s]*$/.test(t)) return true;
  return false;
}

export function looksLikeLivingKnowledgeClarifier(reply: string): boolean {
  const t = reply.trim();
  if (!t.includes('?')) return false;
  return /could you|which |what (are you|kind|type|part|outcome)|are you (looking|asking|exploring)|tell me (a bit|more)|before I|clarify|name the|habitat|symptom|species/i.test(
    t,
  );
}

export function buildLivingKnowledgeClarifier(scope: LivingKnowledgeScope, text: string): string {
  const probes: Record<LivingKnowledgeScope, string> = {
    all: 'Happy to help. What are you looking for — a wild plant/mushroom ID, a holistic protocol, hypnosis/energy topic, or animal wellness research? Name the species or symptom if you can.',
    plants:
      'I can help from the plant library. Which species (common or Latin name), or describe the leaf/flower/habitat and your region (e.g. Willamette Valley vs coast)?',
    edibles:
      'For edibles & fungi: are you asking about a wild food ID, harvest season, look-alikes, or cultivated mycelium/meat alternatives? Name the plant or mushroom if you know it.',
    holistic:
      'For holistic protocols: what are you exploring — detox, digestion, sleep/nervines, Cayce traditions, or something else? Any plants already in mind?',
    hypnosis:
      'For hypnosis & energy: past-life regression / QHHT, clinical hypnotherapy, Reiki/chakras, or sound frequencies? What outcome are you hoping to understand?',
    'animal-health':
      'For animal wellness: dog, cat, horse, or livestock? Gut, skin, anxiety, nutrition, or energy modalities — and is this educational research or an emergency (go to a vet for emergencies)?',
  };
  const base = probes[scope] || probes.all;
  if (/id|identify|look|mushroom|plant/i.test(text)) {
    return `${base}\n\nIf this is an ID question, also tell me: habitat (woods, dunes, yard), season, and any look-alike worries.`;
  }
  return base;
}

export function offlineLivingKnowledgeReply(
  query: string,
  scope: LivingKnowledgeScope,
  opts?: { priorUserTexts?: string[]; signedIn?: boolean },
): { reply: string; hits: LivingKnowledgeHit[]; contributeSuggested: boolean; isClarifier: boolean } {
  const prior = (opts?.priorUserTexts || []).filter(Boolean);
  const isFollowUp = prior.length > 0;

  if (!isFollowUp && isVagueLivingKnowledgeAsk(query)) {
    return {
      reply: buildLivingKnowledgeClarifier(scope, query),
      hits: [],
      contributeSuggested: false,
      isClarifier: true,
    };
  }

  // Blend prior turns so short clarifier answers ("yarrow", "QHHT") still retrieve.
  const searchQuery = isFollowUp ? `${prior.slice(-3).join(' ')} ${query}`.trim() : query;
  const local = answerLivingKnowledgeQuery(searchQuery, scope);
  if (!local.documented) {
    // First miss: ask one Diagnose-style clarifier before hard-pushing contribute.
    if (!isFollowUp) {
      return {
        reply: `${local.answer}\n\nTo help me search better: are you asking about a specific plant/fungus name, a body system (gut, sleep, skin), or a modality (Cayce, QHHT, Reiki)?`,
        hits: local.hits,
        contributeSuggested: true,
        isClarifier: true,
      };
    }
    return {
      reply: local.answer,
      hits: local.hits,
      contributeSuggested: true,
      isClarifier: false,
    };
  }

  const creditsNudge =
    opts?.signedIn === false
      ? '\n\n(Offline library — sign in online so Bhive Credits can ask clarifying follow-ups like Diagnose.)'
      : opts?.signedIn
        ? ''
        : '\n\n(Offline library answer — sign in online for Bhive Credits follow-ups.)';

  return {
    reply: `${local.answer}${creditsNudge}`,
    hits: local.hits,
    contributeSuggested: local.contributeSuggested,
    isClarifier: false,
  };
}
