/**
 * Server-side Intel OSINT cloud tools — uses AiBhive env API keys.
 * Never proxies requests to google.com; SerpAPI/Firecrawl only.
 */
import { applyTokenMarkup } from './hivePlans.js';
import { markCostForUser } from './hiveUsage.js';
import { buildDiscoverySearchQueries } from './intelDiscoverySearch.js';
import { requireFirecrawlKey, requireSerpApiKey } from './intelCloudKeys.js';
import { firecrawlWebSearch, firecrawlScrapePage } from './intelFirecrawl.js';

function appendRegionalSuffix(baseQuery, params) {
  const restrict = params.restrictToRegion === '1' || params.restrictToRegion === true;
  const location = String(params.location || '').trim();
  if (!restrict || !location) return baseQuery.trim();
  const miles = Math.min(100, Math.max(30, parseInt(params.radiusMiles, 10) || 50));
  return `${baseQuery.trim()} near ${location} within ${miles} miles local regional`;
}

function buildCloudSearchQuery(params) {
  const company = params.company || params.label || '';
  const domain = params.domain || '';
  const userIntent = params.userIntent || '';
  const targetType = params.targetType || 'company';
  let base = '';

  if (targetType === 'discovery' || targetType === 'keyword') {
    const query = userIntent.trim() || company.trim();
    base = query || 'business research';
    return appendRegionalSuffix(base, params);
  }

  if (targetType === 'person') {
    base = userIntent.trim()
      ? `"${company}" ${userIntent} LinkedIn profile biography public records`
      : `"${company}" LinkedIn profile social media public biography contact`;
  } else if (targetType === 'domain') {
    const site = domain || company;
    base = userIntent.trim()
      ? `${site} ${userIntent} company about leadership technology`
      : `${site} company about leadership technology infrastructure contact`;
  } else {
    base = userIntent.trim()
      ? `"${company}" ${userIntent} leadership hiring news`
      : `"${company}" company leadership technology news contact email`;
  }

  return appendRegionalSuffix(base, params);
}

/** Raw API cost (before Hive credits). */
const SERP_RAW_USD = 0.02;
const FIRECRAWL_SEARCH_RAW_USD = 0.03;
const FIRECRAWL_SCRAPE_RAW_USD = 0.02;

export function intelToolRawCostUsd(toolId, opts = {}) {
  const discoveryQueries = opts.discoveryQueryCount ?? 1;
  switch (toolId) {
    case 'firecrawl_search':
      return opts.targetType === 'discovery'
        ? FIRECRAWL_SEARCH_RAW_USD * Math.min(discoveryQueries, 2)
        : FIRECRAWL_SEARCH_RAW_USD;
    case 'firecrawl_scrape':
      return FIRECRAWL_SCRAPE_RAW_USD;
    case 'serp_search':
      return opts.targetType === 'discovery'
        ? SERP_RAW_USD * Math.min(discoveryQueries, 5)
        : SERP_RAW_USD;
    default:
      return 0.02;
  }
}

/** @deprecated use intelToolRawCostUsd + applyTokenMarkup */
export function intelToolCostUsd(toolId) {
  return applyTokenMarkup(intelToolRawCostUsd(toolId));
}

function discoverySearchLocation(params) {
  return (
    String(params.region?.location || params.location || '').trim() ||
    String(params.userIntent || '').match(/\b(Orlando|Miami|Tampa|Jacksonville|Fort Lauderdale),\s*(Florida|FL)\b/i)?.[0] ||
    (/\b(florida|\bfl\b)\b/i.test(String(params.userIntent || '')) ? 'Florida,United States' : '')
  );
}

async function serpSearch(apiKey, query) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI failed (${res.status})`);
  const json = await res.json();
  const organic = json.organic_results ?? [];
  const lines = organic.slice(0, 10).map((r, i) => `[${i + 1}] ${r.title}\n${r.link}\n${r.snippet ?? ''}`);
  return {
    summary: `${lines.length} SerpAPI results (Hive Cloud)`,
    data: lines.join('\n\n') || 'No organic results.',
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {{ checkTokenBudget: Function, recordTokenUsage: Function }} usage
 */
export async function runIntelCloudTool(db, usage, opts) {
  const { userId, toolId, params = {} } = opts;
  const targetType = params.targetType || 'company';
  const discoveryQueries =
    targetType === 'discovery' ? buildDiscoverySearchQueries(params) : [];
  const rawCost = intelToolRawCostUsd(toolId, {
    targetType,
    discoveryQueryCount: discoveryQueries.length || 1,
  });
  const { markedUsd: markedUp } = await markCostForUser(db, userId, rawCost);

  const check = await usage.checkTokenBudget(db, userId, markedUp, 'hive_cloud_intel', {
    email: opts.email,
  });
  if (!check.ok) {
    return {
      ok: false,
      needPayment: true,
      needUpgrade: true,
      amountUsd: markedUp,
      rawCostUsd: rawCost,
      suggestedPlan: check.suggestedPlan ?? 'starter',
      budget: check.budget,
    };
  }

  const company = params.company || '';
  const domain = params.domain || '';
  const userIntent = params.userIntent || '';
  const targetUrl = params.url || (domain ? `https://${domain}` : '');
  const searchLocation = discoverySearchLocation(params);

  let result;
  try {
    switch (toolId) {
      case 'firecrawl_search': {
        const apiKey = requireFirecrawlKey();
        const searchOpts = { location: searchLocation, country: 'US' };
        if (targetType === 'discovery' && discoveryQueries.length) {
          const queries = discoveryQueries.slice(0, 3);
          const blocks = [];
          let total = 0;
          for (const q of queries) {
            const partial = await firecrawlWebSearch(apiKey, q, searchOpts);
            total += partial.count;
            blocks.push(`### Search: ${q}\n${partial.summary}\n\n${partial.data}`);
          }
          result = {
            summary: `${total} Firecrawl hits across ${queries.length} discovery queries`,
            data: blocks.join('\n\n---\n\n').slice(0, 18000),
          };
        } else {
          const query = buildCloudSearchQuery({ company, domain, userIntent, ...params });
          result = await firecrawlWebSearch(apiKey, query, searchOpts);
        }
        break;
      }
      case 'firecrawl_scrape': {
        const apiKey = requireFirecrawlKey();
        if (!targetUrl) throw new Error('URL required for scrape');
        result = await firecrawlScrapePage(apiKey, targetUrl);
        break;
      }
      case 'serp_search': {
        const apiKey = requireSerpApiKey();
        if (targetType === 'discovery' && discoveryQueries.length) {
          const blocks = [];
          let total = 0;
          for (const q of discoveryQueries) {
            const partial = await serpSearch(apiKey, q);
            const count = (partial.data.match(/^\[/gm) || []).length;
            total += count;
            blocks.push(`### Search: ${q}\n${partial.summary}\n\n${partial.data}`);
          }
          result = {
            summary: `${total} SerpAPI hits across ${discoveryQueries.length} discovery queries`,
            data: blocks.join('\n\n---\n\n').slice(0, 18000),
          };
        } else {
          const query = buildCloudSearchQuery({ company, domain, userIntent, ...params });
          result = await serpSearch(apiKey, query);
        }
        break;
      }
      default:
        throw new Error(`Unsupported cloud tool: ${toolId}`);
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Cloud tool failed',
    };
  }

  const charge = await usage.recordTokenUsage(db, userId, {
    rawCostUsd: rawCost,
    feature: 'hive_cloud_intel',
    summary: `Intel cloud: ${toolId}`,
    taskId: `intel-${toolId}-${Date.now()}`,
    email: opts.email,
  });

  if (!charge.ok) {
    return { ok: false, needPayment: true, needUpgrade: true, amountUsd: markedUp };
  }

  return {
    ok: true,
    rawCostUsd: rawCost,
    chargedUsd: charge.chargedUsd,
    budget: charge.budget,
    ...result,
  };
}

export const INTEL_CLOUD_TOOL_IDS = ['firecrawl_search', 'firecrawl_scrape', 'serp_search'];
