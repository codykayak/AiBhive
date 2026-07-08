import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createTartarApi } from '../lib/tartarApi';
import { listAppsForUser } from '../config/appRegistry';
import { PLATFORM_FEE_RATE } from '../config/schema';

const TartarContext = createContext(null);

export function TartarProvider({ children, user }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [customBuild, setCustomBuild] = useState(null);
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);

  const api = useMemo(() => (user ? createTartarApi(user) : null), [user]);

  const refresh = useCallback(async () => {
    if (!user || !api) {
      setProfile(null);
      setCustomBuild(null);
      setSources([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.init();
      const data = await api.getProfile();
      setProfile(data.profile);
      setCustomBuild(data.customBuild);
      setSources(data.sources ?? []);
    } catch (e) {
      setError(e.message ?? 'Failed to load research profile');
    } finally {
      setLoading(false);
    }
  }, [user, api]);

  useEffect(() => { refresh(); }, [refresh]);

  const apps = listAppsForUser(customBuild, profile?.enabledApps);

  const value = {
    user,
    loading,
    error,
    profile,
    customBuild,
    sources,
    apps,
    api,
    platformFeeRate: PLATFORM_FEE_RATE,
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
