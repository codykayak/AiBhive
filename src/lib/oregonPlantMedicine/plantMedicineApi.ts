import type { User } from 'firebase/auth';
import { adminFetch, adminJson } from '../adminApi';

export type PlantMedicineProfile = {
  uid: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PlantMedicinePost = {
  id: string;
  plantId: string | null;
  essayId?: string | null;
  threadPostId?: string | null;
  library: 'hypnosis' | 'holistic' | 'animal-health' | null;
  topicId: string | null;
  authorUid: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  type: 'comment' | 'photo' | 'feed';
  title?: string | null;
  text: string;
  imageUrl: string | null;
  status: string;
  upvoteCount: number;
  createdAt: string | null;
  viewerHasUpvoted: boolean;
};

export async function fetchMyProfile(user: User | null): Promise<PlantMedicineProfile | null> {
  const headers: HeadersInit = {};
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch('/api/plant-medicine/profile/me', { headers });
  if (!res.ok) throw new Error('Failed to load profile');
  const data = (await res.json()) as { profile: PlantMedicineProfile | null };
  return data.profile;
}

export function saveProfile(
  user: User,
  body: { displayName: string; bio: string; avatarUrl?: string | null },
): Promise<PlantMedicineProfile> {
  return adminJson('/api/plant-medicine/profile/me', user, {
    method: 'PUT',
    body: JSON.stringify(body),
  }).then((d) => (d as { profile: PlantMedicineProfile }).profile);
}

export async function uploadPlantImage(
  user: User,
  file: File,
  kind: 'avatar' | 'photo',
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  const base64 = btoa(binary);
  const data = await adminJson<{ url: string }>('/api/plant-medicine/upload', user, {
    method: 'POST',
    body: JSON.stringify({ base64, mimeType: file.type || 'image/jpeg', kind }),
  });
  return data.url;
}

export async function fetchCommunityFeed(user: User | null): Promise<PlantMedicinePost[]> {
  const headers: HeadersInit = {};
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  const res = await fetch('/api/plant-medicine/feed', { headers });
  if (!res.ok) throw new Error('Failed to load community feed');
  const data = (await res.json()) as { posts: PlantMedicinePost[] };
  return data.posts;
}

export async function fetchPlantPosts(
  plantId: string,
  user: User | null,
  type?: 'comment' | 'photo',
): Promise<PlantMedicinePost[]> {
  const params = type ? `?type=${type}` : '';
  const headers: HeadersInit = {};
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  const res = await fetch(`/api/plant-medicine/plants/${encodeURIComponent(plantId)}/posts${params}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to load community posts');
  const data = (await res.json()) as { posts: PlantMedicinePost[] };
  return data.posts;
}

export function createPlantPost(
  user: User,
  plantId: string,
  body: { type: 'comment' | 'photo'; title?: string; text?: string; imageUrl?: string },
): Promise<PlantMedicinePost> {
  return adminJson(`/api/plant-medicine/plants/${encodeURIComponent(plantId)}/posts`, user, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((d) => (d as { post: PlantMedicinePost }).post);
}

export function createFeedPost(
  user: User,
  body: { title: string; text?: string; imageUrl?: string; plantId?: string },
): Promise<PlantMedicinePost> {
  return adminJson('/api/plant-medicine/feed/posts', user, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((d) => (d as { post: PlantMedicinePost }).post);
}

export function togglePostUpvote(
  user: User,
  postId: string,
): Promise<{ upvoteCount: number; viewerHasUpvoted: boolean }> {
  return adminJson(`/api/plant-medicine/posts/${postId}/upvote`, user, { method: 'POST' });
}

export function deletePlantPost(user: User, postId: string): Promise<void> {
  return adminFetch(`/api/plant-medicine/posts/${postId}`, user, { method: 'DELETE' }).then((res) => {
    if (!res.ok) throw new Error('Delete failed');
  });
}

export type TopicLibraryId = 'hypnosis' | 'holistic' | 'animal-health';

export async function fetchTopicPosts(
  library: TopicLibraryId,
  topicId: string,
  user: User | null,
  type?: 'comment' | 'photo',
): Promise<PlantMedicinePost[]> {
  const params = type ? `?type=${type}` : '';
  const headers: HeadersInit = {};
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  const res = await fetch(
    `/api/plant-medicine/libraries/${encodeURIComponent(library)}/topics/${encodeURIComponent(topicId)}/posts${params}`,
    { headers },
  );
  if (!res.ok) throw new Error('Failed to load topic posts');
  const data = (await res.json()) as { posts: PlantMedicinePost[] };
  return data.posts;
}

export function createTopicPost(
  user: User,
  library: TopicLibraryId,
  topicId: string,
  body: { type: 'comment' | 'photo'; text?: string; imageUrl?: string },
): Promise<PlantMedicinePost> {
  return adminJson(
    `/api/plant-medicine/libraries/${encodeURIComponent(library)}/topics/${encodeURIComponent(topicId)}/posts`,
    user,
    { method: 'POST', body: JSON.stringify(body) },
  ).then((d) => (d as { post: PlantMedicinePost }).post);
}

export type ContentEngagementKind = 'plant' | 'holistic' | 'hypnosis' | 'animal-health' | 'essay';

export type ContentEngagement = {
  upvoteCount: number;
  commentCount: number;
  viewerHasUpvoted: boolean;
};

export async function fetchContentEngagement(
  kind: ContentEngagementKind,
  contentId: string,
  user: User | null,
): Promise<ContentEngagement> {
  const headers: HeadersInit = {};
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  const res = await fetch(
    `/api/plant-medicine/content/${encodeURIComponent(kind)}/${encodeURIComponent(contentId)}/engagement`,
    { headers },
  );
  if (!res.ok) throw new Error('Failed to load engagement');
  const data = (await res.json()) as { engagement: ContentEngagement };
  return data.engagement;
}

export function toggleContentUpvote(
  user: User,
  kind: ContentEngagementKind,
  contentId: string,
): Promise<{ upvoteCount: number; viewerHasUpvoted: boolean }> {
  return adminJson(
    `/api/plant-medicine/content/${encodeURIComponent(kind)}/${encodeURIComponent(contentId)}/upvote`,
    user,
    { method: 'POST' },
  );
}

export async function fetchEssayPosts(
  essayId: string,
  user: User | null,
  type?: 'comment' | 'photo',
): Promise<PlantMedicinePost[]> {
  const params = type ? `?type=${type}` : '';
  const headers: HeadersInit = {};
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  const res = await fetch(`/api/plant-medicine/essays/${encodeURIComponent(essayId)}/posts${params}`, { headers });
  if (!res.ok) throw new Error('Failed to load essay posts');
  const data = (await res.json()) as { posts: PlantMedicinePost[] };
  return data.posts;
}

export function createEssayPost(
  user: User,
  essayId: string,
  body: { type: 'comment' | 'photo'; text?: string; imageUrl?: string },
): Promise<PlantMedicinePost> {
  return adminJson(`/api/plant-medicine/essays/${encodeURIComponent(essayId)}/posts`, user, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((d) => (d as { post: PlantMedicinePost }).post);
}

export async function fetchThreadComments(postId: string, user: User | null): Promise<PlantMedicinePost[]> {
  const headers: HeadersInit = {};
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  const res = await fetch(`/api/plant-medicine/posts/${encodeURIComponent(postId)}/comments`, { headers });
  if (!res.ok) throw new Error('Failed to load comments');
  const data = (await res.json()) as { posts: PlantMedicinePost[] };
  return data.posts;
}

export function createThreadComment(user: User, postId: string, text: string): Promise<PlantMedicinePost> {
  return adminJson(`/api/plant-medicine/posts/${encodeURIComponent(postId)}/comments`, user, {
    method: 'POST',
    body: JSON.stringify({ text }),
  }).then((d) => (d as { post: PlantMedicinePost }).post);
}

export type PlantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export class PlantCreditsError extends Error {
  amountUsd?: number;

  constructor(message: string, amountUsd?: number) {
    super(message);
    this.name = 'PlantCreditsError';
    this.amountUsd = amountUsd;
  }
}

/**
 * Living Knowledge chat:
 * - HolisticAskAgent (Diagnose-style): pass `context` + optional `scope` → free `/living-knowledge-chat`
 * - Ask AiBhive / plant focus: pass plantId / essayId / library / topicId / contextText → `/chat`
 * Both support multi-turn `history`.
 */
export async function sendLivingKnowledgeChat(
  user: User,
  opts: {
    message: string;
    history?: PlantChatMessage[];
    /** Client RAG blocks for HolisticAskAgent */
    context?: string;
    scope?: string;
    plantId?: string;
    essayId?: string;
    library?: TopicLibraryId;
    topicId?: string;
    contextText?: string;
    focusTitle?: string;
  },
): Promise<{
  reply: string;
  chargedUsd?: number;
  creditBalanceUsd?: number;
}> {
  const token = await user.getIdToken();

  // HolisticAskAgent path — client-supplied RAG context
  if (typeof opts.context === 'string') {
    const res = await fetch('/api/plant-medicine/living-knowledge-chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: opts.message,
        context: opts.context,
        scope: opts.scope ?? 'all',
        history: opts.history ?? [],
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      reply?: string;
      error?: string;
      needPayment?: boolean;
      amountUsd?: number;
      chargedUsd?: number;
      account?: { creditBalanceUsd?: number };
    };

    if (res.status === 401) throw new Error(data.error || 'Sign in for online enhancement');
    if (res.status === 402 || data.needPayment) {
      throw new PlantCreditsError(data.error || 'Hive credits depleted', data.amountUsd);
    }
    if (!res.ok || !data.reply) throw new Error(data.error || 'Living Knowledge chat failed');

    return {
      reply: data.reply,
      chargedUsd: data.chargedUsd,
      creditBalanceUsd: data.account?.creditBalanceUsd,
    };
  }

  const res = await fetch('/api/plant-medicine/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: opts.message,
      history: opts.history ?? [],
      plantId: opts.plantId,
      essayId: opts.essayId,
      library: opts.library,
      topicId: opts.topicId,
      contextText: opts.contextText,
      focusTitle: opts.focusTitle,
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    reply?: string;
    error?: string;
    needPayment?: boolean;
    amountUsd?: number;
    chargedUsd?: number;
    account?: { creditBalanceUsd?: number };
  };

  if (res.status === 401) throw new Error(data.error || 'Sign in to use Ask AiBhive');
  if (res.status === 402 || data.needPayment) {
    throw new PlantCreditsError(data.error || 'Hive credits depleted', data.amountUsd);
  }
  if (!res.ok || !data.reply) throw new Error(data.error || 'Ask AiBhive request failed');

  return {
    reply: data.reply,
    chargedUsd: data.chargedUsd,
    creditBalanceUsd: data.account?.creditBalanceUsd,
  };
}

export async function sendPlantChat(
  user: User,
  opts: {
    plantId: string;
    message: string;
    history?: PlantChatMessage[];
  },
): Promise<{
  reply: string;
  chargedUsd?: number;
  creditBalanceUsd?: number;
}> {
  return sendLivingKnowledgeChat(user, opts);
}
