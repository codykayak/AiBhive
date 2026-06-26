/** Built-in AiBhive web tools listed in Hive Apps (same-site routes). */
export const PLATFORM_WEB_APPS = [
  {
    id: 'platform/ocr-lab',
    owner: 'aibhive',
    slug: 'ocr-lab',
    title: 'OCR Lab',
    summary: 'Extract text from photos, scans, and documents with AI-powered OCR.',
    taskId: null,
    url: '/ocr-lab',
    kind: 'platform_app',
  },
  {
    id: 'platform/translation-lab',
    owner: 'aibhive',
    slug: 'translation-lab',
    title: 'Translation Lab',
    summary: 'Transcribe and translate audio or text in 20+ languages.',
    taskId: null,
    url: '/get-started',
    kind: 'platform_app',
  },
];

export function listPlatformWebApps() {
  return PLATFORM_WEB_APPS.map((app) => ({
    ...app,
    url: app.url.startsWith('http') ? app.url : `https://aibhive.com${app.url}`,
  }));
}
