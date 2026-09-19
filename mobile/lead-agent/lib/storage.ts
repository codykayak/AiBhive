import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Business, Lead } from './types';

const KEYS = {
  activeBusiness: 'leadagent.activeBusiness',
  businesses: 'leadagent.businesses',
  leads: (id: string) => `leadagent.leads.${id}`,
  apiBase: 'leadagent.apiBase',
  authToken: 'leadagent.authToken',
  deviceSecret: 'leadagent.deviceSecret',
  deviceUid: 'leadagent.deviceUid',
};

export async function getActiveBusinessId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.activeBusiness);
}

export async function setActiveBusinessId(id: string) {
  await AsyncStorage.setItem(KEYS.activeBusiness, id);
}

export async function getLocalBusinesses(): Promise<Business[]> {
  const raw = await AsyncStorage.getItem(KEYS.businesses);
  return raw ? JSON.parse(raw) : [];
}

export async function saveLocalBusinesses(businesses: Business[]) {
  await AsyncStorage.setItem(KEYS.businesses, JSON.stringify(businesses));
}

export async function updateBusinessLocal(businessId: string, patch: Partial<Business>) {
  const stored = await getLocalBusinesses();
  const idx = stored.findIndex((b) => b.id === businessId);
  if (idx >= 0) {
    await saveLocalBusinesses(stored.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
    return;
  }
  await saveLocalBusinesses([...stored, { id: businessId, name: businessId, ...patch } as Business]);
}

export async function getLocalLeads(businessId: string): Promise<Lead[]> {
  const raw = await AsyncStorage.getItem(KEYS.leads(businessId));
  return raw ? JSON.parse(raw) : [];
}

export async function saveLocalLeads(businessId: string, leads: Lead[]) {
  await AsyncStorage.setItem(KEYS.leads(businessId), JSON.stringify(leads));
}

export async function getApiBase(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.apiBase)) || 'https://aibhive.com';
}

export async function setApiBase(url: string) {
  await AsyncStorage.setItem(KEYS.apiBase, url.replace(/\/$/, ''));
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.authToken);
}

export async function setAuthToken(token: string | null) {
  if (token) await AsyncStorage.setItem(KEYS.authToken, token);
  else await AsyncStorage.removeItem(KEYS.authToken);
}

export async function getDeviceSecret(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.deviceSecret);
}

export async function setDeviceSecret(secret: string | null) {
  if (secret?.trim()) await AsyncStorage.setItem(KEYS.deviceSecret, secret.trim());
  else await AsyncStorage.removeItem(KEYS.deviceSecret);
}

export async function getDeviceUid(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.deviceUid);
}

export async function setDeviceUid(uid: string | null) {
  if (uid?.trim()) await AsyncStorage.setItem(KEYS.deviceUid, uid.trim());
  else await AsyncStorage.removeItem(KEYS.deviceUid);
}
