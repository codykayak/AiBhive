import type { PublishedWebApp } from './hiveAppTypes';

/** Built-in AiBhive web tools — listed in Hive Apps store. */
export const PLATFORM_WEB_APPS: PublishedWebApp[] = [
  {
    id: 'platform/ocr-lab',
    owner: 'aibhive',
    slug: 'ocr-lab',
    title: 'OCR Lab',
    summary: 'Extract text from photos, scans, and documents with AI-powered OCR.',
    url: '/ocr-lab',
    kind: 'web_app',
    taskId: null,
  },
  {
    id: 'platform/translation-lab',
    owner: 'aibhive',
    slug: 'translation-lab',
    title: 'Translation Lab',
    summary: 'Transcribe and translate audio or text in 20+ languages.',
    url: '/get-started',
    kind: 'web_app',
    taskId: null,
  },
];

export function platformAppAsCard(app: PublishedWebApp) {
  return {
    id: app.id,
    title: app.title,
    tagline: app.summary,
    summary: app.summary,
    theme: 'purple' as const,
    icon: app.id.includes('ocr') ? ('book' as const) : ('compass' as const),
    pages: [],
    pageCount: 0,
    isExample: true,
  };
}
