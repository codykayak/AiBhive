import { SEO } from '../../components/SEO';
import WebPlansStrip from '../../components/app/WebPlansStrip';
import { Link } from 'react-router-dom';
import { Settings, Smartphone, Key, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchHiveAccount } from '../../lib/hiveBuildApi';
import { getOrCreateWebHiveUserId } from '../../lib/hiveWebUser';

export default function WebSettingsPage() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    void fetchHiveAccount().then((a) => {
      if (a && typeof a.creditBalanceUsd === 'number') setBalance(a.creditBalanceUsd);
    });
  }, []);

  const userId = getOrCreateWebHiveUserId();

  return (
    <>
      <SEO title="Settings — AiBhive Web" description="Hive credits, plans, and account on aibhive.com." noIndex />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-bee-amber/15 flex items-center justify-center">
            <Settings className="w-6 h-6 text-bee-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Web settings</h1>
            <p className="text-slate-400 text-sm">Same Hive account as mobile — credits shared when signed in</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Account</p>
          <p className="text-white font-mono text-sm break-all">{userId}</p>
          {balance != null ? (
            <p className="text-bee-amber font-bold mt-3">
              Hive credit balance: ${balance.toFixed(2)}
            </p>
          ) : (
            <p className="text-slate-500 text-sm mt-2">Sign in on mobile to sync credits across devices.</p>
          )}
        </div>

        <WebPlansStrip />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 p-5 space-y-2">
            <Key className="w-5 h-5 text-bee-amber" />
            <p className="text-white font-bold">Bring your own keys (BYOK)</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              AI, Gemini, Claude, and Firecrawl keys live in the mobile app Settings. Web uses Hive Cloud by default.
            </p>
            <a href="/api/download/apk" className="text-bee-amber text-sm font-bold hover:underline">
              Get the Android app →
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 p-5 space-y-2">
            <Smartphone className="w-5 h-5 text-bee-amber" />
            <p className="text-white font-bold">Push & OTA updates</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Build-ready notifications and over-the-air updates are on mobile. Web builds poll live in the browser.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-bee-amber/20 bg-bee-amber/5 p-5 flex gap-3">
          <Sparkles className="w-5 h-5 text-bee-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-bold">Tip</p>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">
              Use the Bhive Builder (bottom-right or top bar on research/build pages) for the same orchestration as
              mobile — research, install community tools, or start a build.
            </p>
            <Link to="/app" className="inline-block mt-3 text-bee-amber font-bold text-sm hover:underline">
              Open AiBhive Apps
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
