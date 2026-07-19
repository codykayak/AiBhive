/** Web enhanced runners — open in-app WebView on mobile instead of generic spec pages. */
const EMBED_BASE = 'https://aibhive.com/hive-apps/embed';

export const ENHANCED_HIVE_RUNNERS: Record<string, string> = {
  'example-house-flip': `${EMBED_BASE}/example-house-flip?mobile=1`,
  'example-social-post-hunter': `${EMBED_BASE}/example-social-post-hunter?mobile=1`,
  'example-homework-bot': `${EMBED_BASE}/example-homework-bot?mobile=1`,
  'example-research': `${EMBED_BASE}/example-research?mobile=1`,
  'example-meeting-burn': `${EMBED_BASE}/example-meeting-burn?mobile=1`,
  'example-focus-reactor': `${EMBED_BASE}/example-focus-reactor?mobile=1`,
  'example-job-hunter': `${EMBED_BASE}/example-job-hunter?mobile=1`,
  'example-mock-realestate': `${EMBED_BASE}/example-mock-realestate?mobile=1`,
  'example-oregon-plant-medicine': `${EMBED_BASE}/example-oregon-plant-medicine?mobile=1`,
};

export function enhancedRunnerUrl(exampleId: string): string | null {
  return ENHANCED_HIVE_RUNNERS[exampleId] ?? null;
}

/** Resolve a toolkit / user app to an enhanced web runner when available. */
export function resolveEnhancedRunnerForApp(app: {
  id?: string;
  sourceCommunityAppId?: string | null;
  title?: string;
}): string | null {
  const exampleId = app.sourceCommunityAppId || app.id || '';
  const direct = enhancedRunnerUrl(exampleId);
  if (direct) return direct;

  const title = String(app.title || '').toLowerCase();
  if (
    (title.includes('flip') && (title.includes('calc') || title.includes('house'))) ||
    title.includes('house flip')
  ) {
    return ENHANCED_HIVE_RUNNERS['example-house-flip'];
  }
  if (title.includes('social') && (title.includes('hunter') || title.includes('post'))) {
    return ENHANCED_HIVE_RUNNERS['example-social-post-hunter'];
  }
  if (title.includes('research') || title.includes('intel') || title.includes('osint')) {
    return ENHANCED_HIVE_RUNNERS['example-research'];
  }
  return null;
}

/** Hide legacy generic flip calculators when the enhanced reactor is available. */
export function isLegacyFlipCalculatorApp(app: {
  id?: string;
  sourceCommunityAppId?: string | null;
  title?: string;
}): boolean {
  const exampleId = app.sourceCommunityAppId || app.id || '';
  if (exampleId === 'example-house-flip') return false;

  const title = String(app.title || '').toLowerCase();
  return (
    (title.includes('flip') && (title.includes('calc') || title.includes('house'))) ||
    title.includes('house flip')
  );
}
