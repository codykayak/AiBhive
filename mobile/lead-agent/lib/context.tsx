import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_BUSINESSES } from '../lib/defaults';
import {
  getActiveBusinessId,
  getLocalBusinesses,
  getLocalLeads,
  saveLocalBusinesses,
  saveLocalLeads,
  setActiveBusinessId,
} from '../lib/storage';
import { normalizePhone } from '../lib/api';
import { importLeadsBulk } from '../lib/api';
import type { Business, Lead } from '../lib/types';

type Ctx = {
  businesses: Business[];
  active: Business | null;
  leads: Lead[];
  setActive: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  upsertLead: (lead: Lead) => Promise<void>;
  importLeads: (incoming: Lead[]) => Promise<{ added: number; total: number }>;
  updateBusiness: (patch: Partial<Business>) => Promise<void>;
  addBusiness: (b: Business) => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(DEFAULT_BUSINESSES);
  const [activeId, setActiveId] = useState<string>('macrorei');
  const [leads, setLeads] = useState<Lead[]>([]);

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
    setLeads(await getLocalLeads(aid));
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

  const setActive = async (id: string) => {
    await setActiveBusinessId(id);
    setActiveId(id);
    setLeads(await getLocalLeads(id));
  };

  const upsertLead = async (lead: Lead) => {
    const next = [...leads.filter((l) => l.id !== lead.id), lead].sort((a, b) =>
      (b.lastContactAt || '').localeCompare(a.lastContactAt || ''),
    );
    setLeads(next);
    await saveLocalLeads(activeId, next);
  };

  const importLeads = async (incoming: Lead[]) => {
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

  const value = useMemo(
    () => ({ businesses, active, leads, setActive, refresh, upsertLead, importLeads, updateBusiness, addBusiness }),
    [businesses, active, leads],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
