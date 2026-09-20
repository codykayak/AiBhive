import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Briefcase,
  Loader2,
  FileText,
  Mail,
  RefreshCw,
  Save,
  Sparkles,
  ExternalLink,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { adminFetch, adminFormData, adminJson } from '../../lib/adminApi';
import { cn } from '../../lib/utils';

export type JobApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  products: string[];
  aboutYou: string;
  callTime: string;
  callTimeNote?: string;
  timezone?: string;
  resumeFileName: string;
  createdAt: string | null;
  status: string;
  adminNotes: string;
  hired: boolean;
  contacted: boolean;
  grokScore: number | null;
  grokRelativeRank: number | null;
  grokRankSummary: string;
  grokScoredAt: string | null;
  resumeExcerpt?: string;
};

const PRODUCT_LABEL: Record<string, string> = {
  aibhive: 'AiBhive',
  manydoors: 'ManyDoors',
  macrorei: 'MacroREI',
};

const PRODUCT_SLUGS = ['aibhive', 'manydoors', 'macrorei'] as const;

const CALL_OPTIONS = [
  { id: 'weekday-morning', label: 'Weekday mornings (8am–12pm PT)' },
  { id: 'weekday-afternoon', label: 'Weekday afternoons (12pm–5pm PT)' },
  { id: 'weekday-evening', label: 'Weekday evenings (5pm–8pm PT)' },
  { id: 'weekend', label: 'Weekends' },
  { id: 'specific', label: 'Specific / notes below' },
] as const;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminJobApplicationsPanel({ user }: { user: User }) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rescoringId, setRescoringId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualProducts, setManualProducts] = useState<string[]>(['aibhive']);
  const [manualAbout, setManualAbout] = useState('');
  const [manualCallTime, setManualCallTime] = useState('specific');
  const [manualCallNote, setManualCallNote] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualResume, setManualResume] = useState<File | null>(null);
  const [manualContacted, setManualContacted] = useState(false);
  const [manualHired, setManualHired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminJson<{ applications: JobApplication[]; notifyEmail?: string }>(
        '/api/admin/job-applications?limit=100',
        user,
      );
      setApplications(data.applications || []);
      setNotifyEmail(data.notifyEmail || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => applications.find((a) => a.id === selectedId) || null,
    [applications, selectedId],
  );

  useEffect(() => {
    setNotesDraft(selected?.adminNotes || '');
  }, [selected?.id, selected?.adminNotes]);

  async function saveApplicant(id: string, patch: { adminNotes?: string; hired?: boolean; contacted?: boolean }) {
    setSavingId(id);
    setError('');
    try {
      const data = await adminJson<{ application: JobApplication }>(
        `/api/admin/job-applications/${id}`,
        user,
        { method: 'PATCH', body: JSON.stringify(patch) },
      );
      setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingId(null);
    }
  }

  async function rescore(id: string) {
    setRescoringId(id);
    setError('');
    try {
      const data = await adminJson<{ application: JobApplication }>(
        `/api/admin/job-applications/${id}/rescore`,
        user,
        { method: 'POST', body: '{}' },
      );
      setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rescore failed');
    } finally {
      setRescoringId(null);
    }
  }

  async function downloadResume(id: string, fileName: string) {
    try {
      const res = await adminFetch(`/api/admin/job-applications/${id}/resume`, user);
      if (!res.ok) throw new Error('Could not download resume');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }

  function toggleManualProduct(slug: string) {
    setManualProducts((current) =>
      current.includes(slug) ? current.filter((p) => p !== slug) : [...current, slug],
    );
  }

  function resetManualForm() {
    setManualName('');
    setManualEmail('');
    setManualPhone('');
    setManualProducts(['aibhive']);
    setManualAbout('');
    setManualCallTime('specific');
    setManualCallNote('');
    setManualNotes('');
    setManualResume(null);
    setManualContacted(false);
    setManualHired(false);
  }

  async function submitManualApplicant(event: React.FormEvent) {
    event.preventDefault();
    if (!manualName.trim()) {
      setError('Name is required.');
      return;
    }
    if (manualProducts.length === 0) {
      setError('Pick at least one product desk.');
      return;
    }
    setManualSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.set('name', manualName.trim());
      body.set('email', manualEmail.trim());
      body.set('phone', manualPhone.trim());
      body.set('products', manualProducts.join(','));
      body.set('aboutYou', manualAbout.trim() || 'Added manually in admin.');
      body.set('callTime', manualCallTime);
      body.set('callTimeNote', manualCallNote.trim());
      body.set('adminNotes', manualNotes.trim());
      body.set('contacted', String(manualContacted));
      body.set('hired', String(manualHired));
      if (manualResume) body.set('resume', manualResume);

      const data = await adminFormData<{ application: JobApplication }>(
        '/api/admin/job-applications',
        user,
        body,
      );
      setApplications((prev) => [data.application, ...prev]);
      setSelectedId(data.application.id);
      resetManualForm();
      setManualOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add applicant');
    } finally {
      setManualSaving(false);
    }
  }

  async function resendEmail(id: string) {
    setSavingId(id);
    try {
      await adminJson(`/api/admin/job-applications/${id}/resend-email`, user, { method: 'POST', body: '{}' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resend failed');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-10 h-10 text-bee-amber animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-bee-amber" />
            Job applications
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Submissions from{' '}
            <a href="https://aibhive.com/jobs" className="text-bee-amber hover:underline inline-flex items-center gap-1">
              aibhive.com/jobs
              <ExternalLink className="w-3 h-3" />
            </a>
            {notifyEmail ? ` · Notify: ${notifyEmail}` : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      ) : null}

      <div className="mb-6 border border-white/10 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setManualOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white/5 hover:bg-white/[0.07] text-left transition-colors"
        >
          <span className="flex items-center gap-2 text-white font-semibold">
            <UserPlus className="w-5 h-5 text-bee-amber" />
            Add applicant manually
          </span>
          {manualOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {manualOpen ? (
          <form onSubmit={submitManualApplicant} className="p-5 md:p-6 border-t border-white/10 space-y-4">
            <p className="text-sm text-slate-400">
              For referrals, Indeed DMs, or walk-ins — saves to the same list with resume in storage.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full name *</label>
                <input
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                <input
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                />
              </div>
            </div>
            <fieldset>
              <legend className="text-xs font-semibold text-slate-400 mb-2">Product desk *</legend>
              <div className="flex flex-wrap gap-3">
                {PRODUCT_SLUGS.map((slug) => (
                  <label key={slug} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualProducts.includes(slug)}
                      onChange={() => toggleManualProduct(slug)}
                      className="accent-amber-500"
                    />
                    {PRODUCT_LABEL[slug]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">About them</label>
              <textarea
                value={manualAbout}
                onChange={(e) => setManualAbout(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm resize-y"
                placeholder="Background, how you found them, why they might fit…"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Call window</label>
                <select
                  value={manualCallTime}
                  onChange={(e) => setManualCallTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                >
                  {CALL_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Call note</label>
                <input
                  value={manualCallNote}
                  onChange={(e) => setManualCallNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Your notes (optional)</label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm resize-y"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Resume (PDF, Word, or text)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf"
                onChange={(e) => setManualResume(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-bee-amber file:text-bee-black file:font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualContacted}
                  onChange={(e) => setManualContacted(e.target.checked)}
                  className="accent-amber-500"
                />
                Already contacted
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualHired}
                  onChange={(e) => setManualHired(e.target.checked)}
                  className="accent-amber-500"
                />
                Hired
              </label>
            </div>
            <button
              type="submit"
              disabled={manualSaving}
              className="px-5 py-2.5 rounded-xl bg-bee-amber text-bee-black font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              {manualSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Save applicant
            </button>
          </form>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 max-h-[520px] overflow-y-auto border border-white/10 rounded-2xl divide-y divide-white/5">
          {applications.length === 0 ? (
            <p className="p-8 text-slate-500 text-center">No applications yet.</p>
          ) : (
            applications.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedId(app.id)}
                className={cn(
                  'w-full text-left p-4 hover:bg-white/5 transition-colors',
                  selectedId === app.id && 'bg-bee-amber/10 border-l-2 border-bee-amber',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-semibold">{app.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{app.email}</p>
                  </div>
                  {app.grokScore != null ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-bold">
                      {app.grokScore}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs">Scoring…</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(app.products || []).map((p) => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                      {PRODUCT_LABEL[p] || p}
                    </span>
                  ))}
                  {app.contacted ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Contacted</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">New</span>
                  )}
                  {app.hired ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Hired</span>
                  ) : null}
                </div>
                <p className="text-slate-500 text-[11px] mt-2">{formatDate(app.createdAt)}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3 border border-white/10 rounded-2xl p-5 md:p-6 min-h-[320px]">
          {!selected ? (
            <p className="text-slate-500 text-center py-12">Select an applicant to review.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selected.name}</h3>
                  <p className="text-slate-400 text-sm">
                    {selected.phone} · {selected.email}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selected.contacted}
                      onChange={(e) => void saveApplicant(selected.id, { contacted: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 accent-amber-500"
                    />
                    <span className="text-white font-medium">Contacted</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selected.hired}
                      onChange={(e) => void saveApplicant(selected.id, { hired: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 accent-amber-500"
                    />
                    <span className="text-white font-medium">Hired</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => downloadResume(selected.id, selected.resumeFileName)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-bee-amber flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => resendEmail(selected.id)}
                  disabled={savingId === selected.id}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  Resend notify email
                </button>
                <button
                  type="button"
                  onClick={() => rescore(selected.id)}
                  disabled={rescoringId === selected.id}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm text-purple-200 flex items-center gap-1"
                >
                  {rescoringId === selected.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Re-score with Grok
                </button>
              </div>

              <div className="mb-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <p className="text-xs font-bold uppercase tracking-wide text-purple-300 mb-1">Grok score</p>
                {selected.grokScore != null ? (
                  <p className="text-3xl font-black text-white mb-2">
                    {selected.grokScore}
                    {selected.grokRelativeRank != null ? (
                      <span className="text-sm font-normal text-slate-400 ml-2">
                        rank #{selected.grokRelativeRank}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm">Pending… refresh in a minute after submit.</p>
                )}
                {selected.grokRankSummary ? (
                  <p className="text-slate-300 text-sm leading-relaxed">{selected.grokRankSummary}</p>
                ) : null}
                {selected.grokScoredAt ? (
                  <p className="text-slate-500 text-xs mt-2">Scored {formatDate(selected.grokScoredAt)}</p>
                ) : null}
              </div>

              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">About them</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{selected.aboutYou}</p>

              <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block" htmlFor="admin-applicant-notes">
                Your notes on this applicant
              </label>
              <textarea
                id="admin-applicant-notes"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={6}
                className="w-full mb-2 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-bee-amber/50 resize-y min-h-[8rem]"
                placeholder="Call recap, strengths, concerns, next steps…"
              />
              <button
                type="button"
                disabled={savingId === selected.id}
                onClick={() => void saveApplicant(selected.id, { adminNotes: notesDraft })}
                className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black font-bold text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {savingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save notes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
