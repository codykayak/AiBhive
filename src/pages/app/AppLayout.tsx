import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutGrid, Download, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { APP_NAV } from './appContent';

export default function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#050810]">
      <div className="sticky top-20 z-40 border-b border-white/5 bg-[#050810]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <Link to="/app" className="flex items-center gap-3 shrink-0 group">
              <div className="w-11 h-11 rounded-2xl bg-bee-amber flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.25)]">
                <LayoutGrid className="w-5 h-5 text-bee-black" />
              </div>
              <div>
                <p className="text-bee-amber text-[10px] font-bold uppercase tracking-[0.2em]">AiBhive</p>
                <p className="text-white font-black text-lg leading-tight group-hover:text-bee-amber transition-colors">
                  App Command Center
                </p>
              </div>
            </Link>

            <nav className="flex flex-wrap gap-2 flex-1">
              {APP_NAV.map((item) => {
                const active =
                  item.path === '/app'
                    ? pathname === '/app'
                    : pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors',
                      active
                        ? 'bg-bee-amber text-bee-black'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <a
              href="/api/download/apk"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-bee-amber/30 text-bee-amber text-sm font-bold hover:bg-bee-amber/10 shrink-0"
            >
              <Download className="w-4 h-4" />
              Get Android app
            </a>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}

/** Shortcuts that redirect into existing working routes */
export function AppRedirect({ to }: { to: string }) {
  return <Navigate to={to} replace />;
}
