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
  library: 'hypnosis' | 'holistic' | 'animal-health' | null;
  topicId: string | null;
  authorUid: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  type: 'comment' | 'photo';
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
  body: { type: 'comment' | 'photo'; text?: string; imageUrl?: string },
): Promise<PlantMedicinePost> {
  return adminJson(`/api/plant-medicine/plants/${encodeURIComponent(plantId)}/posts`, user, {
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
  const token = await user.getIdToken();
  const res = await fetch('/api/plant-medicine/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plantId: opts.plantId,
      message: opts.message,
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

  if (res.status === 401) throw new Error(data.error || 'Sign in to use Ask AI');
  if (res.status === 402 || data.needPayment) {
    throw new PlantCreditsError(data.error || 'Hive credits depleted', data.amountUsd);
  }
  if (!res.ok || !data.reply) throw new Error(data.error || 'Ask AI request failed');

  return {
    reply: data.reply,
    chargedUsd: data.chargedUsd,
    creditBalanceUsd: data.account?.creditBalanceUsd,
  };
}
