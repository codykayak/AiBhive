import type { User } from 'firebase/auth';
import { adminJson } from './adminApi';

export const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', charLimit: 63206 },
  { id: 'instagram', label: 'Instagram', charLimit: 2200 },
  { id: 'x', label: 'X', charLimit: 280 },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]['id'];

export interface WorkflowStep {
  step: string;
  label: string;
  status: string;
  at?: string;
  raw?: string;
  output?: unknown;
  model?: string;
  error?: string;
}

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  x: string;
}

export interface AutoSocialConfig {
  notifyPhone: string;
  notifyEnabled: boolean;
  scheduleHour: number;
  siteUrl: string;
  adminBaseUrl: string;
  socialLinks: SocialLinks;
  textModel?: string;
  imageModel?: string;
}

export interface ProviderKeyInfo {
  set: boolean;
  hint: string;
}

export interface ProviderSettings {
  enabled: boolean;
  textModel: string;
  imageModel: string;
  apiKey: ProviderKeyInfo;
}

export interface UserAutoSocialProfile {
  primaryProvider: 'grok' | 'gemini';
  providers: {
    grok: ProviderSettings;
    gemini: ProviderSettings;
  };
  serverGeminiAvailable?: boolean;
}

export const GROK_TEXT_MODELS = [
  { id: 'grok-3-mini', label: 'Grok 3 Mini (fast)' },
  { id: 'grok-3', label: 'Grok 3' },
  { id: 'grok-4', label: 'Grok 4' },
];

export const GROK_IMAGE_MODELS = [
  { id: 'grok-imagine-image-quality', label: 'Grok Imagine (quality)' },
];

export const GEMINI_TEXT_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

export const GEMINI_IMAGE_MODELS = [
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
];

export interface SocialPost {
  id: string;
  date: string;
  status: string;
  topic?: { slug?: string; title?: string; angle?: string; siteLink?: string };
  sourceArticle?: {
    title?: string;
    url?: string;
    source?: string;
    publishedAt?: string;
    summary?: string;
  };
  facebook?: { caption?: string; imageUrl?: string; link?: string };
  instagram?: { caption?: string; hashtags?: string[]; imageUrl?: string; link?: string };
  x?: { caption?: string; imageUrl?: string; link?: string };
  imagePrompt?: string;
  workflowLog?: WorkflowStep[];
  modelsUsed?: { provider?: string; text?: string; image?: string };
  provider?: string;
  errors?: string[] | null;
  notifyError?: string;
}

async function autoSocialRequest<T>(
  user: User,
  method: 'GET' | 'POST',
  options: { query?: Record<string, string>; body?: Record<string, unknown> } = {}
): Promise<T> {
  const url = new URL('/api/autoposter', window.location.origin);
  if (options.query) {
    Object.entries(options.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return adminJson<T>(url.pathname + url.search, user, {
    method,
    body: method === 'POST' ? JSON.stringify(options.body) : undefined,
  });
}

export const listPosts = (user: User, limit = 30) =>
  autoSocialRequest<{ posts: SocialPost[]; stats: unknown }>(user, 'GET', {
    query: { action: 'list', limit: String(limit) },
  });

export const getWorkflow = (user: User) =>
  autoSocialRequest<{
    pipeline: PipelineStep[];
    config: AutoSocialConfig;
    profile: UserAutoSocialProfile | null;
    models: { text: string; image: string };
  }>(user, 'GET', { query: { action: 'workflow' } });

export const getProfile = (user: User) =>
  autoSocialRequest<{ profile: UserAutoSocialProfile }>(user, 'GET', {
    query: { action: 'profile' },
  });

export const updateProfile = (user: User, profile: Record<string, unknown>) =>
  autoSocialRequest<{ profile: UserAutoSocialProfile }>(user, 'POST', {
    body: { action: 'updateProfile', ...profile },
  });

export const getConfig = (user: User) =>
  autoSocialRequest<{ config: AutoSocialConfig; pipeline?: PipelineStep[] }>(user, 'GET', {
    query: { action: 'config' },
  });

export const generatePost = (user: User, force = false) =>
  autoSocialRequest<{ post: SocialPost; skipped?: boolean; reason?: string }>(user, 'POST', {
    body: { action: 'generate', force },
  });

export const approvePost = (user: User, postId: string) =>
  autoSocialRequest(user, 'POST', { body: { action: 'approve', postId } });

export const rejectPost = (user: User, postId: string) =>
  autoSocialRequest(user, 'POST', { body: { action: 'reject', postId } });

export const markPosted = (user: User, postId: string) =>
  autoSocialRequest(user, 'POST', { body: { action: 'markPosted', postId } });

export const updateCaptions = (
  user: User,
  postId: string,
  updates: Record<string, { caption: string }>
) => autoSocialRequest(user, 'POST', { body: { action: 'update', postId, updates } });

export const updateConfig = (user: User, config: Partial<AutoSocialConfig>) =>
  autoSocialRequest<{ config: AutoSocialConfig }>(user, 'POST', {
    body: { action: 'updateConfig', ...config },
  });

export const sendTestSms = (user: User, phone: string) =>
  autoSocialRequest(user, 'POST', { body: { action: 'testSms', phone } });

export function copyPostBundle(post: SocialPost, platform: PlatformId) {
  const p = post[platform];
  if (!p) return '';
  const lines = [p.caption || ''];
  if (p.link && !p.caption?.includes(p.link)) lines.push('', p.link);
  if (platform === 'instagram' && post.instagram?.hashtags?.length) {
    const tagLine = post.instagram.hashtags.join(' ');
    if (!p.caption?.includes(tagLine)) lines.push('', tagLine);
  }
  return lines.join('\n').trim();
}

export function buildPlatformPostUrl(
  platform: PlatformId,
  caption: string,
  socialLinks: SocialLinks
) {
  const text = String(caption || '').trim();
  if (platform === 'x') {
    const params = new URLSearchParams();
    if (text) params.set('text', text.slice(0, 280));
    const qs = params.toString();
    return qs
      ? `https://twitter.com/intent/tweet?${qs}`
      : socialLinks.x || 'https://twitter.com/compose/tweet';
  }
  if (platform === 'facebook') return socialLinks.facebook || 'https://www.facebook.com/';
  if (platform === 'instagram') return socialLinks.instagram || 'https://www.instagram.com/';
  return '#';
}

export function formatPostDate(dateStr: string) {
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
