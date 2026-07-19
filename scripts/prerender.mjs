#!/usr/bin/env node
/**
 * Post-build static HTML snapshots for public SPA routes (SEO + AI crawlers).
 *
 * Usage:
 *   SKIP_PRERENDER=1 npm run build   # skip
 *   node scripts/prerender.mjs       # after vite build
 *
 * Failures are non-fatal unless PRERENDER_REQUIRED=1.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { getPrerenderRoutes } from './public-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PRERENDER_PORT || 4173);
const HOST = process.env.PRERENDER_HOST || '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;

const REQUIRED = process.env.PRERENDER_REQUIRED === '1';
const ROUTE_TIMEOUT_MS = Number(process.env.PRERENDER_ROUTE_TIMEOUT_MS || 120_000);
const MIN_ROOT_TEXT = Number(process.env.PRERENDER_MIN_ROOT_TEXT || 120);

/** High-value routes — build fails (when REQUIRED) if any of these fail. */
const CRITICAL_ROUTES = new Set(['/', '/faq', '/about', '/solutions/field-service-ai']);

function log(...args) {
  console.log('[prerender]', ...args);
}

function warn(...args) {
  console.warn('[prerender]', ...args);
}

function routeOutputFile(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  const segments = route.replace(/^\//, '').split('/').filter(Boolean);
  return path.join(DIST, ...segments, 'index.html');
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', BASE);
      let pathname = decodeURIComponent(url.pathname);

      if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }

      const candidates = [];
      if (pathname === '/') {
        candidates.push(path.join(DIST, 'index.html'));
      } else {
        candidates.push(path.join(DIST, pathname));
        candidates.push(path.join(DIST, pathname, 'index.html'));
      }
      candidates.push(path.join(DIST, 'index.html'));

      for (const filePath of candidates) {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath);
          const types = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.webp': 'image/webp',
            '.woff2': 'font/woff2',
            '.txt': 'text/plain; charset=utf-8',
            '.webm': 'video/webm',
            '.mp4': 'video/mp4',
            '.apk': 'application/vnd.android.package-archive',
          };
          res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.on('error', reject);
    server.listen(PORT, HOST, () => resolve(server));
  });
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
      const timer = setInterval(() => {
        const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        y += step;
        window.scrollTo(0, y);
        if (y >= max + step) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 80);
    });
  });
}

async function waitForPageReady(page) {
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      if (!root) return false;
      const text = (root.innerText || '').trim();
      if (text.length < 80) return false;
      if (text.includes('Loading…')) return false;
      return Boolean(root.querySelector('h1, h2, main'));
    },
    { timeout: ROUTE_TIMEOUT_MS }
  );
}

async function renderRoute(browser, route) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(ROUTE_TIMEOUT_MS);
  page.setDefaultTimeout(ROUTE_TIMEOUT_MS);

  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: ROUTE_TIMEOUT_MS });
    await waitForPageReady(page);
    await autoScroll(page);
    await new Promise((r) => setTimeout(r, 600));

    const metrics = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        textLen: (root?.innerText || '').trim().length,
        title: document.title,
        hasCanonical: Boolean(document.querySelector('link[rel="canonical"]')),
        hasJsonLd: Boolean(document.querySelector('script[type="application/ld+json"]')),
      };
    });

    if (metrics.textLen < MIN_ROOT_TEXT) {
      throw new Error(`insufficient root text (${metrics.textLen} chars)`);
    }

    let html = await page.content();

    // Ensure nested routes keep absolute asset URLs from Vite build.
    html = html.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/g, '');

    const outFile = routeOutputFile(route);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');

    return { ok: true, outFile, metrics };
  } finally {
    await page.close();
  }
}

async function main() {
  if (process.env.SKIP_PRERENDER === '1') {
    log('SKIP_PRERENDER=1 — skipping');
    return;
  }

  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html not found — run vite build first');
  }

  const routes = getPrerenderRoutes();
  log(`Rendering ${routes.length} public routes…`);

  const server = await startStaticServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = { ok: 0, failed: [] };

  try {
    for (const route of routes) {
      try {
        const result = await renderRoute(browser, route);
        results.ok += 1;
        log(`✓ ${route} → ${path.relative(ROOT, result.outFile)} (${result.metrics.textLen} chars)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.failed.push({ route, message });
        warn(`✗ ${route}: ${message}`);
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  log(`Done: ${results.ok}/${routes.length} routes prerendered`);

  const criticalFailures = results.failed.filter((f) => CRITICAL_ROUTES.has(f.route));
  if (criticalFailures.length) {
    const msg = `Critical prerender failures: ${criticalFailures.map((f) => f.route).join(', ')}`;
    if (REQUIRED) throw new Error(msg);
    warn(msg);
  }

  if (results.failed.length && REQUIRED) {
    throw new Error(`Prerender failed for ${results.failed.length} route(s)`);
  }

  if (results.failed.length) {
    warn(`${results.failed.length} route(s) skipped — SPA fallback still works`);
  }
}

main().catch((err) => {
  console.error('[prerender] Fatal:', err);
  process.exit(REQUIRED ? 1 : 0);
});
