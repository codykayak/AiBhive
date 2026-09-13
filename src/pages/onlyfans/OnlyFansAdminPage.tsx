import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  Image,
  Loader2,
  LogOut,
  MessageCircle,
  Settings2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider } from '../../firebase';
import { SEO } from '../../components/SEO';
import OnlyFansPageHeader from '../../components/onlyfans/OnlyFansPageHeader';

type CreatorTab = 'overview' | 'queue' | 'persona' | 'vault';

type PendingReply = {
  id: string;
  fan: string;
  preview: string;
  suggestedPpv: string;
  waitMin: number;
};

const MOCK_QUEUE: PendingReply[] = [
  {
    id: '1',
    fan: '@nightowl_fan',
    preview: 'Do you have anything spicier from last week? 👀',
    suggestedPpv: 'Tease set #12 → $14 PPV',
    waitMin: 2,
  },
  {
    id: '2',
    fan: '@whale_renewal',
    preview: 'Thinking about renewing — any bundle deal?',
    suggestedPpv: 'VIP bundle script → $49',
    waitMin: 5,
  },
  {
    id: '3',
    fan: '@new_sub_884',
    preview: 'Hey! Just subscribed — what should I see first?',
    suggestedPpv: 'Welcome flow → free tease + PPV #3',
    waitMin: 1,
  },
];

const STORAGE_KEY = 'aibhive-onlyfans-creator-profile';

type CreatorProfile = {
  displayName: string;
  niche: string;
  vaultAssets: number;
  personaReady: boolean;
};

function loadProfile(email: string | null): CreatorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CreatorProfile;
  } catch {
    /* ignore */
  }
  const name = email?.split('@')[0] ?? 'Creator';
  return {
    displayName: name,
    niche: 'Fitness & lifestyle',
    vaultAssets: 0,
    personaReady: false,
  };
}

export default function OnlyFansAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CreatorTab>('overview');
  const [profile, setProfile] = useState<CreatorProfile>(() => loadProfile(null));
  const [queue, setQueue] = useState<PendingReply[]>(MOCK_QUEUE);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoadingAuth(false);
      if (u) setProfile(loadProfile(u.email));
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const saveProfile = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const stats = useMemo(
    () => ({
      pending: queue.length,
      revenue7d: 4287,
      replyRate: 94,
      ppvAttach: 31,
    }),
    [queue.length],
  );

  const approveReply = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0610] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0610] text-white">
        <SEO
          title="Creator Login | AiBhive Creator Chat"
          description="Sign in to manage your programmable fan chat, approval queue, persona, and content vault."
        />
        <OnlyFansPageHeader />

        <div className="min-h-[85vh] flex items-center justify-center px-4 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-pink-500/20 bg-black/50 backdrop-blur p-8 sm:p-10 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/30 to-fuchsia-600/20 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-pink-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Creator dashboard</h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Sign in to review AI drafts, edit your persona, and manage your vault — human-in-the-loop, you stay in
              control.
            </p>

            {error ? (
              <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm flex gap-3 text-left">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleLogin}
              className="mt-8 w-full py-3.5 rounded-xl bg-white text-black font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <p className="mt-6 text-xs text-slate-500">
              Beta access — connect your account during onboarding.{' '}
              <Link to="/onlyfans" className="text-pink-300 hover:text-pink-200">
                ← Back to homepage
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  const tabs: { id: CreatorTab; label: string; icon: typeof Bot }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'queue', label: 'Approval queue', icon: MessageCircle },
    { id: 'persona', label: 'Persona', icon: Settings2 },
    { id: 'vault', label: 'Vault', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-[#0a0610] text-white">
      <SEO title="Creator Dashboard | AiBhive Creator Chat" description="Manage fan chat automation." />
      <OnlyFansPageHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-pink-400 text-xs font-black uppercase tracking-widest">Creator dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Welcome, {profile.displayName || user.displayName || 'Creator'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                tab === t.id
                  ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white'
                  : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.id === 'queue' && queue.length > 0 ? (
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{queue.length}</span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs text-slate-400">Pending approvals</p>
                <p className="text-3xl font-black text-pink-300 mt-2">{stats.pending}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs text-slate-400">7-day chat revenue</p>
                <p className="text-3xl font-black text-emerald-300 mt-2">${stats.revenue7d.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs text-slate-400">Auto-reply coverage</p>
                <p className="text-3xl font-black text-white mt-2">{stats.replyRate}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs text-slate-400">PPV attach rate</p>
                <p className="text-3xl font-black text-amber-200 mt-2">{stats.ppvAttach}%</p>
              </div>
            </div>

            <div className="rounded-2xl border border-pink-500/20 bg-pink-500/[0.04] p-6 flex flex-wrap gap-4 items-start">
              <Shield className="w-6 h-6 text-pink-300 shrink-0" />
              <div>
                <h2 className="font-bold text-lg">Human-in-the-loop is on</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  AI drafts replies and PPV suggestions — you approve before anything sends. VIP fans and flagged threads
                  always wait for you.
                </p>
                <Link
                  to="/book-consultation"
                  className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-pink-300 hover:text-pink-200"
                >
                  <DollarSign className="w-4 h-4" />
                  Request full platform connect
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'queue' ? (
          <div className="space-y-4">
            {queue.length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-10 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                Queue clear — nothing waiting for approval.
              </div>
            ) : (
              queue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-pink-200">{item.fan}</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.waitMin}m ago
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.preview}</p>
                    <p className="mt-2 text-xs font-bold text-emerald-300">Suggested: {item.suggestedPpv}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => approveReply(item.id)}
                      className="rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-4 py-2 text-sm font-bold hover:bg-emerald-500/30"
                    >
                      Approve & send
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5"
                    >
                      Edit draft
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === 'persona' ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 max-w-2xl space-y-4">
            <h2 className="font-bold text-lg">Programmable persona</h2>
            <label className="block text-sm">
              <span className="text-slate-400">Display name</span>
              <input
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Niche / tone notes</span>
              <textarea
                value={profile.niche}
                onChange={(e) => setProfile((p) => ({ ...p, niche: e.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white resize-y"
              />
            </label>
            <button
              type="button"
              onClick={saveProfile}
              className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-6 py-2.5 text-sm font-bold"
            >
              Save persona (local beta)
            </button>
          </div>
        ) : null}

        {tab === 'vault' ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 max-w-2xl">
            <h2 className="font-bold text-lg">Content vault</h2>
            <p className="text-sm text-slate-400 mt-2">
              Tag photos and clips with tease, PPV, bundle, and free tiers. Full vault ingest connects during beta
              onboarding.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="aspect-square rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center text-xs text-slate-500"
                >
                  Upload slot {n}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">{profile.vaultAssets} assets tagged · ingest pending connect</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
