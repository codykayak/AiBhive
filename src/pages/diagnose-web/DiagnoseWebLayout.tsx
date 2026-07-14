import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Home,
  Layers,
  Loader2,
  LogIn,
  MessageSquare,
  Settings,
  Wrench,
} from 'lucide-react';
import { DiagnoseWebProvider, useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import CreditsDepletedModal from './CreditsDepletedModal';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/diagnose/app', label: 'Home', icon: Home, end: true },
  { to: '/diagnose/app/chat', label: 'Diagnose', icon: MessageSquare },
  { to: '/diagnose/app/packs', label: 'Trade packs', icon: Layers },
  { to: '/diagnose/app/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/diagnose/app/tools', label: 'Field tools', icon: Wrench },
  { to: '/diagnose/app/account', label: 'Account', icon: Settings },
];

function DiagnoseWebShell() {
  const { pathname } = useLocation();
  const { user, authReady, signIn, signOutUser, activePack, account } = useDiagnoseWeb();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#070a10] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/diagnose" replace state={{ from: pathname }} />;
  }

  const credits = account?.totalRemainingUsd ?? account?.creditBalanceUsd ?? 0;

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/8 bg-[#0a0e16]">
        <div className="p-5 border-b border-white/8">
          <Link to="/diagnose" className="block">
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em]">AiBhive</p>
            <p className="text-white font-black text-lg">Diagnose Web</p>
          </Link>
          <div
            className="mt-4 rounded-xl px-3 py-2 text-xs font-semibold border"
            style={{ borderColor: `${activePack.accentColor}55`, color: activePack.accentColor }}
          >
            {activePack.shortName} pack active
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                  active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/8 text-xs text-slate-500">
          <p className="text-slate-300 font-semibold truncate">{user.displayName || user.email}</p>
          <p className="mt-1">Hive credits: ${credits.toFixed(2)}</p>
          <button type="button" onClick={() => void signOutUser()} className="mt-2 text-slate-400 hover:text-white">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 border-b border-white/8 bg-[#0a0e16]/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-white font-bold text-sm">Diagnose · {activePack.shortName}</p>
            <p className="text-amber-400 text-xs">${credits.toFixed(2)} credits</p>
          </div>
          <Link to="/diagnose/app/account" className="text-xs font-bold text-amber-400 px-3 py-1.5 rounded-lg bg-amber-500/10">
            Account
          </Link>
        </header>

        <nav className="lg:hidden flex gap-1 overflow-x-auto px-2 py-2 border-b border-white/8 bg-[#0a0e16]">
          {NAV.map((item) => {
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold',
                  active ? 'bg-amber-500 text-black' : 'text-slate-400 bg-white/5'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CreditsDepletedModal />
    </div>
  );
}

export default function DiagnoseWebLayout() {
  return (
    <DiagnoseWebProvider>
      <DiagnoseWebShell />
    </DiagnoseWebProvider>
  );
}

export function DiagnoseWebLoginGate({ children }: { children: React.ReactNode }) {
  const { user, authReady, signIn } = useDiagnoseWeb();
  if (!authReady) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }
  if (user) return <>{children}</>;
  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center">
      <LogIn className="w-10 h-10 text-amber-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white">Sign in to continue</h2>
      <p className="text-slate-400 mt-2 text-sm">Get $2 in free Hive credits to try live Grok diagnosis.</p>
      <button
        type="button"
        onClick={() => void signIn()}
        className="mt-6 px-6 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400"
      >
        Continue with Google
      </button>
    </div>
  );
}
