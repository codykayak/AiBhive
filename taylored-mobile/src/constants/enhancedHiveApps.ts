/** Web enhanced runners — open in-app WebView on mobile instead of generic spec pages. */
export const ENHANCED_HIVE_RUNNERS: Record<string, string> = {
  'example-house-flip': 'https://aibhive.com/hive-apps/run/example-house-flip?mobile=1',
  'example-social-post-hunter': 'https://aibhive.com/hive-apps/run/example-social-post-hunter?mobile=1',
  'example-homework-bot': 'https://aibhive.com/hive-apps/run/example-homework-bot?mobile=1',
  'example-meeting-burn': 'https://aibhive.com/hive-apps/run/example-meeting-burn?mobile=1',
  'example-focus-reactor': 'https://aibhive.com/hive-apps/run/example-focus-reactor?mobile=1',
  'example-job-hunter': 'https://aibhive.com/hive-apps/run/example-job-hunter?mobile=1',
  'example-mock-realestate': 'https://aibhive.com/hive-apps/run/example-mock-realestate?mobile=1',
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
  return null;
}
