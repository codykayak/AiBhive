/**
 * Server-side free OSINT tools — same as mobile on-device runners (no CORS, no credits).
 * Feature: osint_on_device (free per hivePlans.js).
 */
import { buildDorkPack } from './intelDorks.js';

const UA = 'AiBhiveIntelAgent/1.0 (authorized research; +https://aibhive.com)';

const BLOCKED = new Set(['google.com', 'www.google.com', 'bing.com', 'www.bing.com']);

function assertSafeUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (BLOCKED.has(host) || host.endsWith('.google.com')) {
      throw new Error('Search engine URLs are blocked — use dorks or SerpAPI.');
    }
  } catch (e) {
    if (e.message.includes('blocked')) throw e;
    throw new Error('Invalid URL');
  }
}

async function safeFetch(url, init = {}) {
  assertSafeUrl(url);
  const timeoutMs = init.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Accept: '*/*', 'User-Agent': UA, ...(init.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, timeoutMs = 15000) {
  const res = await safeFetch(url, { timeoutMs });
  const text = await res.text();
  const headers = {};
  res.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  return { text, headers, status: res.status };
}

async function dnsResolve(name, type) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
  return res.json();
}

function formatDnsAnswer(data, type) {
  if (data.Status !== 0 || !data.Answer?.length) return `No ${type} records found.`;
  return data.Answer.map((a) => `${a.name} → ${a.data}`).join('\n');
}

const COMMON_SUBDOMAINS = [
  'www', 'mail', 'webmail', 'portal', 'admin', 'api', 'app', 'dev', 'staging',
  'blog', 'shop', 'support', 'docs', 'careers', 'jobs',
];

const USERNAME_SITES = [
  { name: 'GitHub', url: (u) => `https://github.com/${u}`, ok: (s) => s === 200 },
  { name: 'Reddit', url: (u) => `https://www.reddit.com/user/${u}`, ok: (s) => s === 200 },
  { name: 'Medium', url: (u) => `https://medium.com/@${u}`, ok: (s) => s === 200 },
  { name: 'Dev.to', url: (u) => `https://dev.to/${u}`, ok: (s) => s === 200 },
];

const TECH_SIGNATURES = [
  { name: 'WordPress', patterns: [/wp-content/i, /wordpress/i] },
  { name: 'Shopify', patterns: [/cdn\.shopify\.com/i] },
  { name: 'Next.js', patterns: [/_next\//i] },
  { name: 'Cloudflare', patterns: [/cloudflare/i, /cf-ray/i] },
  { name: 'Google Analytics', patterns: [/google-analytics\.com/i, /gtag\(/i] },
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
}

function siteUrl(domain) {
  return `https://${String(domain).replace(/^https?:\/\//, '').split('/')[0]}`;
}

export const FREE_INTEL_TOOL_IDS = [
  'dns_records',
  'mx_records',
  'txt_records',
  'cert_transparency',
  'subdomain_probe',
  'rdap_domain',
  'tech_fingerprint',
  'security_headers',
  'page_extract',
  'email_harvest',
  'robots_sitemap',
  'google_dorks',
  'username_probe',
  'wayback_snapshot',
];

export function resolveResearchDomain(label, targetType, domainOverride) {
  const trimmed = String(label || '').trim();
  if (domainOverride?.trim()) {
    return domainOverride.trim().replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
  if (targetType === 'domain') {
    return trimmed.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (targetType === 'company' && trimmed) {
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    return slug ? `${slug}.com` : '';
  }
  return '';
}

/**
 * @param {string} toolId
 * @param {{ targetType: string, domain: string, company: string, userIntent?: string, region?: object }} ctx
 */
export async function runFreeIntelTool(toolId, ctx) {
  const domain = ctx.domain || '';
  const company = ctx.company || domain;
  const baseUrl = domain ? siteUrl(domain) : '';

  switch (toolId) {
    case 'dns_records': {
      if (!domain) throw new Error('Domain required for DNS lookup.');
      const [a, aaaa, ns] = await Promise.all([
        dnsResolve(domain, 'A'),
        dnsResolve(domain, 'AAAA'),
        dnsResolve(domain, 'NS'),
      ]);
      const data = ['--- A ---', formatDnsAnswer(a, 'A'), '--- AAAA ---', formatDnsAnswer(aaaa, 'AAAA'), '--- NS ---', formatDnsAnswer(ns, 'NS')].join('\n');
      return { summary: 'DNS A/AAAA/NS collected', data };
    }
    case 'mx_records': {
      if (!domain) throw new Error('Domain required.');
      const mx = await dnsResolve(domain, 'MX');
      return { summary: 'MX records collected', data: formatDnsAnswer(mx, 'MX') };
    }
    case 'txt_records': {
      if (!domain) throw new Error('Domain required.');
      const txt = await dnsResolve(domain, 'TXT');
      return { summary: 'TXT records collected', data: formatDnsAnswer(txt, 'TXT') };
    }
    case 'cert_transparency': {
      if (!domain) throw new Error('Domain required.');
      const url = `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`;
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
      if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
      const rows = await res.json();
      const names = new Set();
      for (const row of (rows || []).slice(0, 500)) {
        for (const part of String(row.name_value || '').split('\n')) {
          const n = part.trim().toLowerCase();
          if (n.endsWith(domain)) names.add(n);
        }
      }
      const list = [...names].sort();
      return {
        summary: `${list.length} hostnames from cert logs`,
        data: list.length ? list.join('\n') : 'No certificate transparency entries found.',
      };
    }
    case 'subdomain_probe': {
      if (!domain) throw new Error('Domain required.');
      const found = [];
      for (const sub of COMMON_SUBDOMAINS) {
        const host = `${sub}.${domain}`;
        try {
          const data = await dnsResolve(host, 'A');
          if (data.Status === 0 && data.Answer?.length) found.push(host);
        } catch {
          /* skip */
        }
      }
      return {
        summary: `${found.length} live subdomains from quick probe`,
        data: found.length ? found.join('\n') : 'No common subdomains resolved.',
      };
    }
    case 'rdap_domain': {
      if (!domain) throw new Error('Domain required.');
      const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
      const res = await fetch(url, { headers: { Accept: 'application/rdap+json', 'User-Agent': UA } });
      if (!res.ok) throw new Error(`RDAP lookup failed (${res.status})`);
      const json = await res.json();
      const lines = [];
      if (json.ldhName) lines.push(`Domain: ${json.ldhName}`);
      if (json.status) lines.push(`Status: ${json.status.join(', ')}`);
      if (json.events) {
        for (const ev of json.events) lines.push(`${ev.eventAction}: ${ev.eventDate}`);
      }
      return { summary: 'RDAP registration data', data: lines.join('\n') || JSON.stringify(json).slice(0, 8000) };
    }
    case 'tech_fingerprint':
    case 'security_headers':
    case 'page_extract':
    case 'email_harvest':
    case 'robots_sitemap': {
      if (!domain) throw new Error('Domain required to fetch website.');
      if (toolId === 'robots_sitemap') {
        const parts = [];
        for (const path of ['/robots.txt', '/sitemap.xml']) {
          try {
            const { text } = await fetchText(`${baseUrl}${path}`, 10000);
            parts.push(`--- ${path} ---\n${text.slice(0, 4000)}`);
          } catch {
            parts.push(`--- ${path} ---\n(not found)`);
          }
        }
        return { summary: 'robots.txt and sitemap checked', data: parts.join('\n\n') };
      }
      const { text, headers } = await fetchText(baseUrl);
      if (toolId === 'security_headers') {
        const keys = ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options'];
        const lines = keys.map((k) => `${k}: ${headers[k] ?? '(not set)'}`);
        return { summary: `${keys.filter((k) => headers[k]).length}/${keys.length} security headers`, data: lines.join('\n') };
      }
      if (toolId === 'page_extract') {
        const plain = stripHtml(text);
        return { summary: `${plain.length} chars extracted`, data: plain || 'Could not extract text.' };
      }
      if (toolId === 'email_harvest') {
        const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = [...new Set((stripHtml(text).match(re) || []).map((e) => e.toLowerCase()))].slice(0, 50);
        return { summary: `${emails.length} emails found`, data: emails.join('\n') || 'No emails on homepage.' };
      }
      const haystack = text + JSON.stringify(headers);
      const detected = TECH_SIGNATURES.filter((s) => s.patterns.some((p) => p.test(haystack))).map((s) => s.name);
      return {
        summary: `${detected.length} technologies detected`,
        data: [`Server: ${headers.server || 'unknown'}`, `Tech: ${detected.join(', ') || 'none'}`].join('\n'),
      };
    }
    case 'google_dorks': {
      const pack = buildDorkPack({
        domain,
        company,
        person: ctx.targetType === 'person' ? company : undefined,
        targetType: ctx.targetType,
        region: ctx.region,
        query: ctx.userIntent || company,
        userIntent: ctx.userIntent,
      });
      const lines = pack.map(
        (d, i) =>
          `${i + 1}. ${d.label}\n   Query: ${d.query}\n   Open in browser: ${d.googleUrl}`
      );
      return {
        summary: `${pack.length} dork queries (open in browser)`,
        data: ['SAFE: Dorks are not scraped automatically.', '', ...lines].join('\n\n'),
      };
    }
    case 'username_probe': {
      const username = String(company)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '');
      if (!username) throw new Error('Enter a person name to probe.');
      const lines = [`Username: ${username}`, ''];
      let found = 0;
      for (const site of USERNAME_SITES) {
        const url = site.url(username);
        try {
          const res = await safeFetch(url, { method: 'HEAD', timeoutMs: 8000 });
          const hit = site.ok(res.status);
          if (hit) found += 1;
          lines.push(`${hit ? '✓' : '✗'} ${site.name}: ${url} (${res.status})`);
        } catch {
          lines.push(`? ${site.name}: ${url} (timeout)`);
        }
      }
      return { summary: `${found} platforms may match`, data: lines.join('\n') };
    }
    case 'wayback_snapshot': {
      if (!domain) throw new Error('Domain required.');
      const wbUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(baseUrl)}`;
      const res = await fetch(wbUrl);
      if (!res.ok) throw new Error(`Wayback API failed (${res.status})`);
      const json = await res.json();
      const snap = json?.archived_snapshots?.closest;
      const data = snap
        ? `Snapshot: ${snap.timestamp}\nURL: ${snap.url}\nStatus: ${snap.status}`
        : 'No Wayback snapshot found.';
      return { summary: snap ? 'Wayback snapshot found' : 'No snapshot', data };
    }
    default:
      throw new Error(`Unknown free tool: ${toolId}`);
  }
}

export async function runFreeIntelBatch(toolIds, ctx) {
  const results = [];
  for (const toolId of toolIds) {
    try {
      const out = await runFreeIntelTool(toolId, ctx);
      results.push({ toolId, status: 'done', ...out });
    } catch (err) {
      results.push({
        toolId,
        status: 'error',
        error: err instanceof Error ? err.message : 'Tool failed',
      });
    }
  }
  return results;
}
