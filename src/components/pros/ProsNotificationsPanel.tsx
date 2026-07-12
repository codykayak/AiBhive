import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Bell, CheckCircle2, Loader2, Send, XCircle } from 'lucide-react';
import {
  prosRespondNotification,
  prosSendNotification,
  type ProsJob,
  type ProsMember,
  type ProsNotification,
} from '../../lib/prosApi';
import { cn } from '../../lib/utils';

type Props = {
  user: User;
  notifications: ProsNotification[];
  members: ProsMember[];
  jobs: ProsJob[];
  isManager: boolean;
  onRefresh: () => Promise<void>;
};

export default function ProsNotificationsPanel({
  user,
  notifications,
  members,
  jobs,
  isManager,
  onRefresh,
}: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assigneeUid, setAssigneeUid] = useState('');
  const [jobId, setJobId] = useState('');
  const [priority, setPriority] = useState<ProsNotification['priority']>('normal');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const techs = members.filter((m) => m.status === 'active' && m.role !== 'owner');

  const send = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const assignee = members.find((m) => m.uid === assigneeUid);
      const job = jobs.find((j) => j.id === jobId);
      await prosSendNotification(user, {
        title: title.trim(),
        body: body.trim(),
        assigneeUid: assigneeUid || null,
        assigneeName: assignee?.displayName || assignee?.email || null,
        jobId: jobId || null,
        jobTitle: job?.title || null,
        priority,
        type: jobId ? 'job_update' : 'announcement',
      });
      setTitle('');
      setBody('');
      setAssigneeUid('');
      setJobId('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  const respond = async (n: ProsNotification, completed: boolean) => {
    const fixSummary = completed
      ? window.prompt('What was the fix? (feeds your knowledge base)', '') || ''
      : '';
    if (completed && !fixSummary.trim()) return;
    setBusy(true);
    try {
      await prosRespondNotification(user, n.id, {
        completed,
        fixSummary: fixSummary.trim(),
        tipText: completed ? fixSummary.trim() : undefined,
        jobTitle: n.jobTitle || undefined,
        packId: 'pool',
      });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Response failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {isManager ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            Notify field techs
          </h2>
          <p className="text-sm text-slate-400">
            Push job updates to Diagnose. Techs can confirm completion and describe the fix — that flows back into
            your living knowledge base.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title — e.g. Emergency: heater not firing"
              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm md:col-span-2"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Details for the tech…"
              rows={3}
              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm md:col-span-2 resize-y"
            />
            <select
              value={assigneeUid}
              onChange={(e) => setAssigneeUid(e.target.value)}
              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
            >
              <option value="">All techs / broadcast</option>
              {techs.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.displayName || m.email}
                </option>
              ))}
            </select>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
            >
              <option value="">Link to job (optional)</option>
              {jobs
                .filter((j) => j.status !== 'done')
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ProsNotification['priority'])}
              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => void send()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 text-black font-bold px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Send to field app
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-bold text-slate-300">Inbox</h3>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                    n.priority === 'urgent'
                      ? 'bg-red-500/20 text-red-300'
                      : n.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/5 text-slate-400'
                  )}
                >
                  {n.priority}
                </span>
                <span className="text-[10px] uppercase text-slate-500">{n.status}</span>
                {n.jobTitle ? <span className="text-xs text-sky-300">· {n.jobTitle}</span> : null}
              </div>
              <div className="font-bold">{n.title}</div>
              {n.body ? <p className="text-sm text-slate-400 mt-1">{n.body}</p> : null}
              {n.response?.fixSummary ? (
                <p className="text-sm text-emerald-300 mt-2 border-l-2 border-emerald-500/40 pl-3">
                  Fix: {n.response.fixSummary}
                </p>
              ) : null}
              {n.createdAt ? (
                <div className="text-[11px] text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
              ) : null}

              {!isManager && n.status === 'pending' && (!n.assigneeUid || n.assigneeUid === user.uid) ? (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void respond(n, true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 text-emerald-300 px-3 py-1.5 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done — log fix
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void respond(n, false)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 text-slate-400 px-3 py-1.5 text-xs font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Not yet
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
