import { useEffect, useState } from 'react';
import DynamicAppRunner from '../../components/hive-apps/DynamicAppRunner';
import { getEnhancedExampleApp } from '../../components/hive-apps/enhancedExampleApps';
import { fetchToolkitApp } from '../../lib/hiveStoreApi';
import type { HiveAppSpec } from '../../lib/hiveAppTypes';

type Props = {
  appId: string | null;
  className?: string;
};

/** Live in-browser app panel for the store split layout. */
export default function HiveAppLivePanel({ appId, className = '' }: Props) {
  const [app, setApp] = useState<HiveAppSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appId) {
      setApp(null);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    fetchToolkitApp(appId)
      .then((a) => {
        setApp(a);
        if (!a) setError('Could not load this app.');
      })
      .catch(() => setError('Could not load this app.'))
      .finally(() => setLoading(false));
  }, [appId]);

  if (!appId) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center min-h-[480px] ${className}`}>
        <p className="text-white font-bold text-lg">Pick an app to run</p>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Select Job Tracker, Resume, or Research from the list — it opens here instantly.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-[#0b0f14] min-h-[480px] text-slate-400 ${className}`}>
        Loading app…
      </div>
    );
  }

  if (!app || error) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0b0f14] min-h-[480px] p-8 text-center ${className}`}>
        <p className="text-white font-bold">{error || 'App not found'}</p>
      </div>
    );
  }

  const Enhanced = getEnhancedExampleApp(app.id);

  return (
    <div className={`flex flex-col min-h-[480px] ${className}`}>
      {Enhanced ? <Enhanced expanded={false} /> : <DynamicAppRunner app={app} expanded={false} />}
      <p className="text-center text-slate-600 text-xs mt-4">
        Data saves in this browser ·{' '}
        <a href={`/hive-apps/app/${app.id}`} className="text-bee-amber hover:underline">
          Details & install
        </a>
      </p>
    </div>
  );
}
