import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import { loadJobs, saveJobs } from '../../lib/diagnoseWeb/api';
import type { DiagnoseWebJob } from '../../lib/diagnoseWeb/types';
import type { TradePackId } from '../../../aibhive-diagnose/lib/packs/types';

function newJob(packId: TradePackId): DiagnoseWebJob {
  return {
    id: `job_${Date.now()}`,
    title: '',
    address: '',
    packId,
    status: 'queued',
    notes: '',
    createdAt: Date.now(),
  };
}

export default function DiagnoseWebJobs() {
  const { activePack } = useDiagnoseWeb();
  const [jobs, setJobs] = useState<DiagnoseWebJob[]>(() => loadJobs());
  const [draftTitle, setDraftTitle] = useState('');
  const [draftAddress, setDraftAddress] = useState('');

  const sorted = useMemo(
    () => [...jobs].sort((a, b) => b.createdAt - a.createdAt),
    [jobs]
  );

  const persist = (next: DiagnoseWebJob[]) => {
    setJobs(next);
    saveJobs(next);
  };

  const addJob = () => {
    if (!draftTitle.trim()) return;
    const job = { ...newJob(activePack.id), title: draftTitle.trim(), address: draftAddress.trim() };
    persist([job, ...jobs]);
    setDraftTitle('');
    setDraftAddress('');
  };

  const cycleStatus = (job: DiagnoseWebJob) => {
    const order: DiagnoseWebJob['status'][] = ['queued', 'in_progress', 'needs_parts', 'done'];
    const idx = order.indexOf(job.status);
    const next = order[(idx + 1) % order.length];
    persist(jobs.map((j) => (j.id === job.id ? { ...j, status: next } : j)));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Jobs</h1>
      <p className="text-slate-400 text-sm mt-2">Local job board — syncs with Pros HQ when you use the mobile app with a team code.</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1018] p-4 space-y-3">
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Job title"
          className="w-full px-4 py-2.5 rounded-xl bg-[#070a10] border border-white/10 text-white text-sm"
        />
        <input
          value={draftAddress}
          onChange={(e) => setDraftAddress(e.target.value)}
          placeholder="Address (optional)"
          className="w-full px-4 py-2.5 rounded-xl bg-[#070a10] border border-white/10 text-white text-sm"
        />
        <button
          type="button"
          onClick={addJob}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add job
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {sorted.length === 0 && <p className="text-slate-500 text-sm">No jobs yet.</p>}
        {sorted.map((job) => (
          <div key={job.id} className="rounded-2xl border border-white/10 bg-[#0c1018] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{job.title}</p>
              {job.address && <p className="text-xs text-slate-500 truncate">{job.address}</p>}
              <p className="text-xs text-slate-600 mt-1">{job.packId} · {new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              type="button"
              onClick={() => cycleStatus(job)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 text-amber-400 uppercase"
            >
              {job.status.replace('_', ' ')}
            </button>
            <Link
              to={`/diagnose/app/chat?jobId=${job.id}`}
              className="text-sm font-bold text-white hover:text-amber-400"
            >
              Diagnose
            </Link>
            <button
              type="button"
              onClick={() => persist(jobs.filter((j) => j.id !== job.id))}
              className="text-slate-500 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
