import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Bell, CheckCircle2, Loader2, Send, Trash2, XCircle } from 'lucide-react';
import {
  prosRespondNotification,
  prosSendNotification,
  prosDeleteNotification,
  formatMemberLabel,
  type ProsJob,
  type ProsMember,
  type ProsNotification,
} from '../../lib/prosApi';
import { cn } from '../../lib/utils';
import { prosAdmin as t } from './prosAdminTheme';

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
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  const techs = members.filter((m) => m.status === 'active' && m.role !== 'owner');

  const send = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    setPushFeedback(null);
    try {
      const assignee = members.find((m) => m.uid === assigneeUid);
      const job = jobs.find((j) => j.id === jobId);
      const result = await prosSendNotification(user, {
        title: title.trim(),
        body: body.trim(),
        assigneeUid: assigneeUid || null,
        assigneeName: assignee?.displayName || assignee?.email || null,
        jobId: jobId || null,
        jobTitle: job?.title || null,
        priority,
        type: jobId ? 'job_update' : 'announcement',
      });
      const push = (result as { push?: { sent?: number; targets?: number } }).push;
      if (push) {
        if (push.targets === 0) {
          setPushFeedback(
            'Saved to inbox, but no push tokens registered — pick a tech with “push ✓” in Team, or have them open the app while signed in.'
          );
        } else if ((push.sent || 0) < (push.targets || 0)) {
          setPushFeedback(`Push sent to ${push.sent} of ${push.targets} device(s).`);
        } else {
          setPushFeedback(`Push delivered to ${push.sent} device(s).`);
        }
      }
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

  const removeNotification = async (n: ProsNotification) => {
    if (!window.confirm(`Delete “${n.title}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      await prosDeleteNotification(user, n.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {isManager ? (
        <div className={`${t.card} p-5 space-y-4`}>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-600" />
            Notify field techs
          </h2>
          <p className="text-sm text-slate-600">
            Push job updates to Diagnose. Techs can confirm completion and describe the fix — that flows back into
            your living knowledge base.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title — e.g. Emergency: heater not firing"
              className={`${t.input} md:col-span-2`}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Details for the tech…"
              rows={3}
              className={`${t.textarea} md:col-span-2`}
            />
            <select
              value={assigneeUid}
              onChange={(e) => setAssigneeUid(e.target.value)}
              className={t.input}
            >
              <option value="">All techs / broadcast</option>
              {techs.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {formatMemberLabel(m)}
                </option>
              ))}
            </select>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className={t.input}
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
              className={t.input}
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {error ? <p className={t.errorInline}>{error}</p> : null}
          {pushFeedback ? <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{pushFeedback}</p> : null}
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => void send()}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 ${t.btnPrimary}`}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Send to field app
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-bold text-slate-800">Inbox</h3>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`${t.cardSubtle} p-4`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                    t.notifyPriority[n.priority] || t.notifyPriority.normal
                  )}
                >
                  {n.priority}
                </span>
                <span className="text-[10px] uppercase text-slate-500">{n.status}</span>
                {n.jobTitle ? <span className="text-xs text-sky-700">· {n.jobTitle}</span> : null}
              </div>
              <div className="font-bold">{n.title}</div>
              {n.body ? <p className="text-sm text-slate-600 mt-1">{n.body}</p> : null}
              {n.response?.fixSummary ? (
                <p className="text-sm text-emerald-800 mt-2 border-l-2 border-emerald-400 pl-3">
                  Fix: {n.response.fixSummary}
                </p>
              ) : null}
              {n.createdAt ? (
                <div className="text-[11px] text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
              ) : null}

              {isManager ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeNotification(n)}
                  className="inline-flex items-center gap-1 mt-3 rounded-lg bg-red-50 text-red-700 px-3 py-1.5 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              ) : null}

              {!isManager && n.status === 'pending' && (!n.assigneeUid || n.assigneeUid === user.uid) ? (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void respond(n, true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done — log fix
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void respond(n, false)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-bold"
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
