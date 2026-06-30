import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import {
  loadJobCriteria,
  loadResumeProfiles,
  saveJobCriteria,
  saveResumeProfiles,
  searchJobs,
  type JobHunterCriteria,
  type JobHunterResult,
  type ResumeProfile,
} from '../../lib/jobHunterApi';

type Props = { expanded?: boolean };
type Tab = 'search' | 'resumes' | 'results';

const DEFAULT_CRITERIA: JobHunterCriteria = {
  keywords: 'product manager, remote',
  wageType: 'yearly',
  minWage: '120000',
  experienceLevel: 'Mid-level (3-5 years)',
  locations: 'United States',
  remote: true,
  dateListedDays: 30,
};

export default function JobHunterWebApp({ expanded }: Props) {
  const brand = brandFor('blue');
  const [tab, setTab] = useState<Tab>('search');
  const [criteria, setCriteria] = useState<JobHunterCriteria>(() => ({
    ...DEFAULT_CRITERIA,
    ...loadJobCriteria(),
  }));
  const [resumes, setResumes] = useState<ResumeProfile[]>(() => loadResumeProfiles());
  const [jobs, setJobs] = useState<JobHunterResult[]>([]);
  const [note, setNote] = useState('');
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    saveJobCriteria(criteria);
  }, [criteria]);

  useEffect(() => {
    saveResumeProfiles(resumes);
  }, [resumes]);

  const onSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchJobs(criteria, resumes);
      if (!result.ok) {
        setError(result.error || 'Search failed.');
        return;
      }
      setJobs(result.jobs || []);
      setNote(result.note || '');
      setDemo(!!result.demo);
      setTab('results');
      setSelectedId(result.jobs?.[0]?.id || null);
    } finally {
      setLoading(false);
    }
  }, [criteria, resumes]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setError('Could not copy — select text manually.');
    }
  };

  const selected = jobs.find((j) => j.id === selectedId);

  const onResumeUpload = (profileId: string, file: File | null) => {
    if (!file) return;
    setResumes((prev) =>
      prev.map((r) => (r.id === profileId ? { ...r, fileName: file.name, notes: r.notes || file.name } : r))
    );
  };

  return (
    <div
      className={`flex flex-col gap-4 ${expanded ? 'min-h-[calc(100vh-12rem)]' : ''}`}
      style={{ ['--brand-primary' as string]: brand.primary }}
    >
      <header>
        <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">Job Hunter Bot</p>
        <h1 className="text-2xl font-black text-white mt-1">Find 10 jobs · auto cover letters</h1>
        <p className="text-slate-400 text-sm mt-1">
          Set criteria, get 10 matched listings with links, resume pick, and paste-ready cover letters.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ['search', 'Criteria', Search],
            ['resumes', 'My resumes', FileText],
            ['results', `Results (${jobs.length})`, Briefcase],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${
              tab === id ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
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

      {tab === 'search' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400">Keywords (comma-separated)</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm"
              value={criteria.keywords}
              onChange={(e) => setCriteria((c) => ({ ...c, keywords: e.target.value }))}
              placeholder="product manager, fintech, remote"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Wage type</label>
                <select
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  value={criteria.wageType}
                  onChange={(e) =>
                    setCriteria((c) => ({ ...c, wageType: e.target.value as JobHunterCriteria['wageType'] }))
                  }
                >
                  <option value="yearly">Yearly salary</option>
                  <option value="hourly">Hourly wage</option>
                  <option value="any">Any</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Min wage / salary</label>
                <input
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  value={criteria.minWage}
                  onChange={(e) => setCriteria((c) => ({ ...c, minWage: e.target.value }))}
                  placeholder={criteria.wageType === 'hourly' ? '45' : '120000'}
                />
              </div>
            </div>
            <label className="block text-xs font-bold text-slate-400">Experience level</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm"
              value={criteria.experienceLevel}
              onChange={(e) => setCriteria((c) => ({ ...c, experienceLevel: e.target.value }))}
            />
            <label className="block text-xs font-bold text-slate-400">Locations</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm"
              value={criteria.locations}
              onChange={(e) => setCriteria((c) => ({ ...c, locations: e.target.value }))}
              disabled={criteria.remote}
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={criteria.remote}
                onChange={(e) => setCriteria((c) => ({ ...c, remote: e.target.checked }))}
              />
              Remote only
            </label>
            <label className="block text-xs font-bold text-slate-400">Listed within (days)</label>
            <input
              type="number"
              min={1}
              max={90}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
              value={criteria.dateListedDays}
              onChange={(e) => setCriteria((c) => ({ ...c, dateListedDays: Number(e.target.value) || 30 }))}
            />
          </div>
          <div className="flex flex-col justify-end gap-3">
            <p className="text-slate-500 text-sm leading-relaxed">
              The bot searches live job boards when Firecrawl is configured, then writes a cover letter per listing and
              picks your best resume profile.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => void onSearch()}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 text-white font-extrabold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Find 10 jobs today
            </button>
            <Link
              to="/hive-apps/run/example-job-tracker"
              className="text-center text-sky-400 text-sm font-semibold hover:underline"
            >
              Open Job Tracker →
            </Link>
          </div>
        </div>
      )}

      {tab === 'resumes' && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Upload or label multiple resumes — the bot suggests which to use per job.</p>
          {resumes.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-bold">{r.label}</p>
                <p className="text-slate-500 text-xs capitalize">{r.type.replace('-', ' ')}</p>
                {r.fileName && <p className="text-sky-400 text-xs mt-1">{r.fileName} uploaded</p>}
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm text-slate-300 cursor-pointer hover:bg-white/10">
                <Upload className="w-4 h-4" />
                Upload PDF
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => onResumeUpload(r.id, e.target.files?.[0] || null)}
                />
              </label>
              <Link
                to="/hive-apps/run/example-resume-bot"
                className="text-sky-400 text-sm font-semibold hover:underline"
              >
                Full resume kit
              </Link>
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-slate-400 hover:text-white"
            onClick={() =>
              setResumes((prev) => [
                ...prev,
                {
                  id: `custom-${Date.now()}`,
                  label: 'Custom resume',
                  type: 'general',
                },
              ])
            }
          >
            + Add another resume profile
          </button>
        </div>
      )}

      {tab === 'results' && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 flex-1 min-h-0">
          <div className="space-y-2 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {jobs.length === 0 ? (
              <p className="text-slate-500 text-sm">Run a search from the Criteria tab.</p>
            ) : (
              jobs.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => setSelectedId(j.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    selectedId === j.id ? 'border-sky-500/50 bg-sky-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <p className="text-white font-bold text-sm">{j.title}</p>
                  <p className="text-slate-400 text-xs">{j.company}</p>
                  <p className="text-sky-400/80 text-xs mt-1">{j.matchScore}% match · {j.suggestedResumeLabel}</p>
                </button>
              ))
            )}
          </div>
          {selected ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4 overflow-y-auto max-h-[70vh]">
              {demo && note && <p className="text-amber-300/90 text-xs">{note}</p>}
              <div>
                <h2 className="text-xl font-black text-white">{selected.title}</h2>
                <p className="text-slate-400">{selected.company}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {selected.location}
                  </span>
                  <span>{selected.salary}</span>
                  <span>Posted {selected.listedDate || 'recently'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-bold"
                >
                  <ExternalLink className="w-4 h-4" /> Open listing
                </a>
                <button
                  type="button"
                  onClick={() => void copyText(selected.coverLetter, 'cover')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-white/15 text-sm text-slate-200"
                >
                  <Copy className="w-4 h-4" /> {copied === 'cover' ? 'Copied!' : 'Copy cover letter'}
                </button>
                <Link
                  to={`/hive-apps/run/example-resume-bot`}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-sky-500/30 text-sky-300 text-sm font-semibold"
                >
                  <Sparkles className="w-4 h-4" /> Full kit
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                Suggested resume: <strong className="text-sky-300">{selected.suggestedResumeLabel}</strong>
              </p>
              <section>
                <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wide mb-2">Cover letter</h3>
                <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selected.coverLetter}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
