import {
  LIVING_KNOWLEDGE_SEO_DESCRIPTION,
  PLANT_APP_DISPLAY_NAME,
  PLANTS_PUBLIC_PATH,
} from './branding';

export type LivingKnowledgeSharePayload = {
  url: string;
  title: string;
  text: string;
};

export function getLivingKnowledgeShareUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${PLANTS_PUBLIC_PATH}`;
  }
  return `https://aibhive.com${PLANTS_PUBLIC_PATH}`;
}

export function getLivingKnowledgeSharePayload(): LivingKnowledgeSharePayload {
  const url = getLivingKnowledgeShareUrl();
  const title = PLANT_APP_DISPLAY_NAME;
  const text = `${title} — ${LIVING_KNOWLEDGE_SEO_DESCRIPTION.slice(0, 200)}…`;
  return { url, title, text };
}

export function buildFacebookShareUrl(url = getLivingKnowledgeShareUrl()): string {
  const params = new URLSearchParams({ u: url });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function buildXShareUrl(payload: LivingKnowledgeSharePayload = getLivingKnowledgeSharePayload()): string {
  const params = new URLSearchParams();
  params.set('text', `${payload.title} — ${payload.text}`);
  params.set('url', payload.url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildInstagramClipboardText(payload: LivingKnowledgeSharePayload = getLivingKnowledgeSharePayload()): string {
  return `${payload.title}\n\n${payload.text}\n\n${payload.url}`;
}
