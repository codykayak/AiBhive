import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  Copy,
  ExternalLink,
  Image,
  Loader2,
  Megaphone,
  Radar,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import { adminJson } from '../../lib/adminApi';
import {
  loadImageApiSettings,
  loadSocialCriteria,
  researchTopics,
  saveImageApiSettings,
  saveSocialCriteria,
  searchSocialPosts,
  type ImageApiSettings,
  type SocialHunterCriteria,
  type SocialPostResult,
} from '../../lib/socialHunterApi';
import AppQuickStart from './AppQuickStart';
import { MissedSocialRadar } from './MissedSocialRadar';

const SOCIAL_HUNTER_STEPS = [
  'On Find posts, enter topics (comma-separated), pick platforms and date range, then tap Find 10 posts.',
  'Select a post → Sign in & open post (opens the thread in a new tab on LinkedIn, Reddit, X, etc.).',
  'Tap Copy reply → paste your response on that platform. Use Copy image prompt for a companion graphic in your AI art tool.',
  'Research tab — run a topic brief for hooks and post ideas before you engage.',
  'Auto Social tab — sign in with your admin Google account to preview the queue and open the full Auto Social scheduler.',
  'Image API tab — optionally save your image provider key in this browser for future in-app generation (copy prompts works today).',
];

type Props = { expanded?: boolean };
type Tab = 'posts' | 'research' | 'auto-social' | 'settings';

const DEFAULT: SocialHunterCriteria = {
  topics: 'real estate investing, AI automation',
  dateRangeDays: 14,
  platforms: ['LinkedIn', 'Reddit', 'X'],
  audience: 'Real estate investors and operators',
  tone: 'Helpful expert',
  brandVoice: 'Friendly, data-driven, no hype',
  minEngagement: 'any',
};

const PLATFORM_OPTS = ['LinkedIn', 'Reddit', 'X', 'Facebook'];

export default function SocialPostHunterWebApp({ expanded }: Props) {
  const [tab, setTab] = useState<Tab>('posts');
  const [criteria, setCriteria] = useState<SocialHunterCriteria>(() => ({ ...DEFAULT, ...loadSocialCriteria() }));
  const [imageSettings, setImageSettings] = useState<ImageApiSettings>(() => loadImageApiSettings());
  const [posts, setPosts] = useState<SocialPostResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [researchBrief, setResearchBrief] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminPosts, setAdminPosts] = useState<{ id: string; date: string; status: string }[]>([]);

  useEffect(() => {
    saveSocialCriteria(criteria);
  }, [criteria]);

  useEffect(() => {
    saveImageApiSettings(imageSettings);
  }, [imageSettings]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAdminUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (tab !== 'auto-social' || !adminUser) return;
    void adminJson<{ posts?: { id: string; date: string; status: string }[] }>('/api/autoposter', adminUser)
      .then((d) => setAdminPosts((d.posts || []).slice(0, 5)))
      .catch(() => setAdminPosts([]));
  }, [tab, adminUser]);

  const onSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchSocialPosts(criteria);
      if (!result.ok) {
        setError(result.error || 'Search failed.');
        return;
      }
      setPosts(result.posts);
      setNote(result.note || '');
      setDemo(!!result.demo);
      setSelectedId(result.posts[0]?.id || null);
    } finally {
      setLoading(false);
    }
  }, [criteria]);

  const onResearch = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await researchTopics(criteria.topics);
      if (!result.ok) {
        setError(result.error || 'Research failed.');
        return;
      }
      setResearchBrief(result.brief);
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setError('Could not copy.');
    }
  };

  const selected = posts.find((p) => p.id === selectedId);

  const togglePlatform = (p: string) => {
    setCriteria((c) => ({
      ...c,
      platforms: c.platforms.includes(p) ? c.platforms.filter((x) => x !== p) : [...c.platforms, p],
    }));
  };

  return (
    <div className={`flex flex-col gap-4 ${expanded ? 'min-h-[calc(100vh-12rem)]' : ''}`}>
      <header>
        <p className="text-violet-400 text-xs font-bold uppercase tracking-widest">Social Post Hunter</p>
        <h1 className="text-2xl font-black text-white mt-1">Find posts · reply · research · auto-social</h1>
        <p className="text-slate-400 text-sm mt-1">
          Discover 10 relevant threads, copy AI replies, research topics, and manage Auto Social from one workspace.
        </p>
      </header>

      <MissedSocialRadar criteria={criteria} hunting={loading} postsLoaded={posts.length} />

      <AppQuickStart appId="social-hunter" accent="violet" steps={SOCIAL_HUNTER_STEPS} />

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ['posts', 'Find posts', Search],
            ['research', 'Research', Radar],
            ['auto-social', 'Auto Social', Megaphone],
            ['settings', 'Image API', Settings],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${
              tab === id ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm px-3 py-2">{error}</div>
      )}

      {tab === 'posts' && (
        <div className="grid xl:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400">Topics (comma-separated)</label>
            <textarea
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm resize-none"
              value={criteria.topics}
              onChange={(e) => setCriteria((c) => ({ ...c, topics: e.target.value }))}
            />
            <label className="block text-xs font-bold text-slate-400">Date range (days back)</label>
            <input
              type="number"
              min={1}
              max={90}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
              value={criteria.dateRangeDays}
              onChange={(e) => setCriteria((c) => ({ ...c, dateRangeDays: Number(e.target.value) || 14 }))}
            />
            <p className="text-xs font-bold text-slate-400">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    criteria.platforms.includes(p) ? 'bg-violet-500/30 text-violet-200' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="block text-xs font-bold text-slate-400">Audience</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
              value={criteria.audience}
              onChange={(e) => setCriteria((c) => ({ ...c, audience: e.target.value }))}
            />
            <label className="block text-xs font-bold text-slate-400">Brand voice</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
              value={criteria.brandVoice}
              onChange={(e) => setCriteria((c) => ({ ...c, brandVoice: e.target.value }))}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void onSearch()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 text-white font-extrabold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Find 10 posts
            </button>
          </div>
          <div className="grid lg:grid-cols-[220px_1fr] gap-3 min-h-[320px]">
            <div className="space-y-2 overflow-y-auto max-h-[55vh]">
              {posts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left rounded-xl border p-2.5 text-sm ${
                    selectedId === p.id ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10'
                  }`}
                >
                  <p className="text-violet-300 text-xs font-bold">{p.platform}</p>
                  <p className="text-white font-semibold line-clamp-2">{p.title}</p>
                </button>
              ))}
            </div>
            {selected ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3 overflow-y-auto">
                {demo && note && <p className="text-amber-300/90 text-xs">{note}</p>}
                <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                <p className="text-slate-400 text-sm">{selected.snippet}</p>
                <p className="text-slate-500 text-xs">{selected.author} · {selected.date}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-violet-500 text-white text-sm font-bold"
                  >
                    <ExternalLink className="w-4 h-4" /> Sign in & open post
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyText(selected.suggestedReply, 'reply')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-white/15 text-sm"
                  >
                    <Copy className="w-4 h-4" /> {copied === 'reply' ? 'Copied!' : 'Copy reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyText(selected.imagePrompt, 'image')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-white/15 text-sm"
                  >
                    <Image className="w-4 h-4" /> {copied === 'image' ? 'Copied!' : 'Copy image prompt'}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{selected.engagementTip}</p>
                <section>
                  <h3 className="text-xs font-bold text-violet-300 uppercase mb-1">Suggested reply</h3>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap rounded-lg bg-white/[0.04] p-3 border border-white/10">
                    {selected.suggestedReply}
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-bold text-violet-300 uppercase mb-1">Image prompt</h3>
                  <div className="text-sm text-slate-300 rounded-lg bg-white/[0.04] p-3 border border-white/10">
                    {selected.imagePrompt}
                  </div>
                </section>
              </div>
            ) : (
              <p className="text-slate-500 text-sm self-center">Run a search to see posts.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'research' && (
        <div className="space-y-4 max-w-2xl">
          <p className="text-slate-400 text-sm">
            Uses the same web research pipeline as AiBhive Intel — topic hooks for your social calendar.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onResearch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 font-bold text-sm border border-violet-500/30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            Research topics
          </button>
          {researchBrief && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {researchBrief}
            </div>
          )}
          <Link to="/app/research" className="inline-flex items-center gap-2 text-violet-400 font-semibold text-sm hover:underline">
            <Sparkles className="w-4 h-4" /> Open full Research workspace
          </Link>
        </div>
      )}

      {tab === 'auto-social' && (
        <div className="space-y-4 max-w-2xl">
          <p className="text-slate-400 text-sm leading-relaxed">
            AiBhive Auto Social schedules AI captions and images across Facebook, Instagram, and X. Sign in with your
            admin Google account to preview the queue — then open the full panel to approve posts.
          </p>
          {adminUser ? (
            <div className="space-y-3">
              <p className="text-emerald-400 text-sm">Signed in as {adminUser.email}</p>
              {adminPosts.length > 0 ? (
                <ul className="space-y-2">
                  {adminPosts.map((p) => (
                    <li key={p.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
                      {p.date} · <span className="text-violet-300">{p.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">No queued posts or admin access required.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/admin?tab=auto-social"
                  className="px-4 py-2 rounded-xl bg-violet-500 text-white font-bold text-sm"
                >
                  Open Auto Social admin
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut(auth)}
                  className="px-4 py-2 rounded-xl border border-white/15 text-slate-400 text-sm"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithPopup(auth, googleProvider)}
              className="px-4 py-2 rounded-xl bg-violet-500 text-white font-bold text-sm"
            >
              Sign in with Google (admin)
            </button>
          )}
          <Link to="/app/automated-social-media" className="block text-violet-400 text-sm font-semibold hover:underline">
            Learn about social automation →
          </Link>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4 max-w-md">
          <p className="text-slate-400 text-sm">
            Optional BYOK for image generation — paste prompts from posts into your preferred provider.
          </p>
          <label className="block text-xs font-bold text-slate-400">Image provider</label>
          <select
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
            value={imageSettings.provider}
            onChange={(e) =>
              setImageSettings((s) => ({ ...s, provider: e.target.value as ImageApiSettings['provider'] }))
            }
          >
            <option value="none">Copy prompt only (no API)</option>
            <option value="gemini">Google Gemini Image</option>
            <option value="openai">OpenAI DALL·E</option>
          </select>
          {imageSettings.provider !== 'none' && (
            <>
              <label className="block text-xs font-bold text-slate-400">API key (stored in this browser only)</label>
              <input
                type="password"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                value={imageSettings.apiKey}
                onChange={(e) => setImageSettings((s) => ({ ...s, apiKey: e.target.value }))}
                placeholder="sk-… or Gemini key"
              />
              <label className="block text-xs font-bold text-slate-400">Model</label>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                value={imageSettings.model}
                onChange={(e) => setImageSettings((s) => ({ ...s, model: e.target.value }))}
              />
            </>
          )}
          <p className="text-slate-600 text-xs">
            Image generation from the browser is coming soon — for now copy the prompt from each post and run it in your
            provider&apos;s UI.
          </p>
        </div>
      )}
    </div>
  );
}
