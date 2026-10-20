import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Calendar, Loader2, Phone, Plus, RefreshCw, Save, Zap } from 'lucide-react';
import {
  disconnectGoogleCalendar,
  fetchEscalationSettings,
  fetchGoogleCalendarStatus,
  refreshEmployeeRag,
  saveEscalationSettings,
  setGoogleCalendarId,
  setImFreeNow,
  startGoogleCalendarConnect,
  type EscalationOpsSettings,
  type GoogleCalendarStatus,
  type NotifyPhoneEntry,
} from '../../lib/employeePortalApi';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

type Props = { user: User; businessId: string };

export default function EmployeeEscalationSettings({ user, businessId }: Props) {
  const [ops, setOps] = useState<EscalationOpsSettings | null>(null);
  const [preview, setPreview] = useState('');
  const [grok, setGrok] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [calendar, setCalendar] = useState<GoogleCalendarStatus | null>(null);

  const load = useCallback(async () => {
    setError('');
    const [data, cal] = await Promise.all([
      fetchEscalationSettings(user, businessId),
      fetchGoogleCalendarStatus(user, businessId).catch(() => null),
    ]);
    setOps(data.escalationOps);
    setPreview(data.previewReply || '');
    setGrok(Boolean(data.grokSmsAgent));
    setCalendar(cal || data.googleCalendar || null);
  }, [user, businessId]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : 'Could not load settings'));
  }, [load]);

  const save = async () => {
    if (!ops) return;
    setBusy('save');
    setError('');
    try {
      const data = await saveEscalationSettings(user, businessId, ops);
      setOps(data.escalationOps);
      setPreview(data.previewReply || '');
      setNotice('Escalation & callback settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy('');
    }
  };

  if (!ops) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-12">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading escalation settings…
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const phones = ops.notifyPhones?.length ? ops.notifyPhones : [];

  const addPhone = () => {
    const id = crypto.randomUUID().slice(0, 8);
    const next: NotifyPhoneEntry[] = [...phones, { id, label: 'New line', e164: '' }];
    setOps({ ...ops, notifyPhones: next, activeNotifyPhoneId: ops.activeNotifyPhoneId || id });
  };

  const updatePhone = (id: string, patch: Partial<NotifyPhoneEntry>) => {
    setOps({
      ...ops,
      notifyPhones: phones.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const removePhone = (id: string) => {
    const next = phones.filter((p) => p.id !== id);
    setOps({
      ...ops,
      notifyPhones: next,
      activeNotifyPhoneId: ops.activeNotifyPhoneId === id ? next[0]?.id || '' : ops.activeNotifyPhoneId,
    });
  };

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm">{notice}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => {
            setBusy('free');
            void setImFreeNow(user, businessId)
              .then((data) => {
                setOps(data.escalationOps);
                setPreview(data.previewReply);
                setNotice('You’re marked free now — agent will offer a call in ~15 minutes today.');
              })
              .catch((e) => setError(e instanceof Error ? e.message : 'Could not update availability'))
              .finally(() => setBusy(''));
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-black font-extrabold px-4 py-2.5 text-sm disabled:opacity-50"
        >
          <Zap className="w-4 h-4" /> I&apos;m free now
        </button>
        <span className="text-xs text-slate-500 self-center">One tap — no need to edit weekly hours.</span>
      </div>

      <section className="rounded-2xl border border-white/10 p-5 space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Phone className="w-5 h-5 text-bee-amber" /> Escalation text alerts
        </h3>
        <p className="text-sm text-slate-400">
          Save multiple numbers (cell, Google Voice, desk). Pick which one gets escalation SMS today.
        </p>
        <label className="block text-xs text-slate-500 max-w-md">
          Active notify line
          <select
            value={ops.activeNotifyPhoneId || ''}
            onChange={(e) => setOps({ ...ops, activeNotifyPhoneId: e.target.value })}
            className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
          >
            <option value="">— select —</option>
            {phones.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label || 'Line'} ({p.e164 || 'no number'})
              </option>
            ))}
          </select>
        </label>
        <ul className="space-y-3">
          {phones.map((p) => (
            <li key={p.id} className="rounded-xl border border-white/10 p-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <label className="text-xs text-slate-500">
                Label
                <input
                  value={p.label}
                  onChange={(e) => updatePhone(p.id, { label: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-slate-500">
                E.164
                <input
                  value={p.e164}
                  onChange={(e) => updatePhone(p.id, { e164: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-sm font-mono"
                  placeholder="+1…"
                />
              </label>
              <button type="button" onClick={() => removePhone(p.id)} className="text-xs text-red-300 font-bold px-2 py-1">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addPhone}
          className="inline-flex items-center gap-1 text-sm font-bold text-bee-amber"
        >
          <Plus className="w-4 h-4" /> Add notify number
        </button>
        <p className="text-xs text-slate-500">
          Grok SMS replies: <strong className={grok ? 'text-emerald-300' : 'text-amber-300'}>{grok ? 'ON' : 'OFF — set XAI_API_KEY on Cloud Run'}</strong>
        </p>
      </section>

      <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-300" /> Google Calendar
        </h3>
        <p className="text-sm text-slate-400">
          When a lead escalates, we create a 30-minute callback event on your calendar (uses scheduled time or ~15 min from now).
        </p>
        {calendar?.connected ? (
          <>
            <p className="text-sm text-emerald-200">Connected as {calendar.connectedEmail || 'Google account'}</p>
            <label className="block text-xs text-slate-500 max-w-lg">
              Calendar
              <select
                value={calendar.calendarId || 'primary'}
                onChange={(e) => {
                  const id = e.target.value;
                  setBusy('cal');
                  void setGoogleCalendarId(user, businessId, id)
                    .then(() => fetchGoogleCalendarStatus(user, businessId).then(setCalendar))
                    .then(() => setNotice('Calendar updated.'))
                    .catch((err) => setError(err instanceof Error ? err.message : 'Calendar update failed'))
                    .finally(() => setBusy(''));
                }}
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
              >
                {(calendar.calendars || [{ id: calendar.calendarId, summary: 'Primary' }]).map((c) => (
                  <option key={c.id} value={c.id}>{c.summary}{c.primary ? ' (primary)' : ''}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="text-xs text-red-300 font-bold"
              onClick={() => {
                void disconnectGoogleCalendar(user, businessId)
                  .then(() => load())
                  .then(() => setNotice('Calendar disconnected.'));
              }}
            >
              Disconnect Google Calendar
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={Boolean(busy) || calendar?.oauthReady === false}
            onClick={() => {
              setBusy('gcal');
              void startGoogleCalendarConnect(user, businessId)
                .then(({ url }) => {
                  window.location.href = url;
                })
                .catch((e) => setError(e instanceof Error ? e.message : 'Connect failed'))
                .finally(() => setBusy(''));
            }}
            className="rounded-xl bg-white text-bee-black font-extrabold px-4 py-2 text-sm disabled:opacity-40"
          >
            Connect Google Calendar
          </button>
        )}
        {calendar?.oauthReady === false ? (
          <p className="text-xs text-amber-200">Server needs GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET on Cloud Run.</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-bee-amber/25 bg-bee-amber/5 p-5 space-y-4">
        <h3 className="font-bold">Today override</h3>
        <p className="text-sm text-slate-400">Day job until 3? Day off? Overrides the weekly template for today only.</p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-xs text-slate-500">
            Date
            <input
              type="date"
              value={ops.todayOverride?.date || today}
              onChange={(e) =>
                setOps({
                  ...ops,
                  todayOverride: { ...(ops.todayOverride || {}), date: e.target.value },
                })
              }
              className="mt-1 block rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(ops.todayOverride?.dayOff)}
              onChange={(e) =>
                setOps({
                  ...ops,
                  todayOverride: { ...(ops.todayOverride || { date: today }), dayOff: e.target.checked },
                })
              }
            />
            Day off (call soon)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ops.todayOverride?.immediate !== false && Boolean(ops.todayOverride?.dayOff)}
              onChange={(e) =>
                setOps({
                  ...ops,
                  todayOverride: { ...(ops.todayOverride || { date: today }), immediate: e.target.checked },
                })
              }
            />
            Offer call in ~{ops.immediateCallbackMinutes || 15} min
          </label>
          <label className="text-xs text-slate-500">
            Earliest hour (24h)
            <input
              type="number"
              min={0}
              max={23}
              value={ops.todayOverride?.afterHour ?? 15}
              onChange={(e) =>
                setOps({
                  ...ops,
                  todayOverride: { ...(ops.todayOverride || { date: today }), afterHour: Number(e.target.value) },
                })
              }
              className="mt-1 w-20 rounded-xl bg-black/50 border border-white/10 px-2 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-5">
        <h3 className="font-bold mb-3">Weekly default (Mon–Fri job until 3 PM)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {DAYS.map((day) => {
            const row = ops.weeklyAvailability?.[day] || { dayOff: false, afterHour: 15, untilHour: 19 };
            return (
              <div key={day} className="rounded-xl border border-white/10 p-3">
                <p className="font-bold uppercase text-xs text-slate-500">{day}</p>
                <label className="flex items-center gap-2 mt-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(row.dayOff)}
                    onChange={(e) =>
                      setOps({
                        ...ops,
                        weeklyAvailability: {
                          ...ops.weeklyAvailability,
                          [day]: { ...row, dayOff: e.target.checked },
                        },
                      })
                    }
                  />
                  Day off
                </label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={row.afterHour ?? 15}
                    onChange={(e) =>
                      setOps({
                        ...ops,
                        weeklyAvailability: {
                          ...ops.weeklyAvailability,
                          [day]: { ...row, afterHour: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-16 rounded-lg bg-black/50 border border-white/10 px-2 py-1 text-xs"
                    title="After hour"
                  />
                  <span className="text-slate-500 self-center">–</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={row.untilHour ?? 19}
                    onChange={(e) =>
                      setOps({
                        ...ops,
                        weeklyAvailability: {
                          ...ops.weeklyAvailability,
                          [day]: { ...row, untilHour: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-16 rounded-lg bg-black/50 border border-white/10 px-2 py-1 text-xs"
                    title="Until hour"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-5 space-y-3">
        <h3 className="font-bold">SMS phrases (agent uses these patterns)</h3>
        <label className="block text-xs text-slate-500">
          Immediate (~15 min)
          <textarea
            rows={2}
            value={ops.schedulingPhrases?.immediate || ''}
            onChange={(e) =>
              setOps({
                ...ops,
                schedulingPhrases: { ...ops.schedulingPhrases, immediate: e.target.value },
              })
            }
            className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-slate-500">
          Later today ({'{time}'})
          <textarea
            rows={2}
            value={ops.schedulingPhrases?.laterToday || ''}
            onChange={(e) =>
              setOps({
                ...ops,
                schedulingPhrases: { ...ops.schedulingPhrases, laterToday: e.target.value },
              })
            }
            className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
          />
        </label>
        <p className="text-xs text-slate-500">
          <strong>Preview right now:</strong> {preview || '—'}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void save()}
          className="inline-flex items-center gap-2 rounded-xl bg-bee-amber text-bee-black font-extrabold px-4 py-2 text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {busy === 'save' ? 'Saving…' : 'Save settings'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => {
            setBusy('rag');
            void refreshEmployeeRag(user, businessId)
              .then(() => setNotice('Website RAG cache cleared — next SMS reply pulls fresh macrorei.com text.'))
              .catch((e) => setError(e instanceof Error ? e.message : 'RAG refresh failed'))
              .finally(() => setBusy(''));
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Refresh macrorei.com RAG
        </button>
      </div>
    </div>
  );
}
