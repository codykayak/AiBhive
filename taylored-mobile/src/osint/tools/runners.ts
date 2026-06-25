import { buildDorkPack } from '../dorks';
import { buildIntelSearchQuery } from '../regionalQuery';
import { getToolDef } from './registry';
import { runIntelCloudTool } from '../../lib/intelCloud';
import { safeFetch, safeFetchText } from '../safeFetch';
import type { IntelRegionFilter, IntelTargetType, OsintToolId } from '../types';

export type RunContext = {
  targetType: IntelTargetType;
  domain: string;
  company: string;
  username?: string;
  userIntent?: string;
  region?: IntelRegionFilter;
  firecrawlKey?: string | null;
  serpapiKey?: string | null;
  useHiveCloud?: boolean;
};

const COMMON_SUBDOMAINS = [
  'www',
  'mail',
  'webmail',
  'portal',
  'admin',
  'api',
  'app',
  'dev',
  'staging',
  'test',
  'beta',
  'cdn',
  'static',
  'blog',
  'shop',
  'store',
  'support',
  'help',
  'docs',
  'vpn',
  'remote',
  'intranet',
  'careers',
  'jobs',
];

const TECH_SIGNATURES: { name: string; patterns: RegExp[] }[] = [
  { name: 'WordPress', patterns: [/wp-content/i, /wp-includes/i, /wordpress/i] },
  { name: 'Shopify', patterns: [/cdn\.shopify\.com/i, /shopify/i] },
  { name: 'React', patterns: [/react-root/i, /__NEXT_DATA__/i, /_next\//i] },
  { name: 'Next.js', patterns: [/_next\//i, /__NEXT_DATA__/i] },
  { name: 'Angular', patterns: [/ng-version/i, /angular/i] },
  { name: 'Vue.js', patterns: [/vue/i, /__vue/i] },
  { name: 'Cloudflare', patterns: [/cloudflare/i, /cf-ray/i] },
  { name: 'Google Analytics', patterns: [/google-analytics\.com/i, /gtag\(/i, /G-[A-Z0-9]+/] },
  { name: 'Google Tag Manager', patterns: [/googletagmanager\.com/i] },
  { name: 'HubSpot', patterns: [/hubspot/i, /hs-scripts/i] },
  { name: 'Stripe', patterns: [/js\.stripe\.com/i] },
  { name: 'jQuery', patterns: [/jquery/i] },
  { name: 'Bootstrap', patterns: [/bootstrap/i] },
  { name: 'Squarespace', patterns: [/squarespace/i] },
  { name: 'Wix', patterns: [/wix\.com/i, /wixstatic/i] },
];

async function dnsResolve(name: string, type: string): Promise<unknown> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
  return res.json();
}

function formatDnsAnswer(data: unknown, type: string): string {
  const d = data as { Answer?: Array<{ name: string; type: number; data: string }>; Status?: number };
  if (d.Status !== 0 || !d.Answer?.length) return `No ${type} records found.`;
  return d.Answer.map((a) => `${a.name} → ${a.data}`).join('\n');
}

const USERNAME_SITES: { name: string; url: (u: string) => string; ok: (status: number) => boolean }[] = [
  { name: 'GitHub', url: (u) => `https://github.com/${u}`, ok: (s) => s === 200 },
  { name: 'Reddit', url: (u) => `https://www.reddit.com/user/${u}`, ok: (s) => s === 200 },
  { name: 'Medium', url: (u) => `https://medium.com/@${u}`, ok: (s) => s === 200 },
  { name: 'Dev.to', url: (u) => `https://dev.to/${u}`, ok: (s) => s === 200 },
  { name: 'Keybase', url: (u) => `https://keybase.io/${u}`, ok: (s) => s === 200 },
  { name: 'Hacker News', url: (u) => `https://news.ycombinator.com/user?id=${u}`, ok: (s) => s === 200 },
  { name: 'GitLab', url: (u) => `https://gitlab.com/${u}`, ok: (s) => s === 200 },
  { name: 'Pastebin', url: (u) => `https://pastebin.com/u/${u}`, ok: (s) => s === 200 },
];

async function fetchText(url: string, timeoutMs = 15000) {
  return safeFetchText(url, timeoutMs);
}

async function runCloudOrThrow(
  toolId: OsintToolId,
  ctx: RunContext,
  params: Record<string, string>
): Promise<{ summary: string; data: string }> {
  if (!ctx.useHiveCloud) throw new Error('API key not set — add in Settings or enable Hive Cloud');
  const cloud = await runIntelCloudTool(toolId, params);
  if (cloud.ok) return { summary: cloud.summary, data: cloud.data };
  if (cloud.needPayment) throw new Error('Insufficient Hive credits — add credits in Settings');
  throw new Error(cloud.error ?? 'Hive Cloud tool failed');
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
}

function extractEmails(text: string, domain: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const found = new Set<string>();
  for (const m of text.match(re) ?? []) {
    found.add(m.toLowerCase());
  }
  if (domain) {
    for (const local of ['info', 'contact', 'hello', 'support', 'sales', 'admin', 'hr', 'careers']) {
      found.add(`${local}@${domain}`);
    }
  }
  return [...found].slice(0, 50);
}

function siteUrl(domain: string): string {
  return `https://${domain.replace(/^https?:\/\//, '')}`;
}

export async function runOsintTool(
  toolId: OsintToolId,
  ctx: RunContext
): Promise<{ summary: string; data: string }> {
  const domain = ctx.domain;
  const company = ctx.company;
  const baseUrl = siteUrl(domain);

  switch (toolId) {
    case 'dns_records': {
      const [a, aaaa, ns] = await Promise.all([
        dnsResolve(domain, 'A'),
        dnsResolve(domain, 'AAAA'),
        dnsResolve(domain, 'NS'),
      ]);
      const data = [
        '--- A ---',
        formatDnsAnswer(a, 'A'),
        '--- AAAA ---',
        formatDnsAnswer(aaaa, 'AAAA'),
        '--- NS ---',
        formatDnsAnswer(ns, 'NS'),
      ].join('\n');
      return { summary: 'DNS A/AAAA/NS collected', data };
    }

    case 'mx_records': {
      const mx = await dnsResolve(domain, 'MX');
      return { summary: 'MX records collected', data: formatDnsAnswer(mx, 'MX') };
    }

    case 'txt_records': {
      const txt = await dnsResolve(domain, 'TXT');
      return { summary: 'TXT records collected', data: formatDnsAnswer(txt, 'TXT') };
    }

    case 'cert_transparency': {
      const url = `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`;
      const res = await safeFetch(url);
      if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
      const rows = (await res.json()) as Array<{ name_value?: string }>;
      const names = new Set<string>();
      for (const row of rows.slice(0, 500)) {
        for (const part of (row.name_value ?? '').split('\n')) {
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
      const found: string[] = [];
      for (const sub of COMMON_SUBDOMAINS) {
        const host = `${sub}.${domain}`;
        try {
          const data = await dnsResolve(host, 'A');
          const d = data as { Status?: number; Answer?: unknown[] };
          if (d.Status === 0 && d.Answer?.length) found.push(host);
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
      const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
      const res = await safeFetch(url, { headers: { Accept: 'application/rdap+json' } });
      if (!res.ok) throw new Error(`RDAP lookup failed (${res.status})`);
      const json = await res.json();
      const lines: string[] = [];
      if (json.ldhName) lines.push(`Domain: ${json.ldhName}`);
      if (json.status) lines.push(`Status: ${(json.status as string[]).join(', ')}`);
      if (json.events) {
        for (const ev of json.events as Array<{ eventAction: string; eventDate: string }>) {
          lines.push(`${ev.eventAction}: ${ev.eventDate}`);
        }
      }
      if (json.entities) {
        for (const ent of json.entities as Array<{ vcardArray?: unknown; roles?: string[] }>) {
          const roles = ent.roles?.join(', ') ?? 'entity';
          lines.push(`\n[${roles}]`);
          try {
            lines.push(JSON.stringify(ent.vcardArray, null, 2).slice(0, 2000));
          } catch {
            lines.push('(vcard data)');
          }
        }
      }
      return { summary: 'RDAP registration data', data: lines.join('\n') || JSON.stringify(json, null, 2).slice(0, 8000) };
    }

    case 'tech_fingerprint': {
      const { text, headers } = await fetchText(baseUrl);
      const haystack = text + '\n' + JSON.stringify(headers);
      const detected = TECH_SIGNATURES.filter((sig) => sig.patterns.some((p) => p.test(haystack))).map(
        (s) => s.name
      );
      const server = headers['server'] ?? headers['x-powered-by'] ?? 'unknown';
      const data = [
        `Server: ${server}`,
        `Detected technologies: ${detected.length ? detected.join(', ') : 'none matched'}`,
        `Page title snippet: ${text.match(/<title[^>]*>([^<]+)/i)?.[1]?.trim() ?? 'n/a'}`,
      ].join('\n');
      return { summary: `${detected.length} technologies detected`, data };
    }

    case 'security_headers': {
      const { headers } = await fetchText(baseUrl);
      const keys = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
      ];
      const lines = keys.map((k) => `${k}: ${headers[k] ?? '(not set)'}`);
      const score = keys.filter((k) => headers[k]).length;
      return { summary: `${score}/${keys.length} security headers present`, data: lines.join('\n') };
    }

    case 'page_extract': {
      const { text } = await fetchText(baseUrl);
      const plain = stripHtml(text);
      return {
        summary: `${plain.length} chars extracted`,
        data: plain || 'Could not extract readable text.',
      };
    }

    case 'email_harvest': {
      const { text } = await fetchText(baseUrl);
      const emails = extractEmails(text + stripHtml(text), domain);
      return {
        summary: `${emails.length} emails found or suggested`,
        data: emails.length ? emails.join('\n') : 'No emails found on homepage.',
      };
    }

    case 'robots_sitemap': {
      const parts: string[] = [];
      for (const path of ['/robots.txt', '/sitemap.xml', '/sitemap_index.xml']) {
        try {
          const { text } = await fetchText(`${baseUrl}${path}`, 10000);
          parts.push(`--- ${path} ---\n${text.slice(0, 4000)}`);
        } catch {
          parts.push(`--- ${path} ---\n(not found or blocked)`);
        }
      }
      return { summary: 'robots.txt and sitemap checked', data: parts.join('\n\n') };
    }

    case 'google_dorks': {
      const pack = buildDorkPack({
        domain,
        company,
        person: ctx.targetType === 'person' ? company : undefined,
        targetType: ctx.targetType,
        region: ctx.region,
      });
      const lines = pack.map(
        (d, i) =>
          `${i + 1}. ${d.label}\n   Query: ${d.query}\n   Open in browser: ${d.googleUrl}\n   (AiBhive never scrapes Google — tap links in case view)`
      );
      return {
        summary: `${pack.length} dork queries — use browser or SerpAPI`,
        data: ['SAFE MODE: Dorks are not fetched automatically.', '', ...lines].join('\n\n'),
      };
    }

    case 'username_probe': {
      const username = (ctx.username || company)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '');
      if (!username) throw new Error('No username to probe');
      const lines: string[] = [`Username: ${username}`, ''];
      let found = 0;
      for (const site of USERNAME_SITES) {
        const url = site.url(username);
        try {
          const res = await safeFetch(url, { method: 'HEAD', timeoutMs: 8000 });
          const hit = site.ok(res.status);
          if (hit) found += 1;
          lines.push(`${hit ? '✓' : '✗'} ${site.name}: ${url} (${res.status})`);
        } catch {
          lines.push(`? ${site.name}: ${url} (blocked or timeout)`);
        }
      }
      return { summary: `${found} platforms may match`, data: lines.join('\n') };
    }

    case 'wayback_snapshot': {
      const wbUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(baseUrl)}`;
      const res = await safeFetch(wbUrl);
      if (!res.ok) throw new Error(`Wayback API failed (${res.status})`);
      const json = await res.json();
      const closest = json?.archived_snapshots?.closest;
      if (!closest?.available) {
        return { summary: 'No Wayback snapshots', data: 'No archived snapshots found for this URL.' };
      }
      const data = [
        `Snapshot URL: ${closest.url}`,
        `Timestamp: ${closest.timestamp}`,
        `Status: ${closest.status}`,
      ].join('\n');
      return { summary: 'Wayback snapshot found', data };
    }

    case 'firecrawl_search': {
      const query = buildIntelSearchQuery({
        targetType: ctx.targetType,
        label: company,
        domain,
        userIntent: ctx.userIntent,
        region: ctx.region,
      });
      const cloudParams = {
        company,
        domain,
        userIntent: ctx.userIntent ?? '',
        targetType: ctx.targetType,
        location: ctx.region?.location ?? '',
        radiusMiles: String(ctx.region?.radiusMiles ?? ''),
        restrictToRegion: ctx.region?.restrictToRegion ? '1' : '0',
      };
      if (ctx.firecrawlKey) {
        const res = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ctx.firecrawlKey}`,
          },
          body: JSON.stringify({
            query,
            limit: 8,
            scrapeOptions: { formats: ['markdown'] },
          }),
        });
        if (!res.ok) throw new Error(`Firecrawl search failed (${res.status})`);
        const json = await res.json();
        const chunks = (json.data ?? []).map(
          (item: { title?: string; url?: string; markdown?: string; description?: string }, i: number) => {
            const body = item.markdown || item.description || '';
            return `[${i + 1}] ${item.title ?? 'Result'}\nURL: ${item.url ?? 'n/a'}\n${body.slice(0, 2500)}`;
          }
        );
        return {
          summary: `${chunks.length} Firecrawl search results`,
          data: chunks.join('\n\n---\n\n').slice(0, 14000),
        };
      }
      return runCloudOrThrow('firecrawl_search', ctx, cloudParams);
    }

    case 'firecrawl_scrape': {
      if (ctx.firecrawlKey) {
        const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ctx.firecrawlKey}`,
          },
          body: JSON.stringify({ url: baseUrl, formats: ['markdown'] }),
        });
        if (!res.ok) throw new Error(`Firecrawl scrape failed (${res.status})`);
        const json = await res.json();
        const md = json?.data?.markdown ?? json?.markdown ?? '';
        return {
          summary: 'Homepage scraped via Firecrawl',
          data: (typeof md === 'string' ? md : JSON.stringify(md)).slice(0, 14000),
        };
      }
      return runCloudOrThrow('firecrawl_scrape', ctx, { url: baseUrl, domain, company });
    }

    case 'serp_search': {
      const query = buildIntelSearchQuery({
        targetType: ctx.targetType,
        label: company,
        domain,
        userIntent: ctx.userIntent,
        region: ctx.region,
      });
      const cloudParams = {
        company,
        domain,
        userIntent: ctx.userIntent ?? '',
        targetType: ctx.targetType,
        location: ctx.region?.location ?? '',
        radiusMiles: String(ctx.region?.radiusMiles ?? ''),
        restrictToRegion: ctx.region?.restrictToRegion ? '1' : '0',
      };
      if (ctx.serpapiKey) {
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${ctx.serpapiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`SerpAPI failed (${res.status})`);
        const json = await res.json();
        const organic = (json.organic_results ?? []) as Array<{ title?: string; link?: string; snippet?: string }>;
        const lines = organic.slice(0, 10).map((r, i) => `[${i + 1}] ${r.title}\n${r.link}\n${r.snippet ?? ''}`);
        return {
          summary: `${lines.length} SerpAPI results`,
          data: lines.join('\n\n') || 'No organic results.',
        };
      }
      return runCloudOrThrow('serp_search', ctx, cloudParams);
    }

    default:
      throw new Error(`Unknown tool: ${toolId}`);
  }
}

export function canRunTool(
  toolId: OsintToolId,
  ctx: RunContext
): { ok: true } | { ok: false; reason: string } {
  const def = getToolDef(toolId);
  if (!def.applicableTargets.includes(ctx.targetType)) {
    return { ok: false, reason: `Not used for ${ctx.targetType} targets` };
  }
  if (toolId === 'firecrawl_search' || toolId === 'firecrawl_scrape') {
    if (!ctx.firecrawlKey && !ctx.useHiveCloud) {
      return { ok: false, reason: 'Firecrawl key or Hive Cloud required' };
    }
  }
  if (toolId === 'serp_search') {
    if (!ctx.serpapiKey && !ctx.useHiveCloud) {
      return { ok: false, reason: 'SerpAPI key or Hive Cloud required' };
    }
  }
  if (def.requiresDomain && !ctx.domain) {
    return { ok: false, reason: 'Website/domain required for this module' };
  }
  if (toolId === 'username_probe' && ctx.targetType !== 'person') {
    return { ok: false, reason: 'Username probe is for person targets' };
  }
  return { ok: true };
}
