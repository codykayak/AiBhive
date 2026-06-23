/**
 * Server-side Intel OSINT cloud tools — uses AiBhive env API keys.
 * Never proxies requests to google.com; SerpAPI/Firecrawl only.
 */

const SERP_COST_USD = 0.02;
const FIRECRAWL_SEARCH_COST_USD = 0.03;
const FIRECRAWL_SCRAPE_COST_USD = 0.02;

export function intelToolCostUsd(toolId) {
  switch (toolId) {
    case 'firecrawl_search':
      return FIRECRAWL_SEARCH_COST_USD;
    case 'firecrawl_scrape':
      return FIRECRAWL_SCRAPE_COST_USD;
    case 'serp_search':
      return SERP_COST_USD;
    default:
      return 0.02;
  }
}

async function firecrawlSearch(apiKey, query) {
  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      limit: 8,
      scrapeOptions: { formats: ['markdown'] },
    }),
  });
  if (!res.ok) throw new Error(`Firecrawl search failed (${res.status})`);
  const json = await res.json();
  const chunks = (json.data ?? []).map((item, i) => {
    const body = item.markdown || item.description || '';
    return `[${i + 1}] ${item.title ?? 'Result'}\nURL: ${item.url ?? 'n/a'}\n${String(body).slice(0, 2500)}`;
  });
  return {
    summary: `${chunks.length} Firecrawl search results (Hive Cloud)`,
    data: chunks.join('\n\n---\n\n').slice(0, 14000),
  };
}

async function firecrawlScrape(apiKey, url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });
  if (!res.ok) throw new Error(`Firecrawl scrape failed (${res.status})`);
  const json = await res.json();
  const md = json?.data?.markdown ?? json?.markdown ?? '';
  return {
    summary: 'Page scraped via Firecrawl (Hive Cloud)',
    data: String(md).slice(0, 14000),
  };
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
 * @param {{ userId: string, toolId: string, params: Record<string, string> }} opts
 */
export async function runIntelCloudTool(db, billing, opts) {
  const { userId, toolId, params = {} } = opts;
  const cost = intelToolCostUsd(toolId);
  const check = await billing.checkBuildCredits(db, userId, cost);
  if (!check.ok) {
    return { ok: false, needPayment: true, amountUsd: cost };
  }

  const taskId = `intel-${toolId}-${Date.now()}`;
  const reserve = await billing.reserveBuildCredits(db, userId, taskId, cost);
  if (!reserve.ok) {
    return { ok: false, needPayment: true, amountUsd: cost };
  }

  const company = params.company || '';
  const domain = params.domain || '';
  const userIntent = params.userIntent || '';
  const targetUrl = params.url || (domain ? `https://${domain}` : '');

  let result;
  try {
    switch (toolId) {
      case 'firecrawl_search': {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) throw new Error('Hive Cloud Firecrawl not configured');
        const query = userIntent.trim()
          ? `${company} ${domain} ${userIntent}`
          : `${company} ${domain} company leadership technology`;
        result = await firecrawlSearch(apiKey, query);
        break;
      }
      case 'firecrawl_scrape': {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) throw new Error('Hive Cloud Firecrawl not configured');
        if (!targetUrl) throw new Error('URL required for scrape');
        result = await firecrawlScrape(apiKey, targetUrl);
        break;
      }
      case 'serp_search': {
        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) throw new Error('Hive Cloud SerpAPI not configured');
        const query = userIntent.trim() ? `${company} ${userIntent}` : `${company} ${domain}`;
        result = await serpSearch(apiKey, query);
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

  return {
    ok: true,
    costUsd: cost,
    creditBalanceUsd: check.creditBalanceUsd - cost,
    ...result,
  };
}

export const INTEL_CLOUD_TOOL_IDS = ['firecrawl_search', 'firecrawl_scrape', 'serp_search'];
