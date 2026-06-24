import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Play, Wand2, Smartphone, Share2, ChevronLeft } from 'lucide-react';
import { SEO } from '../../components/SEO';
import DynamicAppRunner from '../../components/hive-apps/DynamicAppRunner';
import { brandFor, iconFor, CATEGORY_LABELS } from '../../lib/hiveAppBranding';
import { fetchToolkitApp, installToolkitApp } from '../../lib/hiveStoreApi';
import { getHiveWebAuthHeaders } from '../../lib/hiveWebAuth';
import type { HiveAppSpec } from '../../lib/hiveAppTypes';

export default function HiveAppDetailPage() {
  const { appId = '' } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<HiveAppSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    fetchToolkitApp(appId)
      .then((a) => {
        setApp(a);
        if (!a) setError('App not found.');
      })
      .finally(() => setLoading(false));
  }, [appId]);

  const onInstall = async () => {
    if (!appId) return;
    setInstalling(true);
    setError('');
    try {
      const { userId, idToken } = await getHiveWebAuthHeaders();
      const result = await installToolkitApp(appId, userId, idToken);
      if (!result) {
        setError('Install failed. Try again or open in the AiBhive app.');
        return;
      }
      setInstalled(true);
    } catch {
      setError('Sign-in failed. Try the mobile app.');
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading app…
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-white font-bold mb-2">{error || 'App not found'}</p>
        <Link to="/hive-apps" className="text-bee-amber font-bold text-sm">← Back to store</Link>
      </div>
    );
  }

  const brand = brandFor(app.theme);
  const Icon = iconFor(app.icon);
  const deepLink = `aibhive://app/${app.id}`;

  return (
    <>
      <SEO
        title={`${app.title} — Hive Apps | AiBhive`}
        description={app.summary || app.tagline || `Install ${app.title} free from the AiBhive community store.`}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/hive-apps" className="inline-flex items-center gap-1 text-slate-400 hover:text-bee-amber text-sm font-semibold mb-6">
          <ChevronLeft className="w-4 h-4" />
          Store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left — store listing */}
          <div>
            <div className="flex gap-5 items-start mb-6">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${brand.gradientFrom}, ${brand.gradientTo})` }}
              >
                <Icon className="w-12 h-12" style={{ color: brand.contrastText }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-white">{app.title}</h1>
                {app.tagline ? <p className="text-slate-400 mt-1">{app.tagline}</p> : null}
                <div className="flex flex-wrap gap-2 mt-3">
                  {app.category ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-slate-300">
                      {CATEGORY_LABELS[app.category] || app.category}
                    </span>
                  ) : null}
                  {app.isExample ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-400">
                      Browser demo
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      Free install
                    </span>
                  )}
                  {!app.isExample ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-bee-amber/10 text-bee-amber">
                      {(app.installCount || 0).toLocaleString()} installs
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {app.summary ? (
              <p className="text-slate-300 leading-relaxed mb-6">{app.summary}</p>
            ) : null}

            <div className="mb-8">
              <h2 className="text-white font-bold mb-3">Pages included</h2>
              <div className="flex flex-wrap gap-2">
                {(app.pages || []).map((p) => (
                  <span
                    key={p.id}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-300"
                  >
                    {p.title}{' '}
                    <span className="text-slate-500 text-xs">({p.type})</span>
                  </span>
                ))}
              </div>
            </div>

            <DynamicAppRunner app={app} />
          </div>

          {/* Right — action panel (Play Store style) */}
          <aside className="lg:sticky lg:top-44 h-fit space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <button
                type="button"
                onClick={() => navigate(`/hive-apps/run/${app.id}`)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-bee-amber text-bee-black font-extrabold hover:bg-bee-yellow transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                Try in browser
              </button>

              <button
                type="button"
                onClick={() => void onInstall()}
                disabled={installing || installed}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-bee-amber/50 text-bee-amber font-extrabold hover:bg-bee-amber/10 transition-colors disabled:opacity-60"
              >
                <Download className="w-5 h-5" />
                {installed ? 'Added to your library' : installing ? 'Installing…' : 'Add to My Apps'}
              </button>

              {error ? <p className="text-red-400 text-xs">{error}</p> : null}

              {installed ? (
                <div className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/5">
                  <p>Open in AiBhive to tweak, customize, or export:</p>
                  <a href={deepLink} className="flex items-center gap-2 text-bee-amber font-bold">
                    <Smartphone className="w-4 h-4" />
                    Open in mobile app
                  </a>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 text-sm">
              <p className="text-white font-bold flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-bee-amber" />
                After install
              </p>
              <ul className="text-slate-400 space-y-2 text-xs leading-relaxed">
                <li>• <strong className="text-slate-300">Quick tweak</strong> — ~$0.50, instant spec edits</li>
                <li>• <strong className="text-slate-300">Full customize</strong> — ~$4+, Cursor code & branding</li>
                <li>• <strong className="text-slate-300">Export</strong> — publish as web link or APK</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-white font-bold text-sm flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-bee-amber" />
                Share this listing
              </p>
              <p className="text-slate-500 text-xs break-all">
                {typeof window !== 'undefined' ? window.location.href : `https://aibhive.com/hive-apps/app/${app.id}`}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
