import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Maximize2 } from 'lucide-react';
import DynamicAppRunner from '../../components/hive-apps/DynamicAppRunner';
import { fetchToolkitApp } from '../../lib/hiveStoreApi';
import type { HiveAppSpec } from '../../lib/hiveAppTypes';

/** Full-screen in-browser app runner — minimal chrome. */
export default function HiveAppRunPage() {
  const { appId = '' } = useParams();
  const [app, setApp] = useState<HiveAppSpec | null>(null);

  useEffect(() => {
    if (!appId) return;
    fetchToolkitApp(appId).then(setApp);
  }, [appId]);

  if (!app) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#070a0f]/95 backdrop-blur">
        <Link
          to={`/hive-apps/app/${app.id}`}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          {app.title}
        </Link>
        <Link
          to={`/hive-apps/app/${app.id}`}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
          title="App details"
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full p-4">
        <DynamicAppRunner app={app} />
        <p className="text-center text-slate-600 text-xs mt-6">
          Data saved in this browser only ·{' '}
          <Link to={`/hive-apps/app/${app.id}`} className="text-bee-amber hover:underline">
            Install to customize
          </Link>
        </p>
      </main>
    </div>
  );
}
