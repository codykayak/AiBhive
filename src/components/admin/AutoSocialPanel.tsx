import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { User } from 'firebase/auth';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  PLATFORMS,
  approvePost,
  buildPlatformPostUrl,
  copyPostBundle,
  createCompany,
  formatPostDate,
  generatePost,
  getWorkflow,
  listCompanies,
  listPosts,
  markPosted,
  nextSevenDateKeys,
  publishPost,
  rejectPost,
  sendTestSms,
  shortDayLabel,
  updateCaptions,
  updateCompany,
  GROK_TEXT_MODELS,
  GROK_IMAGE_MODELS,
  GEMINI_TEXT_MODELS,
  GEMINI_IMAGE_MODELS,
  type AutoSocialConfig,
  type DayPromptEntry,
  type PipelineStep,
  type PlatformId,
  type PublishStatusEntry,
  type SocialCompany,
  type SocialPost,
  type WorkflowStep,
} from '../../lib/autoSocialApi';

interface AutoSocialPanelProps {
  user: User;
}

function statusColor(status: string) {
  if (status === 'approved') return 'text-green-400 bg-green-400/10 border-green-400/30';
  if (status === 'posted') return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
  if (status === 'partially_posted') return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
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

function PublishStatusRow({
  label,
  entry,
}: {
  label: string;
  entry?: PublishStatusEntry;
}) {
  if (!entry) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-slate-600" />
        {label}: not posted yet
      </div>
    );
  }
  if (entry.status === 'posted') {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-green-300">
        <Check className="w-3.5 h-3.5" />
        <span>{label}: live</span>
        {entry.platformPostId && (
          <code className="text-slate-500">id {entry.platformPostId}</code>
        )}
        {entry.postUrl && (
          <a href={entry.postUrl} target="_blank" rel="noreferrer" className="text-bee-amber hover:underline inline-flex items-center gap-1">
            View post <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }
  return (
    <div className="text-xs text-red-400">
      {label} failed: {entry.error || 'Unknown error'}
    </div>
  );
}

function CompanyProviderCard({
  label,
  enabled,
  textModel,
  imageModel,
  apiKeyHint,
  serverKeyNote,
  textModels,
  imageModels,
  onSave,
}: {
  label: string;
  enabled: boolean;
  textModel: string;
  imageModel: string;
  apiKeyHint: string;
  serverKeyNote?: boolean;
  textModels: Array<{ id: string; label: string }>;
  imageModels: Array<{ id: string; label: string }>;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [apiKey, setApiKey] = useState(apiKeyHint);
  return (
    <div className="rounded-xl border border-white/10 p-4 space-y-3">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-medium text-white">{label}</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onSave({ enabled: e.target.checked })}
          className="rounded"
        />
      </label>
      {serverKeyNote && (
        <p className="text-xs text-slate-500">Leave API key blank to use the server Gemini key.</p>
      )}
      <label className="block">
        <span className="text-xs text-slate-500 mb-1 block">API key</span>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={() => {
            if (apiKey && !apiKey.includes('••••')) onSave({ apiKey });
          }}
          placeholder={serverKeyNote ? 'Optional' : 'Required'}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-slate-500 mb-1 block">Text model</span>
          <select
            value={textModel}
            onChange={(e) => onSave({ textModel: e.target.value })}
            className="w-full px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
          >
            {textModels.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 mb-1 block">Image model</span>
          <select
            value={imageModel}
            onChange={(e) => onSave({ imageModel: e.target.value })}
            className="w-full px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
          >
            {imageModels.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function PostCard({
  post,
  user,
  companyId,
  company,
  isToday,
  onRefresh,
  onToast,
}: {
  post: SocialPost;
  user: User;
  companyId: string;
  company: SocialCompany | null;
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
  const links = company?.socialLinks || { facebook: '', instagram: '', x: '' };

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

  async function handlePublish(platforms: Array<'facebook' | 'instagram'>) {
    setActing(true);
    try {
      await publishPost(user, companyId, post.id, platforms);
      onToast(platforms.length > 1 ? 'Published to Facebook & Instagram' : `Published to ${platforms[0]}`);
      onRefresh();
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Publish failed');
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
      <RawOutput title="Image headline" content={post.imageHeadline} />
      <RawOutput title="Image prompt" content={post.imagePrompt} />

      <div className="rounded-xl border border-white/10 p-3 bg-black/20 space-y-1.5">
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Publish status</p>
        <PublishStatusRow label="Facebook" entry={post.publishStatus?.facebook} />
        <PublishStatusRow label="Instagram" entry={post.publishStatus?.instagram} />
      </div>

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
              onClick={() => doAction(() => approvePost(user, companyId, post.id), 'Approved')}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-sm"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => doAction(() => rejectPost(user, companyId, post.id), 'Rejected')}
              className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 text-sm"
            >
              Reject
            </button>
          </>
        )}
        {post.status !== 'generating' && (
          <>
            <button
              type="button"
              disabled={acting || !post.facebook?.imageUrl}
              onClick={() => handlePublish(['facebook'])}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm disabled:opacity-40"
            >
              Post to Facebook
            </button>
            <button
              type="button"
              disabled={acting || !post.instagram?.imageUrl}
              onClick={() => handlePublish(['instagram'])}
              className="px-4 py-2 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 text-sm disabled:opacity-40"
            >
              Post to Instagram
            </button>
            <button
              type="button"
              disabled={acting || (!post.facebook?.imageUrl && !post.instagram?.imageUrl)}
              onClick={() => handlePublish(['facebook', 'instagram'])}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-sm disabled:opacity-40"
            >
              Post to both
            </button>
          </>
        )}
        {post.status !== 'posted' && post.status !== 'generating' && (
          <button
            type="button"
            disabled={acting}
            onClick={() => doAction(() => markPosted(user, companyId, post.id), 'Marked posted')}
            className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 text-sm"
          >
            Mark as posted (manual)
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<SocialCompany[]>([]);
  const activeCompanyId = searchParams.get('company') || companies[0]?.id || 'aibhive';
  const activeCompany = companies.find((c) => c.id === activeCompanyId) || null;

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [config, setConfig] = useState<AutoSocialConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const [weekDates] = useState(() => nextSevenDateKeys());
  const [dayPrompts, setDayPrompts] = useState<Record<string, DayPromptEntry>>({});
  const [generatingDate, setGeneratingDate] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const selectCompany = useCallback((companyId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'auto-social');
    next.set('company', companyId);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const companiesRes = await listCompanies(user);
      const companyList = companiesRes.companies || [];
      setCompanies(companyList);
      const companyId = searchParams.get('company') || companyList[0]?.id || 'aibhive';

      const [listRes, workflowRes] = await Promise.all([
        listPosts(user, companyId, 30),
        getWorkflow(user, companyId),
      ]);
      setPosts(listRes.posts || []);
      setPipeline(workflowRes.pipeline || []);
      setConfig(workflowRes.config);
      const company = workflowRes.company;
      if (company) {
        setDayPrompts(company.dayPrompts || {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Auto Social');
    } finally {
      setLoading(false);
    }
  }, [user, searchParams]);

  useEffect(() => {
    refresh();
  }, [refresh, activeCompanyId]);

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
      const res = await generatePost(user, activeCompanyId, force, date);
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

  async function handleSaveCompany(patch: Record<string, unknown>, message = 'Company saved') {
    setSavingCompany(true);
    try {
      await updateCompany(user, activeCompanyId, patch);
      showToast(message);
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleAddCompany() {
    const name = newCompanyName.trim();
    if (!name) return;
    setAddingCompany(true);
    try {
      const res = await createCompany(user, name);
      setNewCompanyName('');
      selectCompany(res.company.id);
      showToast(`Created ${res.company.name}`);
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not create company');
    } finally {
      setAddingCompany(false);
    }
  }

  async function handleSaveWeekPrompts() {
    const promptsToSave: Record<string, DayPromptEntry> = {};
    for (const dateKey of weekDates) {
      const entry = dayPrompts[dateKey];
      if (entry?.prompt?.trim()) promptsToSave[dateKey] = entry;
      else promptsToSave[dateKey] = { prompt: '', provider: 'default' };
    }
    await handleSaveCompany({ dayPrompts: promptsToSave }, 'Week prompts saved');
  }

  async function toggleAutoGenerate(enabled: boolean) {
    await handleSaveCompany({ autoGenerateEnabled: enabled }, enabled ? 'Daily auto-generate ON' : 'Daily auto-generate OFF');
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
            Manage daily social posts per company. Each tab has its own brand, AI providers, schedule, and post queue.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5"
          >
            {showSettings ? 'Hide settings' : 'Company settings'}
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

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => selectCompany(company.id)}
            className={cn(
              'px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 transition-colors',
              company.id === activeCompanyId
                ? 'border-bee-amber text-bee-amber bg-bee-amber/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5',
            )}
          >
            {company.name}
            {company.autoGenerateEnabled && (
              <span className="ml-2 text-[10px] uppercase text-green-400">Auto</span>
            )}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-1">
          <input
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="New company"
            className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white w-28"
          />
          <button
            type="button"
            disabled={addingCompany || !newCompanyName.trim()}
            onClick={handleAddCompany}
            className="p-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-40"
            title="Add company tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeCompany && (
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={activeCompany.autoGenerateEnabled}
                onChange={(e) => toggleAutoGenerate(e.target.checked)}
                className="rounded"
              />
              Daily auto-generate
            </label>
            <span className="text-xs text-slate-500">
              {activeCompany.autoGenerateEnabled
                ? `Runs ~${activeCompany.scheduleHour}:00 AM PT`
                : 'Manual generate only'}
            </span>
            <span className="text-xs text-slate-500">
              Text: <strong className="text-slate-300">{activeCompany.textProvider}</strong>
              {' · '}
              Image: <strong className="text-slate-300">{activeCompany.imageProvider}</strong>
            </span>
          </div>
          <label className="text-xs text-slate-400 flex items-center gap-2">
            Schedule hour (PT)
            <select
              value={activeCompany.scheduleHour}
              onChange={(e) => handleSaveCompany({ scheduleHour: Number(e.target.value) })}
              className="px-2 py-1 rounded bg-black/40 border border-white/10 text-white"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i}:00</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="rounded-xl border border-bee-amber/20 bg-bee-amber/5 px-4 py-3 text-sm text-slate-300">
        <strong className="text-bee-amber">{activeCompany?.name || 'Company'}:</strong> research one article → write FB/IG/X captions → generate images → you review & publish.
        Use <strong className="text-white">week prompts</strong> below to steer each day&apos;s topic.
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
          disabled={savingCompany}
          onClick={handleSaveWeekPrompts}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          {savingCompany ? 'Saving…' : 'Save week prompts'}
        </button>
      </section>

      {showSettings && activeCompany && (
        <>
          <section className="rounded-2xl border border-white/10 p-5 bg-black/20 space-y-5">
            <h3 className="text-sm font-semibold text-white">AI providers for {activeCompany.name}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Text generation</span>
                <select
                  value={activeCompany.textProvider}
                  onChange={(e) => handleSaveCompany({ textProvider: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                >
                  <option value="gemini">Gemini</option>
                  <option value="grok">Grok</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Image generation</span>
                <select
                  value={activeCompany.imageProvider}
                  onChange={(e) => handleSaveCompany({ imageProvider: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                >
                  <option value="gemini">Gemini</option>
                  <option value="grok">Grok</option>
                </select>
              </label>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <CompanyProviderCard
                label="Grok (xAI)"
                enabled={activeCompany.providers.grok.enabled}
                textModel={activeCompany.providers.grok.textModel}
                imageModel={activeCompany.providers.grok.imageModel}
                apiKeyHint={activeCompany.providers.grok.apiKey.hint}
                textModels={GROK_TEXT_MODELS}
                imageModels={GROK_IMAGE_MODELS}
                onSave={(patch) => handleSaveCompany({ providers: { grok: patch } })}
              />
              <CompanyProviderCard
                label="Gemini (Google)"
                enabled={activeCompany.providers.gemini.enabled}
                textModel={activeCompany.providers.gemini.textModel}
                imageModel={activeCompany.providers.gemini.imageModel}
                apiKeyHint={activeCompany.providers.gemini.apiKey.hint}
                serverKeyNote={activeCompany.serverGeminiAvailable}
                textModels={GEMINI_TEXT_MODELS}
                imageModels={GEMINI_IMAGE_MODELS}
                onSave={(patch) => handleSaveCompany({ providers: { gemini: patch } })}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 p-5 bg-black/20 space-y-4">
            <h3 className="text-sm font-semibold text-white">Brand & knowledge</h3>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Website URL</span>
              <input
                defaultValue={activeCompany.siteUrl}
                onBlur={(e) => e.target.value !== activeCompany.siteUrl && handleSaveCompany({ siteUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Brand voice</span>
              <textarea
                defaultValue={activeCompany.brandVoice}
                onBlur={(e) => e.target.value !== activeCompany.brandVoice && handleSaveCompany({ brandVoice: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Knowledge base (injected into captions)</span>
              <textarea
                defaultValue={activeCompany.knowledge}
                onBlur={(e) => e.target.value !== activeCompany.knowledge && handleSaveCompany({ knowledge: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-white/10 p-5 bg-black/20 space-y-4">
            <h3 className="text-sm font-semibold text-white">Social links & SMS</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {(['facebook', 'instagram', 'x'] as const).map((key) => (
                <label key={key} className="block">
                  <span className="text-xs text-slate-500 capitalize mb-1 block">{key} URL</span>
                  <input
                    defaultValue={activeCompany.socialLinks[key]}
                    onBlur={(e) => {
                      if (e.target.value !== activeCompany.socialLinks[key]) {
                        handleSaveCompany({ socialLinks: { ...activeCompany.socialLinks, [key]: e.target.value } });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                  />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex-grow max-w-xs">
                <span className="text-xs text-slate-500 mb-1 block">SMS phone (E.164)</span>
                <input
                  defaultValue={activeCompany.notifyPhone}
                  onBlur={(e) => e.target.value !== activeCompany.notifyPhone && handleSaveCompany({ notifyPhone: e.target.value })}
                  placeholder="+1..."
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                />
              </label>
              <button
                type="button"
                onClick={() => sendTestSms(user, activeCompanyId, activeCompany.notifyPhone).then(() => showToast('Test SMS sent')).catch((e) => showToast(e.message))}
                className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-sm"
              >
                Test SMS
              </button>
            </div>
          </section>
        </>
      )}

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
                companyId={activeCompanyId}
                company={activeCompany}
                isToday={post.date === today || post.id.endsWith(`_${today}`)}
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
