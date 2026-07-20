import type { UserLocation } from './regions';

const STORAGE_KEY = 'living_knowledge_user_location';

export function loadUserLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (!parsed || typeof parsed.state !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUserLocation(loc: UserLocation): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

export function clearUserLocation(): void {
  localStorage.removeItem(STORAGE_KEY);
}
