import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Maximize2, RefreshCw } from 'lucide-react';
import DynamicAppRunner from '../../components/hive-apps/DynamicAppRunner';
import { getEnhancedExampleApp } from '../../components/hive-apps/enhancedExampleApps';
import { fetchToolkitApp } from '../../lib/hiveStoreApi';
import { AssistantTopSpacer } from '../../components/HomeAssistantWeb';
import BuildPlatformStrip from '../../components/BuildPlatformStrip';
import type { HiveAppSpec } from '../../lib/hiveAppTypes';

/** Full-screen in-browser app runner — polls for spec updates after tweaks/builds. */
export default function HiveAppRunPage() {
  const { appId = '' } = useParams();
  const [app, setApp] = useState<HiveAppSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const lastUpdatedRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadApp = useCallback(
    async (silent = false) => {
      if (!appId) return;
      if (!silent) {
        setLoading(true);
        setError('');
      }
      try {
        const a = await fetchToolkitApp(appId);
        if (!a) {
          setError('App not found.');
          setApp(null);
        } else {
          const updated = (a as HiveAppSpec & { updatedAt?: string }).updatedAt;
          if (updated && updated !== lastUpdatedRef.current) {
            lastUpdatedRef.current = updated;
            setVersion((v) => v + 1);
          }
          setApp(a);
        }
      } catch {
        if (!silent) setError('Could not load this app.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [appId]
  );

  useEffect(() => {
    void loadApp();
    pollRef.current = setInterval(() => void loadApp(true), 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadApp]);

  if (loading && !app) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-white font-bold mb-2">{error || 'App not found'}</p>
        <Link to="/hive-apps" className="text-bee-amber font-bold text-sm">
          ← Back to store
        </Link>
      </div>
    );
  }

  const Enhanced = getEnhancedExampleApp(app.id);
  const isTartarApp = app.id === 'example-old-tartar-research';

  return (
    <div className={`min-h-screen flex flex-col ${isTartarApp ? 'bg-[#0a0e14]' : 'bg-[#070a0f]'}`}>
      <AssistantTopSpacer />
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#070a0f]/95 backdrop-blur">
        <Link
          to={app.isExample ? `/hive-apps?app=${app.id}` : `/hive-apps/app/${app.id}`}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          {app.title}
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadApp()}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
            title="Refresh app"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!app.isExample ? (
            <Link
              to={`/hive-apps/app/${app.id}`}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
              title="App details"
            >
              <Maximize2 className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to={`/hive-apps/app/${app.id}`}
              className="text-xs font-bold text-bee-amber hover:underline"
            >
              Details
            </Link>
          )}
        </div>
      </header>
      <main className={isTartarApp ? 'flex-1 w-full p-0' : 'flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'}>
        <div key={`${app.id}-${version}`}>
          {Enhanced ? <Enhanced expanded /> : <DynamicAppRunner app={app} expanded />}
        </div>
      </main>
      {!isTartarApp && <BuildPlatformStrip />}
    </div>
  );
}
