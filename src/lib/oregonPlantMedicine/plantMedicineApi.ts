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
  plantId: string;
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
