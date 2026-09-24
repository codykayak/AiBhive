import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_BUSINESSES } from '../lib/defaults';
import {
  getActiveBusinessId,
  getAuthToken,
  getLocalBusinesses,
  getLocalLeads,
  saveLocalBusinesses,
  saveLocalLeads,
  setActiveBusinessId,
} from '../lib/storage';
import {
  fetchLeadsFromServer,
  fetchWorkspaceMe,
  importLeadsBulk,
  inviteWorkspaceMember,
  normalizePhone,
  type WorkspaceMe,
} from '../lib/api';
import { signInWithGoogleMobile, signOutGoogleMobile } from '../lib/googleAuth';
import type { Business, Lead } from '../lib/types';

type Ctx = {
  businesses: Business[];
  active: Business | null;
  leads: Lead[];
  workspace: WorkspaceMe | null;
  canEditLeads: boolean;
  setActive: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  upsertLead: (lead: Lead) => Promise<void>;
  importLeads: (incoming: Lead[]) => Promise<{ added: number; total: number }>;
  updateBusiness: (patch: Partial<Business>) => Promise<void>;
  addBusiness: (b: Business) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  inviteTeammate: (email: string) => Promise<{ message?: string; joinUrl?: string }>;
  reloadLeads: () => Promise<void>;
};

async function mergeServerLeads(businessId: string, local: Lead[]): Promise<Lead[]> {
  try {
    const token = await getAuthToken();
    if (!token) return local;
    const { leads: remote } = await fetchLeadsFromServer(businessId);
    if (!remote?.length) return local;
    const byPhone = new Map<string, Lead>();
    for (const l of local) byPhone.set(normalizePhone(l.phone), l);
    for (const l of remote) {
      const key = normalizePhone(l.phone);
      byPhone.set(key, { ...byPhone.get(key), ...l, phone: key });
    }
    const merged = Array.from(byPhone.values());
    await saveLocalLeads(businessId, merged);
    return merged;
  } catch {
    return local;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(DEFAULT_BUSINESSES);
  const [activeId, setActiveId] = useState<string>('macrorei');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceMe | null>(null);

  const loadWorkspace = async () => {
    try {
      const me = await fetchWorkspaceMe();
      setWorkspace(me);
    } catch {
      setWorkspace(null);
    }
  };

  const refresh = async () => {
    const stored = await getLocalBusinesses();
    const merged = DEFAULT_BUSINESSES.map((d) => {
      const s = stored.find((x) => x.id === d.id);
      return s ? { ...d, ...s } : d;
    });
    const extras = stored.filter((s) => !DEFAULT_BUSINESSES.some((d) => d.id === s.id));
    setBusinesses([...merged, ...extras]);
    const aid = (await getActiveBusinessId()) || 'macrorei';
    setActiveId(aid);
    const local = await getLocalLeads(aid);
    const synced = await mergeServerLeads(aid, local);
    setLeads(synced);
    await loadWorkspace();
  };

  useEffect(() => {
    void refresh();
    void (async () => {
      const { BUILTIN_DEVICE_SECRET, BUILTIN_OWNER_UID } = await import('./builtinAccess');
      const { getDeviceSecret, setDeviceSecret, getDeviceUid, setDeviceUid } = await import('./storage');
      if (!(await getDeviceSecret())) await setDeviceSecret(BUILTIN_DEVICE_SECRET);
      if (!(await getDeviceUid())) await setDeviceUid(BUILTIN_OWNER_UID);
    })();
  }, []);

  const active = businesses.find((b) => b.id === activeId) || businesses[0] || null;
  const canEditLeads = !workspace || workspace.role === 'editor' || workspace.role === 'owner';

  const setActive = async (id: string) => {
    await setActiveBusinessId(id);
    setActiveId(id);
    const local = await getLocalLeads(id);
    setLeads(await mergeServerLeads(id, local));
  };

  const upsertLead = async (lead: Lead) => {
    if (!canEditLeads) return;
    const next = [...leads.filter((l) => l.id !== lead.id), lead].sort((a, b) =>
      (b.lastContactAt || '').localeCompare(a.lastContactAt || ''),
    );
    setLeads(next);
    await saveLocalLeads(activeId, next);
  };

  const reloadLeads = async () => {
    const local = await getLocalLeads(activeId);
    setLeads(await mergeServerLeads(activeId, local));
  };

  const importLeads = async (incoming: Lead[]) => {
    if (!canEditLeads) {
      return { added: 0, total: leads.length };
    }
    const byPhone = new Map<string, Lead>();
    for (const l of leads) byPhone.set(normalizePhone(l.phone), l);
    let added = 0;
    for (const l of incoming) {
      const key = normalizePhone(l.phone);
      if (!byPhone.has(key)) added++;
      byPhone.set(key, { ...byPhone.get(key), ...l, phone: key, status: l.status || 'new' });
    }
    const next = Array.from(byPhone.values());
    setLeads(next);
    await saveLocalLeads(activeId, next);
    try {
      await importLeadsBulk(activeId, next);
    } catch {
      /* local list still works offline */
    }
    return { added, total: next.length };
  };

  const updateBusiness = async (patch: Partial<Business>) => {
    if (!active) return;
    const next = businesses.map((b) => (b.id === active.id ? { ...b, ...patch } : b));
    setBusinesses(next);
    await saveLocalBusinesses(next);
  };

  const addBusiness = async (b: Business) => {
    const next = [...businesses, b];
    setBusinesses(next);
    await saveLocalBusinesses(next);
  };

  const signInWithGoogle = async () => {
    await signInWithGoogleMobile();
    await refresh();
  };

  const signOutGoogle = async () => {
    await signOutGoogleMobile();
    setWorkspace(null);
  };

  const inviteTeammate = async (email: string) => {
    const result = await inviteWorkspaceMember(email.trim(), 'viewer');
    await loadWorkspace();
    return result;
  };

  const value = useMemo(
    () => ({
      businesses,
      active,
      leads,
      workspace,
      canEditLeads,
      setActive,
      refresh,
      upsertLead,
      importLeads,
      updateBusiness,
      addBusiness,
      signInWithGoogle,
      signOutGoogle,
      inviteTeammate,
      reloadLeads,
    }),
    [businesses, active, leads, workspace, canEditLeads],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
