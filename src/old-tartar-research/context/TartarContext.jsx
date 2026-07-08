import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createTartarApi } from '../lib/tartarApi';
import { listAppsForUser } from '../config/appRegistry';
import { PLATFORM_FEE_RATE } from '../config/schema';

const TartarContext = createContext(null);

export function TartarProvider({ children, user }) {
  const [syncing, setSyncing] = useState(true);
  const [profile, setProfile] = useState(null);
  const [customBuild, setCustomBuild] = useState(null);
  const [sources, setSources] = useState([]);
  const [effectiveFeeRate, setEffectiveFeeRate] = useState(PLATFORM_FEE_RATE);
  const [hasPromo, setHasPromo] = useState(false);
  const [archiveStats, setArchiveStats] = useState(null);
  const [error, setError] = useState(null);

  const api = useMemo(() => (user ? createTartarApi(user) : null), [user]);

  const refresh = useCallback(async () => {
    if (!user || !api) {
      setProfile(null);
      setCustomBuild(null);
      setSources([]);
      setSyncing(false);
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      await api.init();
      const data = await api.getProfile();
      setProfile(data.profile ?? null);
      setCustomBuild(data.customBuild ?? null);
      setSources(data.sources ?? []);
      setEffectiveFeeRate(data.effectiveFeeRate ?? PLATFORM_FEE_RATE);
      setHasPromo(Boolean(data.hasPromo));
      try {
        const stats = await api.getArchiveStats();
        setArchiveStats(stats);
      } catch {
        setArchiveStats(null);
      }
    } catch (e) {
      setError(e.message ?? 'Failed to load research profile');
    } finally {
      setSyncing(false);
    }
  }, [user, api]);

  useEffect(() => { void refresh(); }, [refresh]);

  const apps = listAppsForUser(customBuild, profile?.enabledApps);

  const value = {
    user,
    syncing,
    error,
    profile,
    customBuild,
    sources,
    apps,
    api,
    platformFeeRate: PLATFORM_FEE_RATE,
    effectiveFeeRate,
    hasPromo,
    archiveStats,
    refresh,
    setCustomBuild,
    setProfile,
    setSources,
  };

  return <TartarContext.Provider value={value}>{children}</TartarContext.Provider>;
}

export function useTartar() {
  const ctx = useContext(TartarContext);
  if (!ctx) throw new Error('useTartar must be used within TartarProvider');
  return ctx;
}
