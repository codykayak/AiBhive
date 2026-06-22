import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Loader2,
  Megaphone,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  PLATFORMS,
  approvePost,
  buildPlatformPostUrl,
  copyPostBundle,
  formatPostDate,
  generatePost,
  getWorkflow,
  listPosts,
  markPosted,
  nextSevenDateKeys,
  rejectPost,
  sendTestSms,
  shortDayLabel,
  updateCaptions,
  updateConfig,
  updateProfile,
  GROK_TEXT_MODELS,
  GROK_IMAGE_MODELS,
  GEMINI_TEXT_MODELS,
  GEMINI_IMAGE_MODELS,
  type AutoSocialConfig,
  type DayPromptEntry,
  type PipelineStep,
  type PlatformId,
  type SocialPost,
  type UserAutoSocialProfile,
  type WorkflowStep,
} from '../../lib/autoSocialApi';

interface AutoSocialPanelProps {
  user: User;
}

function statusColor(status: string) {
  if (status === 'approved') return 'text-green-400 bg-green-400/10 border-green-400/30';
  if (status === 'posted') return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
  if (status === 'rejected' || status === 'failed') return 'text-red-400 bg-red-400/10 border-red-400/30';
  if (status === 'generating') return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
  return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
}

function WorkflowPipeline({ pipeline, activeStep }: { pipeline: PipelineStep[]; activeStep?: string }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {pipeline.map((step, i) => {
        const isActive = activeStep === step.id;
        const isPast = activeStep && pipeline.findIndex((s) => s.id === activeStep) > i;
        return (
          <div
            key={step.id}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              isActive
                ? 'border-bee-amber/50 bg-bee-amber/5'
                : isPast
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-white/10 bg-black/20'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500">{i + 1}</span>
              <span className="text-sm font-semibold text-white">{step.label}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function RawOutput({ title, content }: { title: string; content?: string }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 text-left text-sm text-slate-300 hover:bg-white/10"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <pre className="p-4 text-xs text-slate-400 overflow-x-auto max-h-64 whitespace-pre-wrap bg-black/40">
          {content}
        </pre>
      )}
    </div>
  );
}

function WorkflowLog({ log }: { log?: WorkflowStep[] }) {
  if (!log?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">Run log</p>
      {log.map((entry) => (
        <div key={`${entry.step}-${entry.at}`} className="rounded-lg border border-white/10 p-3 bg-black/20">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">{entry.label || entry.step}</span>
            <span className={cn('text-[10px] uppercase px-2 py-0.5 rounded-full border', statusColor(entry.status))}>
              {entry.status}
            </span>
            {entry.model && <span className="text-[10px] text-slate-500">model: {entry.model}</span>}
          </div>
          {entry.error && <p className="text-xs text-red-400 mb-2">{entry.error}</p>}
          <RawOutput title="Raw AI output" content={entry.raw} />
          {entry.output != null && (
            <RawOutput title="Parsed output" content={JSON.stringify(entry.output, null, 2)} />
          )}
        </div>
      ))}
    </div>
  );
}

function PostCard({
  post,
  user,
  config,
  isToday,
  onRefresh,
  onToast,
}: {
  post: SocialPost;
  user: User;
  config: AutoSocialConfig | null;
  isToday: boolean;
  onRefresh: () => void;
  onToast: (msg: string) => void;
}) {
  const [platform, setPlatform] = useState<PlatformId>('facebook');
  const [caption, setCaption] = useState(post[platform]?.caption || '');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  const pl = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0];
  const p = post[platform] || {};
  const links = config?.socialLinks || { facebook: '', instagram: '', x: '' };

  useEffect(() => {
    setCaption(post[platform]?.caption || '');
    setDirty(false);
  }, [platform, post]);

  const activeStep =
    post.status === 'generating'
      ? post.workflowLog?.find((s) => s.status === 'running')?.step || 'research'
      : post.status === 'pending_review'
        ? 'review'
        : post.status === 'posted'
          ? 'publish'
          : undefined;

  async function saveCaption() {
    setSaving(true);
    try {
      await updateCaptions(user, post.id, { [platform]: { caption } });
      setDirty(false);
      onToast('Caption saved');
      onRefresh();
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function doAction(fn: () => Promise<unknown>, msg: string) {
    setActing(true);
    try {
      await fn();
      onToast(msg);
      onRefresh();
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  const bundleText = copyPostBundle({ ...post, [platform]: { ...p, caption } }, platform);
  const postUrl = buildPlatformPostUrl(platform, bundleText, links);

  return (
    <article className={cn('rounded-2xl border p-5 space-y-4', isToday ? 'border-bee-amber/40 bg-bee-amber/5' : 'border-white/10 bg-black/20')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {isToday && (
            <span className="text-[10px] uppercase tracking-wider text-bee-amber font-bold">Today</span>
          )}
          <h3 className="text-lg font-bold text-white">{formatPostDate(post.date)}</h3>
          <p className="text-sm text-slate-400">{post.topic?.title}</p>
          {post.sourceArticle?.url && (
            <a
              href={post.sourceArticle.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-bee-amber hover:underline inline-flex items-center gap-1 mt-1"
            >
              {post.sourceArticle.title?.slice(0, 72)}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <span className={cn('text-[10px] uppercase px-2.5 py-1 rounded-full border', statusColor(post.status))}>
          {(post.status || 'pending').replace(/_/g, ' ')}
        </span>
      </div>

      {post.modelsUsed && (
        <p className="text-xs text-slate-500">
          Provider: <code className="text-slate-400">{post.provider || post.modelsUsed.provider || 'gemini'}</code>
          {' · '}
          text <code className="text-slate-400">{post.modelsUsed.text}</code>
          {' · '}
          image <code className="text-slate-400">{post.modelsUsed.image}</code>
        </p>
      )}

      <WorkflowLog log={post.workflowLog} />
      <RawOutput title="Image prompt" content={post.imagePrompt} />

      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPlatform(item.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm border transition-colors',
              platform === item.id
                ? 'border-bee-amber text-bee-amber bg-bee-amber/10'
                : 'border-white/10 text-slate-400 hover:text-white'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden aspect-video flex items-center justify-center">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-slate-500 p-4 text-center">No image</span>
          )}
        </div>
        <div className="space-y-2">
          <textarea
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              setDirty(true);
            }}
            className="w-full min-h-[180px] rounded-xl bg-black/40 border border-white/10 p-3 text-sm text-slate-200 focus:outline-none focus:border-bee-amber/50"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(bundleText).then(() => onToast('Copied'))}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-slate-300 hover:bg-white/5 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <a
              href={postUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs bg-bee-amber text-bee-black font-semibold hover:brightness-105 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open {pl.label}
            </a>
            {p.imageUrl && (
              <a
                href={p.imageUrl}
                download
                className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-slate-300 hover:bg-white/5"
              >
                Download image
              </a>
            )}
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={saveCaption}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save edits'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        {post.status === 'pending_review' && (
          <>
            <button
              type="button"
              disabled={acting}
              onClick={() => doAction(() => approvePost(user, post.id), 'Approved')}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-sm"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => doAction(() => rejectPost(user, post.id), 'Rejected')}
              className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 text-sm"
            >
              Reject
            </button>
          </>
        )}
        {post.status !== 'posted' && post.status !== 'generating' && (
          <button
            type="button"
            disabled={acting}
            onClick={() => doAction(() => markPosted(user, post.id), 'Marked posted')}
            className="px-4 py-2 rounded-lg bg-bee-amber text-bee-black font-semibold text-sm"
          >
            Mark as posted
          </button>
        )}
      </div>

      {post.errors && post.errors.length > 0 && (
        <p className="text-xs text-amber-300">Issues: {post.errors.join(' · ')}</p>
      )}

      {activeStep && post.status === 'generating' && (
        <p className="text-xs text-blue-300 animate-pulse">Currently running: {activeStep}</p>
      )}
    </article>
  );
}

export default function AutoSocialPanel({ user }: AutoSocialPanelProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [config, setConfig] = useState<AutoSocialConfig | null>(null);
  const [models, setModels] = useState<{ text: string; image: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', x: '' });

  const [profile, setProfile] = useState<UserAutoSocialProfile | null>(null);
  const [primaryProvider, setPrimaryProvider] = useState<'grok' | 'gemini'>('gemini');
  const [grokEnabled, setGrokEnabled] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [grokTextModel, setGrokTextModel] = useState('grok-3-mini');
  const [grokImageModel, setGrokImageModel] = useState('grok-imagine-image-quality');
  const [geminiTextModel, setGeminiTextModel] = useState('gemini-2.5-flash');
  const [geminiImageModel, setGeminiImageModel] = useState('gemini-2.5-flash-image');
  const [grokKeyInput, setGrokKeyInput] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');

  const [weekDates] = useState(() => nextSevenDateKeys());
  const [dayPrompts, setDayPrompts] = useState<Record<string, DayPromptEntry>>({});
  const [generatingDate, setGeneratingDate] = useState<string | null>(null);

  const [fbPageId, setFbPageId] = useState('');
  const [fbAccessToken, setFbAccessToken] = useState('');
  const [igAccountId, setIgAccountId] = useState('');
  const [igAccessToken, setIgAccessToken] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, workflowRes] = await Promise.all([
        listPosts(user, 30),
        getWorkflow(user),
      ]);
      setPosts(listRes.posts || []);
      setPipeline(workflowRes.pipeline || []);
      setConfig(workflowRes.config);
      setModels(workflowRes.models);
      setNotifyPhone(workflowRes.config.notifyPhone || '');
      setNotifyEnabled(workflowRes.config.notifyEnabled !== false);
      setSocialLinks(workflowRes.config.socialLinks || { facebook: '', instagram: '', x: '' });

      const p = workflowRes.profile;
      if (p) {
        setProfile(p);
        setPrimaryProvider(p.primaryProvider);
        setGrokEnabled(p.providers.grok.enabled);
        setGeminiEnabled(p.providers.gemini.enabled);
        setGrokTextModel(p.providers.grok.textModel);
        setGrokImageModel(p.providers.grok.imageModel);
        setGeminiTextModel(p.providers.gemini.textModel);
        setGeminiImageModel(p.providers.gemini.imageModel);
        setGrokKeyInput(p.providers.grok.apiKey.set ? p.providers.grok.apiKey.hint : '');
        setGeminiKeyInput(p.providers.gemini.apiKey.set ? p.providers.gemini.apiKey.hint : '');
        setDayPrompts(p.dayPrompts || {});
        setFbPageId(p.socialApiKeys?.facebook.pageId || '');
        setFbAccessToken(
          p.socialApiKeys?.facebook.accessToken.set
            ? p.socialApiKeys.facebook.accessToken.hint
            : '',
        );
        setIgAccountId(p.socialApiKeys?.instagram.accountId || '');
        setIgAccessToken(
          p.socialApiKeys?.instagram.accessToken.set
            ? p.socialApiKeys.instagram.accessToken.hint
            : '',
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Auto Social');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!posts.some((p) => p.status === 'generating')) return undefined;
    const interval = setInterval(() => {
      refresh();
    }, 8000);
    return () => clearInterval(interval);
  }, [posts, refresh]);

  const today = new Date().toISOString().slice(0, 10);
  const generatingNow = posts.some((p) => p.status === 'generating');

  async function handleGenerate(force = false, date?: string) {
    setGenerating(true);
    if (date) setGeneratingDate(date);
    setError('');
    showToast(force ? 'Regenerating… 2–4 min' : 'Generating… 2–4 min');
    try {
      const res = await generatePost(user, force, date);
      if (res.skipped) showToast(res.reason === 'already_exists' ? 'Already exists — use Regenerate' : 'Already in progress');
      else showToast(date ? `Post for ${shortDayLabel(date)} ready` : 'Post bundle ready');
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generate failed';
      setError(msg);
      showToast(msg);
    } finally {
      setGenerating(false);
      setGeneratingDate(null);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const promptsToSave: Record<string, DayPromptEntry> = {};
      for (const dateKey of weekDates) {
        const entry = dayPrompts[dateKey];
        if (entry?.prompt?.trim()) {
          promptsToSave[dateKey] = entry;
        } else {
          promptsToSave[dateKey] = { prompt: '', provider: 'default' };
        }
      }
      const body: Record<string, unknown> = {
        primaryProvider,
        providers: {
          grok: {
            enabled: grokEnabled,
            textModel: grokTextModel,
            imageModel: grokImageModel,
          },
          gemini: {
            enabled: geminiEnabled,
            textModel: geminiTextModel,
            imageModel: geminiImageModel,
          },
        },
        dayPrompts: promptsToSave,
        socialApiKeys: {
          facebook: { pageId: fbPageId },
          instagram: { accountId: igAccountId },
        },
      };
      if (grokKeyInput && !grokKeyInput.includes('••••')) {
        (body.providers as { grok: { apiKey: string } }).grok.apiKey = grokKeyInput;
      }
      if (geminiKeyInput && !geminiKeyInput.includes('••••')) {
        (body.providers as { gemini: { apiKey: string } }).gemini.apiKey = geminiKeyInput;
      }
      if (fbAccessToken && !fbAccessToken.includes('••••')) {
        (body.socialApiKeys as { facebook: { accessToken: string } }).facebook.accessToken =
          fbAccessToken;
      }
      if (igAccessToken && !igAccessToken.includes('••••')) {
        (body.socialApiKeys as { instagram: { accessToken: string } }).instagram.accessToken =
          igAccessToken;
      }
      await updateProfile(user, body);
      showToast('Profile saved');
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingProfile(false);
    }
  }

  function updateDayPrompt(dateKey: string, patch: Partial<DayPromptEntry>) {
    setDayPrompts((prev) => {
      const current = prev[dateKey] || { prompt: '', provider: 'default' as const };
      const next = { ...current, ...patch };
      if (!next.prompt.trim() && (!next.provider || next.provider === 'default')) {
        const { [dateKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [dateKey]: next };
    });
  }

  async function handleSaveConfig() {
    setSavingConfig(true);
    try {
      await updateConfig(user, { notifyPhone, notifyEnabled, socialLinks });
      showToast('Settings saved');
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingConfig(false);
    }
  }

  const stats = useMemo(() => {
    const counts = { pending: 0, approved: 0, posted: 0 };
    posts.forEach((p) => {
      const s = p.status || 'pending_review';
      if (s === 'pending_review') counts.pending += 1;
      if (s === 'approved') counts.approved += 1;
      if (s === 'posted') counts.posted += 1;
    });
    return counts;
  }, [posts]);

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-bee-amber/40 text-sm text-white shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-bee-amber" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-bee-amber" />
            Auto Social
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Daily AI pipeline: research → captions → images → review → post. Grok/Gemini settings, week-ahead prompts, and social API keys are saved per Google account.
            {profile && (
              <span className="block mt-1 text-xs text-slate-500">
                Active provider: <strong className="text-bee-amber">{primaryProvider}</strong>
                {profile.serverGeminiAvailable && !profile.providers.gemini.apiKey.set && (
                  <span> · Gemini can use server key</span>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 flex items-center gap-1"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            disabled={generating || generatingNow}
            onClick={() => handleGenerate(true)}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 disabled:opacity-40"
          >
            Regenerate
          </button>
          <button
            type="button"
            disabled={generating || generatingNow}
            onClick={() => handleGenerate(false)}
            className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black font-semibold text-sm flex items-center gap-1 disabled:opacity-40"
          >
            {generating || generatingNow ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate today
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-bee-amber/30 bg-bee-amber/5 px-4 py-3 text-sm text-slate-300">
        <strong className="text-bee-amber">Where to find this:</strong> Auto Social lives at{' '}
        <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">/admin?tab=auto-social</code>.
        The old <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">/autoposter</code> link now redirects here.
      </div>

      <section className="rounded-2xl border border-white/10 p-5 bg-black/20 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Week planner (next 7 days)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Paste a custom prompt per day. Pick Grok or Gemini for that day, or leave Default to use your primary provider.
            Save prompts, then generate each day.
          </p>
        </div>
        <div className="space-y-3">
          {weekDates.map((dateKey) => {
            const entry = dayPrompts[dateKey] || { prompt: '', provider: 'default' as const };
            const existingPost = posts.find((p) => p.date === dateKey || p.id === dateKey);
            const isToday = dateKey === today;
            return (
              <div
                key={dateKey}
                className={cn(
                  'rounded-xl border p-4 space-y-2',
                  isToday ? 'border-bee-amber/30 bg-bee-amber/5' : 'border-white/10 bg-black/20',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-white">{shortDayLabel(dateKey)}</span>
                    {isToday && (
                      <span className="ml-2 text-[10px] uppercase text-bee-amber font-bold">Today</span>
                    )}
                    {existingPost && (
                      <span className={cn('ml-2 text-[10px] uppercase px-2 py-0.5 rounded-full border', statusColor(existingPost.status))}>
                        {existingPost.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={entry.provider || 'default'}
                      onChange={(e) =>
                        updateDayPrompt(dateKey, {
                          provider: e.target.value as DayPromptEntry['provider'],
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                    >
                      <option value="default">Default provider</option>
                      <option value="grok">Grok</option>
                      <option value="gemini">Gemini</option>
                    </select>
                    <button
                      type="button"
                      disabled={generating || generatingDate === dateKey}
                      onClick={() => handleGenerate(!!existingPost, dateKey)}
                      className="px-3 py-1.5 rounded-lg bg-bee-amber text-bee-black text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                    >
                      {generatingDate === dateKey ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {existingPost ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={entry.prompt}
                  onChange={(e) => updateDayPrompt(dateKey, { prompt: e.target.value })}
                  placeholder="e.g. Write about how small businesses can use AI phone agents to capture after-hours leads…"
                  rows={2}
                  className="w-full rounded-lg bg-black/40 border border-white/10 p-3 text-sm text-slate-200 focus:outline-none focus:border-bee-amber/50"
                />
              </div>
            );
          })}
        </div>
        <button
          type="button"
          disabled={savingProfile}
          onClick={handleSaveProfile}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          {savingProfile ? 'Saving…' : 'Save week prompts'}
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 p-5 bg-black/20 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">AI providers (saved to your profile)</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Primary:</span>
            <select
              value={primaryProvider}
              onChange={(e) => setPrimaryProvider(e.target.value as 'grok' | 'gemini')}
              className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
            >
              <option value="grok">Grok</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm font-medium text-white">Grok (xAI)</span>
              <input
                type="checkbox"
                checked={grokEnabled}
                onChange={(e) => setGrokEnabled(e.target.checked)}
                className="rounded"
              />
            </label>
            <p className="text-xs text-slate-500">
              Grok generates the article research, captions, and images when enabled.
            </p>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">xAI API key</span>
              <input
                type="password"
                value={grokKeyInput}
                onChange={(e) => setGrokKeyInput(e.target.value)}
                placeholder="xai-..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Text model</span>
                <select
                  value={grokTextModel}
                  onChange={(e) => setGrokTextModel(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                >
                  {GROK_TEXT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Image model</span>
                <select
                  value={grokImageModel}
                  onChange={(e) => setGrokImageModel(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                >
                  {GROK_IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm font-medium text-white">Gemini (Google)</span>
              <input
                type="checkbox"
                checked={geminiEnabled}
                onChange={(e) => setGeminiEnabled(e.target.checked)}
                className="rounded"
              />
            </label>
            <p className="text-xs text-slate-500">
              Gemini generates article, captions, and images. Leave key blank to use the server key on Cloud Run.
            </p>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Gemini API key (optional)</span>
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder={profile?.serverGeminiAvailable ? 'Using server key if blank' : 'AIza...'}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Text model</span>
                <select
                  value={geminiTextModel}
                  onChange={(e) => setGeminiTextModel(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                >
                  {GEMINI_TEXT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Image model</span>
                <select
                  value={geminiImageModel}
                  onChange={(e) => setGeminiImageModel(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                >
                  {GEMINI_IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={savingProfile}
          onClick={handleSaveProfile}
          className="px-4 py-2 rounded-lg bg-bee-amber text-bee-black font-semibold text-sm disabled:opacity-50"
        >
          {savingProfile ? 'Saving…' : 'Save AI provider profile'}
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 p-5 bg-black/20 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Facebook & Instagram API keys</h3>
          <p className="text-xs text-slate-500 mt-1">
            Stored with your profile for future auto-posting. Copy/open still works without these keys.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <p className="text-sm font-medium text-white">Facebook</p>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Page ID</span>
              <input
                value={fbPageId}
                onChange={(e) => setFbPageId(e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Page access token</span>
              <input
                type="password"
                value={fbAccessToken}
                onChange={(e) => setFbAccessToken(e.target.value)}
                placeholder="EAA..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
          </div>
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <p className="text-sm font-medium text-white">Instagram</p>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Business account ID</span>
              <input
                value={igAccountId}
                onChange={(e) => setIgAccountId(e.target.value)}
                placeholder="178414..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Access token</span>
              <input
                type="password"
                value={igAccessToken}
                onChange={(e) => setIgAccessToken(e.target.value)}
                placeholder="IGQ..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
          </div>
        </div>
        <button
          type="button"
          disabled={savingProfile}
          onClick={handleSaveProfile}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          {savingProfile ? 'Saving…' : 'Save social API keys'}
        </button>
      </section>

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          ['Pending', stats.pending, 'text-amber-400'],
          ['Approved', stats.approved, 'text-green-400'],
          ['Posted', stats.posted, 'text-sky-400'],
        ].map(([label, value, color]) => (
          <div key={label as string} className="rounded-xl border border-white/10 p-3 bg-black/20">
            <p className="text-[10px] uppercase text-slate-500">{label}</p>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {pipeline.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-3">Workflow pipeline</h3>
          <WorkflowPipeline
            pipeline={pipeline}
            activeStep={generatingNow ? posts.find((p) => p.status === 'generating')?.workflowLog?.find((s) => s.status === 'running')?.step : undefined}
          />
        </section>
      )}

      {showSettings && (
        <section className="rounded-2xl border border-white/10 p-5 bg-black/20 space-y-4">
          <h3 className="text-sm font-semibold text-white">Social profiles & notifications</h3>
          <p className="text-xs text-slate-400">
            Add your profile or page URLs. &quot;Open Facebook/Instagram/X&quot; uses these links. X also pre-fills the tweet text.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(['facebook', 'instagram', 'x'] as const).map((key) => (
              <label key={key} className="block">
                <span className="text-xs text-slate-500 capitalize mb-1 block">{key} profile URL</span>
                <input
                  value={socialLinks[key]}
                  onChange={(e) => setSocialLinks((s) => ({ ...s, [key]: e.target.value }))}
                  placeholder={key === 'x' ? 'https://twitter.com/yourhandle' : `https://${key}.com/...`}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-grow max-w-xs">
              <span className="text-xs text-slate-500 mb-1 block">SMS phone (E.164)</span>
              <input
                value={notifyPhone}
                onChange={(e) => setNotifyPhone(e.target.value)}
                placeholder="+1..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={notifyEnabled}
                onChange={(e) => setNotifyEnabled(e.target.checked)}
                className="rounded"
              />
              Daily SMS at 7 AM PT
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={savingConfig}
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-lg bg-bee-amber text-bee-black font-semibold text-sm"
            >
              {savingConfig ? 'Saving…' : 'Save settings'}
            </button>
            <button
              type="button"
              onClick={() => sendTestSms(user, notifyPhone).then(() => showToast('Test SMS sent')).catch((e) => showToast(e.message))}
              className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-sm"
            >
              Test SMS
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
      )}

      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-bee-amber animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p>No posts yet. Click <strong className="text-white">Generate today</strong> to run the pipeline.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id}>
              <PostCard
                post={post}
                user={user}
                config={config}
                isToday={post.date === today || post.id === today}
                onRefresh={refresh}
                onToast={showToast}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
