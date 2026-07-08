import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import DynamicAppRunner from '../../components/hive-apps/DynamicAppRunner';
import { getEnhancedExampleApp } from '../../components/hive-apps/enhancedExampleApps';
import { fetchToolkitApp } from '../../lib/hiveStoreApi';
import type { HiveAppSpec } from '../../lib/hiveAppTypes';

const HIVE_USER_KEY = 'aibhive_hive_user_id';

/** Minimal shell for mobile WebView — no site nav, assistant, or runner chrome. */
export default function HiveAppEmbedPage() {
  const { appId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const hiveUserId = searchParams.get('hiveUserId') || '';
  const [app, setApp] = useState<HiveAppSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hiveUserId) return;
    try {
      localStorage.setItem(HIVE_USER_KEY, hiveUserId);
    } catch {
      /* private mode */
    }
  }, [hiveUserId]);

  const loadApp = useCallback(async () => {
    if (!appId) return;
    setLoading(true);
    setError('');
    try {
      const a = await fetchToolkitApp(appId);
      if (!a) {
        setError('App not found.');
        setApp(null);
      } else {
        setApp(a);
      }
    } catch {
      setError('Could not load this app.');
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    void loadApp();
  }, [loadApp]);

  if (loading && !app) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white font-bold mb-1">{error || 'App not found'}</p>
        <p className="text-slate-500 text-sm">Pull to refresh or check your connection.</p>
      </div>
    );
  }

  const Enhanced = getEnhancedExampleApp(app.id);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#070a0f] flex flex-col">
      <main className="flex-1 w-full min-h-0 overflow-auto p-2 sm:p-4">
        {Enhanced ? <Enhanced expanded /> : <DynamicAppRunner app={app} expanded />}
      </main>
    </div>
  );
}
