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
  {
    id: 'platform/homework-bot',
    owner: 'aibhive',
    slug: 'homework-bot',
    title: 'Homework Bot',
    summary: 'OCR reference pages into a private RAG library, then complete assignments with Grok.',
    url: '/hive-apps/run/example-homework-bot',
    kind: 'web_app',
    taskId: null,
  },
  {
    id: 'platform/fable-scrape',
    owner: 'aibhive',
    slug: 'fable-scrape',
    title: 'Fable Scrape',
    summary: 'Harvest images and documents from bot-blocked archives undetected, then OCR them in one pass.',
    url: '/fable-scrape',
    kind: 'web_app',
    taskId: null,
  },
];

export function platformAppAsCard(app: PublishedWebApp) {
  const icon = app.id.includes('ocr')
    ? ('book' as const)
    : app.id.includes('fable-scrape')
      ? ('compass' as const)
      : ('compass' as const);
  return {
    id: app.id,
    title: app.title,
    tagline: app.summary,
    summary: app.summary,
    theme: app.id.includes('fable-scrape') ? ('green' as const) : ('purple' as const),
    icon,
    pages: [],
    pageCount: 0,
    isExample: true,
  };
}
