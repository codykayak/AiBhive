import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  Calendar,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';

type JobStatus = 'draft' | 'generated' | 'submitted' | 'interviewing' | 'rejected' | 'offer';

type JobApplication = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  companyName: string;
  roleTitle: string;
  jobUrl?: string;
  notes?: string;
  followUp?: string;
};

type FollowUp = {
  id: string;
  text: string;
  done: boolean;
};

const JOBS_KEY = 'aibhive_job_tracker_v1';
const FOLLOWUPS_KEY = 'aibhive_job_followups_v1';

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  generated: 'Kit ready',
  submitted: 'Submitted',
  interviewing: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
};

const FILTERS: Array<{ id: 'all' | JobStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'generated', label: 'Kit ready' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'interviewing', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
];

function loadJobs(): JobApplication[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (raw) return JSON.parse(raw) as JobApplication[];
  } catch {
    // ignore
  }
  return [];
}

function saveJobs(jobs: JobApplication[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

function loadFollowUps(): FollowUp[] {
  try {
    const raw = localStorage.getItem(FOLLOWUPS_KEY);
    if (raw) return JSON.parse(raw) as FollowUp[];
  } catch {
    // ignore
  }
  return [
    { id: 'fu1', text: 'Email recruiter at Stripe', done: false },
    { id: 'fu2', text: 'Send thank-you after Notion screen', done: false },
  ];
}

function saveFollowUps(items: FollowUp[]) {
  localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(items));
}

type Props = { expanded?: boolean };

export default function JobTrackerWebApp({ expanded }: Props) {
  const brand = brandFor('blue');
  const [tab, setTab] = useState<'applications' | 'follow-ups'>('applications');
  const [jobs, setJobs] = useState<JobApplication[]>(loadJobs);
  const [followUps, setFollowUps] = useState<FollowUp[]>(loadFollowUps);
  const [filter, setFilter] = useState<'all' | JobStatus>('all');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', role: '', url: '', notes: '' });
  const [newFollowUp, setNewFollowUp] = useState('');

  useEffect(() => {
    saveJobs(jobs);
  }, [jobs]);

  useEffect(() => {
    saveFollowUps(followUps);
  }, [followUps]);

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (filter !== 'all') list = list.filter((j) => j.status === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) =>
          j.companyName.toLowerCase().includes(q) ||
          j.roleTitle.toLowerCase().includes(q) ||
          (j.jobUrl || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [jobs, filter, query]);

  const addJob = useCallback(() => {
    if (!form.company.trim() || !form.role.trim()) return;
    const now = new Date().toISOString();
    const job: JobApplication = {
      id: `job_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      companyName: form.company.trim(),
      roleTitle: form.role.trim(),
      jobUrl: form.url.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    setJobs((prev) => [job, ...prev]);
    setForm({ company: '', role: '', url: '', notes: '' });
    setShowForm(false);
  }, [form]);

  const cycleStatus = (id: string) => {
    const order: JobStatus[] = ['draft', 'generated', 'submitted', 'interviewing', 'offer', 'rejected'];
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const idx = order.indexOf(j.status);
        const next = order[(idx + 1) % order.length];
        return { ...j, status: next, updatedAt: new Date().toISOString() };
      })
    );
  };

  const removeJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const addFollowUpRow = () => {
    const text = newFollowUp.trim();
    if (!text) return;
    setFollowUps((prev) => [...prev, { id: `fu_${Date.now()}`, text, done: false }]);
    setNewFollowUp('');
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 overflow-hidden ${expanded ? '' : 'max-h-[520px] overflow-y-auto'}`}
      style={{ background: `linear-gradient(180deg, ${brand.primarySoft} 0%, rgba(11,15,20,0.95) 40%)` }}
    >
      <div className="p-4 sm:p-5 border-b border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: brand.primaryText }}>
              Job Tracker
            </p>
            <p className="text-white font-bold text-lg mt-0.5">Your application pipeline</p>
          </div>
          <Link
            to="/hive-apps/run/example-resume-bot"
            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl shrink-0"
            style={{ backgroundColor: brand.primarySoft, color: brand.primaryText }}
          >
            <Plus className="w-3.5 h-3.5" />
            New kit
          </Link>
        </div>

        <div className="flex gap-2 mt-4">
          {(['applications', 'follow-ups'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${
                tab === t ? 'text-bee-black' : 'text-slate-400 bg-white/5'
              }`}
              style={tab === t ? { backgroundColor: brand.primary } : undefined}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'applications' ? (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company or role…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border ${
                  filter === f.id ? 'border-transparent text-bee-black' : 'border-white/10 text-slate-400'
                }`}
                style={filter === f.id ? { backgroundColor: brand.primary } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>

          {showForm ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
              <input
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                placeholder="Company name"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
              />
              <input
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                placeholder="Role title"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
              />
              <input
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="Job URL (optional)"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notes"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addJob}
                  className="flex-1 py-2 rounded-lg font-bold text-sm text-bee-black"
                  style={{ backgroundColor: brand.primary }}
                >
                  Save application
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-sm font-bold text-slate-300 hover:border-white/25"
            >
              <Plus className="w-4 h-4" />
              Add application
            </button>
          )}

          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No applications yet — add your first above.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((job) => (
                <li
                  key={job.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 flex items-start gap-3"
                >
                  <Briefcase className="w-5 h-5 shrink-0 mt-0.5" style={{ color: brand.primaryText }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold truncate">{job.companyName}</p>
                    <p className="text-slate-400 text-sm truncate">{job.roleTitle}</p>
                    {job.jobUrl ? (
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs mt-1 inline-flex items-center gap-0.5 hover:underline"
                        style={{ color: brand.primaryText }}
                      >
                        Job link <ChevronRight className="w-3 h-3" />
                      </a>
                    ) : null}
                    {job.notes ? <p className="text-slate-500 text-xs mt-2 line-clamp-2">{job.notes}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => cycleStatus(job.id)}
                      className="text-[10px] font-bold uppercase px-2 py-1 rounded-full border border-white/15 text-slate-300 hover:border-white/30"
                      title="Tap to change status"
                    >
                      {STATUS_LABELS[job.status]}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeJob(job.id)}
                      className="p-1 text-slate-600 hover:text-red-400"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex gap-2">
            <input
              value={newFollowUp}
              onChange={(e) => setNewFollowUp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFollowUpRow()}
              placeholder="Follow up with…"
              className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm"
            />
            <button
              type="button"
              onClick={addFollowUpRow}
              className="px-4 py-2 rounded-xl font-bold text-sm text-bee-black"
              style={{ backgroundColor: brand.primary }}
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {followUps.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    setFollowUps((prev) =>
                      prev.map((f) => (f.id === item.id ? { ...f, done: !f.done } : f))
                    )
                  }
                  className="rounded border-white/20"
                />
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span className={`text-sm flex-1 ${item.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => setFollowUps((prev) => prev.filter((f) => f.id !== item.id))}
                  className="text-slate-600 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
