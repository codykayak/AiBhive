import { useCallback, useEffect, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Loader2, LogIn, Megaphone, ShieldAlert } from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import { adminJson } from '../../lib/adminApi';
import AutoSocialPanel from '../admin/AutoSocialPanel';
import { brandFor } from '../../lib/hiveAppBranding';

type Props = { expanded?: boolean };

/** Admin Auto Social tab as a Hive App — same pipeline as /admin?tab=auto-social. */
export default function AutoSocialWebApp({ expanded }: Props) {
  const brand = brandFor('pink');
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const verifyAdmin = useCallback(async (u: User) => {
    setChecking(true);
    setError('');
    try {
      await adminJson('/api/admin/settings', u);
      setIsAdmin(true);
    } catch (err: unknown) {
      setIsAdmin(false);
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
      if (status === 403) {
        setError('This app is for AiBhive admins only. Your Google account is not on the allowlist.');
        await signOut(auth);
      } else {
        setError(err instanceof Error ? err.message : 'Could not verify admin access.');
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoadingAuth(false);
      setIsAdmin(false);
      if (u) void verifyAdmin(u);
    });
    return () => unsub();
  }, [verifyAdmin]);

  const handleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  if (loadingAuth || (user && checking)) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#070a0f] min-h-[320px] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div
        className={`rounded-2xl border border-white/10 overflow-hidden ${expanded ? '' : 'max-h-[520px]'}`}
        style={{ background: `linear-gradient(180deg, ${brand.primarySoft} 0%, rgba(11,15,20,0.95) 40%)` }}
      >
        <div className="p-6 sm:p-8 text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: brand.primarySoft }}
          >
            <Megaphone className="w-7 h-7" style={{ color: brand.primary }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: brand.primaryText }}>
            Auto Social
          </p>
          <h2 className="text-white font-bold text-xl mt-1">Social posting pipeline</h2>
          <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
            Generate, approve, and schedule posts across platforms — same admin tool as{' '}
            <Link to="/admin?tab=auto-social" className="text-bee-amber hover:underline">
              Admin → Auto Social
            </Link>
            . Sign in with an admin Google account to run it here.
          </p>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-left max-w-md mx-auto">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90">
              Admin-only — uses your autoposter config and AI models. Not shown to public store visitors without access.
            </p>
          </div>

          {error ? <p className="text-red-400 text-sm mt-4">{error}</p> : null}

          <button
            type="button"
            onClick={handleLogin}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-bee-black"
            style={{ backgroundColor: brand.primary }}
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 overflow-hidden bg-[#070a0f] ${
        expanded ? '' : 'max-h-[70vh] overflow-y-auto'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4" style={{ color: brand.primary }} />
          <span className="text-white font-bold text-sm">Auto Social</span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-white"
        >
          Sign out
        </button>
      </div>
      <div className="p-2 sm:p-4">
        <AutoSocialPanel user={user} />
      </div>
    </div>
  );
}
