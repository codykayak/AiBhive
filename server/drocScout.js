/**
 * DROC scout — find good dig places when the user has no start URL.
 * Builds paste-ready archive search URLs from a plain-English query
 * (architect name, deity, place, keyword, etc.).
 *
 * Also rewrites catalog *homepages* (e.g. cdli.earth) into keyword search
 * result URLs so harvest does not crawl empty nav chrome.
 */
import { runChat, extractJson } from './fableScrapeProviders.js';
import { getTartarianDigPacks, shouldInjectTartarianFinds } from './tartarianFindsDirectory.js';

function enc(s) {
  return encodeURIComponent(String(s || '').trim());
}

function clipQuery(q, max = 80) {
  return String(q || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

const STOP = new Set(
  'a an the and or but for with from that this these those find me five get show return please want wanna into onto about which who what when where why how not been have has had was were are is be been being of to in on at by as it its they them their you your we our would could should think high value content that have not been translated'.split(
    /\s+/,
  ),
);

/**
 * Pull search keywords from a research prompt (keeps proper nouns / domain terms).
 */
export function extractSearchKeywords(prompt, { maxTerms = 6 } = {}) {
  const raw = String(prompt || '');
  const preferred = [];
  const bump = (term) => {
    const t = term.trim();
    if (!t) return;
    const low = t.toLowerCase();
    if (preferred.some((x) => {
      const y = x.toLowerCase();
      return y === low || y === `${low}s` || `${y}s` === low || y.replace(/s$/, '') === low.replace(/s$/, '');
    })) {
      return;
    }
    preferred.push(t);
  };

  // Domain phrases first
  if (/sumerian/i.test(raw)) bump('Sumerian');
  if (/akkadian/i.test(raw)) bump('Akkadian');
  if (/cuneiform/i.test(raw)) bump('cuneiform');
  if (/hieroglyph/i.test(raw)) bump('hieroglyph');
  if (/ur\s*iii/i.test(raw)) bump('Ur III');
  if (/tablet/i.test(raw)) bump('tablet');
  if (/tartar/i.test(raw)) bump('Tartar');
  if (/mud[\s-]?flood/i.test(raw)) bump('mud flood');
  if (/star\s*fort/i.test(raw)) bump('star fort');
  if (/orphan\s*train/i.test(raw)) bump('orphan train');

  const tokens = raw
    .replace(/[“”"']/g, '')
    .split(/[^A-Za-z0-9\-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP.has(t.toLowerCase()));

  for (const t of tokens) {
    if (/^[A-Z]/.test(t) || /cuneiform|tablet|translat|sumer|akkad|egypt|god|enlil|inanna/i.test(t)) {
      bump(t);
    }
    if (preferred.length >= maxTerms) break;
  }
  if (!preferred.length) {
    for (const t of tokens) {
      bump(t);
      if (preferred.length >= Math.min(3, maxTerms)) break;
    }
  }
  return preferred.slice(0, maxTerms).join(' ') || clipQuery(raw, 40);
}

/**
 * If the user pasted a catalog homepage, rewrite to a keyword search-results URL.
 */
export function resolveArchiveStartUrl(url, prompt = '') {
  let parsed;
  try {
    parsed = new URL(String(url || '').trim());
  } catch {
    return { url: String(url || ''), rewritten: false };
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  const path = (parsed.pathname || '/').replace(/\/+$/, '') || '/';
  const bareHub =
    path === '/' ||
    path === '' ||
    ['/home', '/browse', '/about', '/index', '/index.html'].includes(path.toLowerCase());
  const emptySearch = path.toLowerCase() === '/search' && !parsed.search;
  const q = extractSearchKeywords(prompt);

  // CDLI — homepage has zero tablet photos; search results have /dl/tn_photo/P######.jpg
  if (/(^|\.)cdli\.(earth|org|ucla\.edu)$/i.test(host) || host === 'cdli.ucla.edu') {
    if (bareHub || emptySearch) {
      const next = `https://cdli.earth/search?q=${enc(q || 'Sumerian')}`;
      return {
        url: next,
        rewritten: true,
        reason:
          'CDLI homepage / empty search has no tablet results — switched to a keyword search-results URL (where thumbnail scans live).',
        autoCrawl: true,
        hub: 'cdli',
      };
    }
  }

  if (host === 'archive.org' && bareHub) {
    return {
      url: `https://archive.org/search?query=${enc(q)}&and[]=year%3A%5B1700+TO+1950%5D`,
      rewritten: true,
      reason: 'Archive.org homepage rewritten to a catalog search for your keywords.',
      autoCrawl: true,
      hub: 'archive.org',
    };
  }

  if (/chroniclingamerica\.loc\.gov$/i.test(host) && (bareHub || path === '/search')) {
    return {
      url: `https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=${enc(q)}&date1=1836&date2=1922&rows=20&searchType=basic`,
      rewritten: true,
      reason: 'Chronicling America homepage rewritten to a newspaper search-results URL.',
      autoCrawl: true,
      hub: 'chroniclingamerica',
    };
  }

  if (host === 'davidrumsey.com' && bareHub) {
    return {
      url: `https://www.davidrumsey.com/luna/servlet/view/search?q=${enc(q)}`,
      rewritten: true,
      reason: 'David Rumsey homepage rewritten to a map search.',
      autoCrawl: true,
      hub: 'rumsey',
    };
  }

  if (host === 'loc.gov' && bareHub) {
    return {
      url: `https://www.loc.gov/search/?q=${enc(q)}&fa=online-format:image`,
      rewritten: true,
      reason: 'Library of Congress homepage rewritten to an image search.',
      autoCrawl: true,
      hub: 'loc',
    };
  }

  return { url: parsed.toString(), rewritten: false };
}

/**
 * Score image candidates that look like primary-source tablet/scan photos.
 */
export function scorePrimarySourceImage(candidate = {}) {
  const s = `${candidate.url || ''} ${candidate.filename || ''} ${candidate.alt || ''}`.toLowerCase();
  let score = 0;
  if (/\/dl\/(tn_)?photo\/|\/dl\/tn_lineart\/|\/dl\/photo\//i.test(s)) score += 12;
  if (/\bp\d{5,}\b/i.test(s)) score += 8;
  if (/cuneiform|tablet|artifact|manuscript|scan|plate|recto|verso|obverse|reverse/i.test(s)) score += 5;
  if (/tn_photo|lineart/i.test(s)) score += 4;
  if (candidate.iconLikely) score -= 20;
  if (/(logo|favicon|sprite|icon|avatar|arrow\d)/i.test(s)) score -= 15;
  return score;
}

/**
 * Deterministic hub URLs for any research query.
 */
export function buildHubDigs(query) {
  const q = clipQuery(query, 100);
  if (!q) return [];
  const qPlus = q.replace(/\s+/g, '+');
  const qEnc = enc(q);
  const kw = extractSearchKeywords(query) || q;
  const kwEnc = enc(kw);

  const digs = [
    {
      id: 'cdli-sumerian',
      title: 'CDLI tablet search (cuneiform)',
      hub: 'cdli.earth',
      probability: 'High',
      why: 'Cuneiform Digital Library — search results include tablet photo thumbnails (/dl/tn_photo/).',
      url: `https://cdli.earth/search?q=${kwEnc}`,
      fableHint: 'Never start at cdli.earth homepage. Crawl on · pages 8–12 · depth 1 into /artifacts/N · findings 3–5.',
    },
    {
      id: 'archive-org',
      title: 'Internet Archive catalog dig',
      hub: 'archive.org',
      probability: 'High',
      why: 'Books, plates, and public-domain photo albums matching your terms.',
      url: `https://archive.org/search?query=${qEnc}&and[]=year%3A%5B1700+TO+1950%5D`,
      fableHint: 'Crawl on · pages 8–12 · findings 2–4 · image OCR when plates appear.',
    },
    {
      id: 'chronicling-america',
      title: 'Chronicling America newspaper dig',
      hub: 'chroniclingamerica.loc.gov',
      probability: 'High',
      why: 'U.S. newspaper pages (to ~1922) — great for names, places, and period language.',
      url: `https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=${qEnc}&date1=1836&date2=1922&rows=20&searchType=basic`,
      fableHint: 'Use this search-results URL (not the homepage). Crawl 8–12 · findings 2–4 · text-corpus OK.',
    },
    {
      id: 'loc-photos-maps',
      title: 'Library of Congress photos & maps',
      hub: 'loc.gov',
      probability: 'High',
      why: 'High-res scans, Sanborn maps, and captioned photographs.',
      url: `https://www.loc.gov/search/?q=${qEnc}&fa=online-format:image`,
      fableHint: 'Prefer result pages with thumbnails · image harvest · OCR captions selectively.',
    },
    {
      id: 'david-rumsey',
      title: 'David Rumsey Map Collection',
      hub: 'davidrumsey.com',
      probability: 'Medium–High',
      why: 'Historic maps, bird’s-eye views, and fort/city plans.',
      url: `https://www.davidrumsey.com/luna/servlet/view/search?q=${qEnc}`,
      fableHint: 'Image-heavy grid · harvest thumbnails · OCR map titles/legends.',
    },
    {
      id: 'wikimedia-commons',
      title: 'Wikimedia Commons media dig',
      hub: 'commons.wikimedia.org',
      probability: 'Medium',
      why: 'Public-domain plates and manuscript photos with structured metadata.',
      url: `https://commons.wikimedia.org/w/index.php?search=${qEnc}&title=Special:MediaSearch&type=image`,
      fableHint: 'Good for inspectable plates · pick 2–4 primary-source scans for OCR.',
    },
    {
      id: 'archive-text',
      title: 'Internet Archive full-text probe',
      hub: 'archive.org',
      probability: 'Medium',
      why: 'Broader text search when you need quotes and chapter hits.',
      url: `https://archive.org/search?query=${qEnc}&and[]=mediatype%3Atexts`,
      fableHint: 'Crawl into item pages · text-corpus harvest when few images.',
    },
    {
      id: 'chron-am-phrase',
      title: 'Chronicling America exact-ish phrase',
      hub: 'chroniclingamerica.loc.gov',
      probability: 'Medium',
      why: 'Tighter newspaper probe when the name/phrase is distinctive.',
      url: `https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=%22${qEnc}%22&date1=1850&date2=1922&rows=20&searchType=basic`,
      fableHint: 'If 0 hits, fall back to the unquoted Chron Am dig.',
    },
  ];

  // Promote CDLI when the query is clearly about cuneiform / Sumerian / tablets
  if (/cuneiform|sumer|akkad|tablet|cdli|enlil|inanna|uruk|ur\s*iii/i.test(query)) {
    return digs.map((d) => ({ ...d, query: q, qPlus }));
  }
  // Otherwise put CDLI after general hubs
  const [cdli, ...rest] = digs;
  return [...rest.slice(0, 2), cdli, ...rest.slice(2)].map((d) => ({ ...d, query: q, qPlus }));
}

/**
 * Merge Tartarian dig-pack URLs when the query matches that domain.
 */
function tartarianPackHints(query) {
  if (!shouldInjectTartarianFinds(query)) return [];
  const packs = getTartarianDigPacks();
  const out = [];
  for (const pack of packs.slice(0, 4)) {
    const url = pack.urls?.[0];
    if (!url) continue;
    out.push({
      id: `pack-${pack.id}`,
      title: pack.title,
      hub: 'dig-pack',
      probability: 'High',
      why: pack.preview || 'Curated Tartarian / Old World starter dig.',
      url,
      fableHint: 'Paste-ready from AiBhive dig directory · findings 2–4.',
      query: clipQuery(query),
    });
  }
  return out;
}

/**
 * Rank / refine digs with the Director when available; always returns ≥3 hubs.
 */
export async function scoutDigPlaces({
  query,
  count = 3,
  roles = {},
  keys = {},
  useDirector = true,
} = {}) {
  const q = clipQuery(query, 200);
  if (!q) throw new Error('Describe what you want to find (a name, place, deity, keyword…).');

  const wanted = Math.max(3, Math.min(Number(count) || 3, 6));
  const hubs = buildHubDigs(q);
  const packHints = tartarianPackHints(q);
  const pool = [...packHints, ...hubs];

  let ranked = pool.slice(0, wanted);
  let strategy = `Template scout for “${q}” — Archive.org, Chronicling America, LOC, Rumsey.`;

  if (useDirector) {
    try {
      const catalog = pool
        .slice(0, 10)
        .map((d, i) => `${i}. [${d.hub}] ${d.title} — ${d.url}`)
        .join('\n');
      const provider = roles?.director?.provider || 'grok';
      const model = roles?.director?.model || '';
      const raw = await runChat({
        provider,
        model,
        byok: keys,
        system:
          'You are DROC, a research scout director. Pick the best dig sites for a lay researcher. Respond with strict JSON only.',
        prompt:
          `Researcher query:\n"""${q}"""\n\nCandidate dig sites:\n${catalog}\n\n` +
          `Pick the best ${wanted} sites for finding detailed primary sources (newspapers, maps, plates, catalogs). ` +
          `Return JSON: {"strategy":"one sentence","picks":[{"index":0,"probability":"High|Medium|Speculative","why":"short reason"}]}.`,
        json: true,
        maxTokens: 900,
      });
      const parsed = extractJson(raw) || {};
      strategy = String(parsed.strategy || strategy).slice(0, 400);
      const picks = Array.isArray(parsed.picks) ? parsed.picks : [];
      const chosen = picks
        .map((p) => ({ ...p, index: Number(p.index) }))
        .filter((p) => Number.isInteger(p.index) && p.index >= 0 && p.index < pool.length)
        .slice(0, wanted);
      if (chosen.length) {
        ranked = chosen.map((p) => ({
          ...pool[p.index],
          probability: String(p.probability || pool[p.index].probability).slice(0, 24),
          why: String(p.why || pool[p.index].why).slice(0, 280),
        }));
      }
    } catch {
      // Template ranking is fine if director is unavailable
    }
  }

  // Ensure unique URLs and pad to wanted
  const seen = new Set();
  const digs = [];
  for (const d of [...ranked, ...pool]) {
    if (seen.has(d.url)) continue;
    seen.add(d.url);
    digs.push(d);
    if (digs.length >= wanted) break;
  }

  return {
    ok: true,
    query: q,
    strategy,
    digs,
    hint: 'Pick a dig (A/B/C) or run AI Harvest without a URL — DROC will start at the top dig.',
  };
}

/**
 * Pick a single best start URL for auto-harvest when user left URL blank.
 */
export async function resolveStartUrlFromQuery(params) {
  const scout = await scoutDigPlaces({ ...params, count: 3, useDirector: true });
  const top = scout.digs[0];
  if (!top?.url) throw new Error('DROC could not find a dig site for that query.');
  return { url: top.url, scout };
}
