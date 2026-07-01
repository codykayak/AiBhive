/**
 * Hive Cloud Intel API keys — must be set on Cloud Run as env vars or secrets.
 * Exact names: FIRECRAWL_API_KEY, SERPAPI_KEY
 */

function firstEnv(names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function getFirecrawlApiKey() {
  return firstEnv(['FIRECRAWL_API_KEY', 'FIRECRAWL_KEY']);
}

export function getSerpApiKey() {
  return firstEnv(['SERPAPI_KEY', 'SERP_API_KEY']);
}

export function intelCloudKeyStatus() {
  const firecrawl = Boolean(getFirecrawlApiKey());
  const serpapi = Boolean(getSerpApiKey());
  return {
    firecrawl,
    serpapi,
    discoveryReady: firecrawl || serpapi,
    envVarNames: {
      firecrawl: 'FIRECRAWL_API_KEY',
      serpapi: 'SERPAPI_KEY',
    },
    setupHint:
      firecrawl && serpapi
        ? null
        : 'Set FIRECRAWL_API_KEY and SERPAPI_KEY on the Cloud Run service, then deploy a new revision.',
  };
}

export function requireFirecrawlKey() {
  const key = getFirecrawlApiKey();
  if (!key) {
    throw new Error(
      'FIRECRAWL_API_KEY is not set on the server. In Google Cloud Run → your AiBhive service → Variables & secrets, add env var FIRECRAWL_API_KEY, then deploy a new revision.'
    );
  }
  return key;
}

export function requireSerpApiKey() {
  const key = getSerpApiKey();
  if (!key) {
    throw new Error(
      'SERPAPI_KEY is not set on the server. In Google Cloud Run → your AiBhive service → Variables & secrets, add env var SERPAPI_KEY, then deploy a new revision.'
    );
  }
  return key;
}
