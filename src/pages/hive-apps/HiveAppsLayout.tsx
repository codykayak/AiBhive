import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Smartphone, Globe, Wrench, LayoutGrid } from 'lucide-react';
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

  if (
    location.pathname.includes('/run/') ||
    location.pathname.includes('/embed/') ||
    location.pathname.endsWith('/build')
  ) {
    return <Outlet />;
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#070a0f]">
      <div className="sticky top-20 z-40 border-b border-white/5 bg-[#070a0f]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/hive-apps" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-bee-amber flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-bee-black" />
              </div>
              <span className="text-white font-black text-lg">Hive Apps</span>
            </Link>
            <a
              href="https://aibhive.com/api/download/apk"
              className="ml-auto hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-bold"
            >
              <Smartphone className="w-4 h-4" />
              Get AiBhive
            </a>
          </div>

          <form onSubmit={onSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search apps…"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-bee-amber/40"
              />
            </div>
          </form>

          <div className="flex gap-2 mt-3 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <Link
                  key={t.id}
                  to={t.path}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap',
                    active ? 'bg-bee-amber text-bee-black' : 'bg-white/5 text-slate-400'
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
    </div>
  );
}
