import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Smartphone, Globe, Wrench, LayoutGrid } from 'lucide-react';
import { useCallback, useState, type FormEvent } from 'react';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'mobile', label: 'Mobile apps', icon: Smartphone, path: '/hive-apps' },
  { id: 'web', label: 'Web apps', icon: Globe, path: '/hive-apps?tab=web' },
  { id: 'build', label: 'Build new', icon: Wrench, path: '/hive-apps/build' },
] as const;

export default function HiveAppsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [draft, setDraft] = useState(searchParams.get('q') || '');

  const tab = location.pathname.includes('/build')
    ? 'build'
    : searchParams.get('tab') === 'web'
      ? 'web'
      : 'mobile';

  const onSearch = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const q = draft.trim();
      if (tab === 'build') {
        navigate(q ? `/hive-apps/build?q=${encodeURIComponent(q)}` : '/hive-apps/build');
        return;
      }
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tab === 'web') params.set('tab', 'web');
      navigate(`/hive-apps${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [draft, navigate, tab]
  );

  const isRunPage = location.pathname.includes('/run/');
  const isDetail = location.pathname.includes('/app/');

  if (isRunPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#070a0f]">
      {/* Store header — app-store chrome */}
      <div className="sticky top-20 z-40 border-b border-white/5 bg-[#070a0f]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <Link to="/hive-apps" className="flex items-center gap-3 shrink-0 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <LayoutGrid className="w-6 h-6 text-bee-black" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-none tracking-tight">Hive Apps</p>
                <p className="text-slate-500 text-xs font-semibold">Community app store</p>
              </div>
            </Link>

            <form onSubmit={onSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Search trackers, calculators, lists…"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 outline-none focus:border-bee-amber/40 focus:ring-1 focus:ring-bee-amber/20"
                />
              </div>
            </form>

            <a
              href="https://aibhive.com/api/download/apk"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-bee-amber text-bee-black text-sm font-bold hover:bg-bee-yellow transition-colors shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              Get AiBhive
            </a>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <Link
                  key={t.id}
                  to={t.path}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all',
                    active
                      ? 'bg-bee-amber text-bee-black'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Outlet />

      {!isDetail && tab !== 'build' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-bee-amber" />
              <h2 className="text-white font-bold">How the pool works</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
              Build in plain English on your phone, opt in to share when you love it, install community apps free,
              tweak in seconds (~$0.50), or full Cursor customize (~$4+). We never publish half-built drafts.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
