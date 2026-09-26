/**
 * Social / Open Graph cleanup for prerendered HTML and the Vite shell.
 * Crawlers often use the *first* og:title — duplicate shell tags caused every share to look like the homepage.
 */

const SHELL_OG_TITLE = 'AiBhive — AI App Factory, Community Apps & Enterprise Agentic AI';

/** Remove legacy default tags from index.html (Helmet adds per-route tags after hydration). */
export function stripViteShellSocialTags(html) {
  let out = html;
  out = out.replace(/<title>AiBhive — AI App Factory[^<]*<\/title>\s*/i, '<title>AiBhive</title>\n    ');
  out = out.replace(/<meta name="description" content="AiBhive is an AI app factory[^"]*" \/?>\s*/i, '');
  out = out.replace(/<link rel="canonical" href="https:\/\/aibhive\.com\/" \/?>\s*/i, '');
  out = out.replace(/<meta property="og:[^"]+" content="[^"]*" \/?>\s*/gi, '');
  out = out.replace(/<meta name="twitter:[^"]+" content="[^"]*" \/?>\s*/gi, '');
  return out;
}

function dedupeMetaByAttr(html, attr, name) {
  const re = new RegExp(`<meta ${attr}="${name}" content="([^"]*)"[^>]*>`, 'gi');
  const matches = [...html.matchAll(re)];
  if (matches.length <= 1) return html;
  let seen = 0;
  return html.replace(re, (match) => {
    seen += 1;
    return seen === matches.length ? match : '';
  });
}

/** After Puppeteer render: one og/twitter set (prefer the last = react-helmet). */
export function normalizePrerenderSocialMeta(html) {
  let out = stripViteShellSocialTags(html);
  for (const prop of [
    'og:title',
    'og:description',
    'og:url',
    'og:image',
    'og:image:alt',
    'og:type',
    'og:site_name',
    'og:locale',
    'og:image:width',
    'og:image:height',
  ]) {
    out = dedupeMetaByAttr(out, 'property', prop);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    out = dedupeMetaByAttr(out, 'name', name);
  }
  // Drop stale shell title if helmet set a different document.title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const ogTitleMatch = [...out.matchAll(/<meta property="og:title" content="([^"]*)"/gi)].pop();
  if (titleMatch && ogTitleMatch && titleMatch[1].includes('AI App Factory') && !ogTitleMatch[1].includes('AI App Factory')) {
    out = out.replace(/<title>[^<]*<\/title>/i, `<title>${ogTitleMatch[1]}</title>`);
  }
  if (out.includes(SHELL_OG_TITLE) && ogTitleMatch && !ogTitleMatch[1].includes('AI App Factory')) {
    out = out.replace(
      new RegExp(`<meta property="og:title" content="${SHELL_OG_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i'),
      '',
    );
  }
  return out;
}

export function resolveDistHtmlForPath(distDir, urlPath) {
  const clean = (urlPath || '/').split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  if (clean === '/') return `${distDir}/index.html`;
  const nested = `${distDir}${clean}/index.html`;
  return nested;
}
