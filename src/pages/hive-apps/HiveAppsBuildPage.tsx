import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Wand2, Loader2, CheckCircle2, Rocket } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { AssistantTopSpacer } from '../../components/HomeAssistantWeb';
import {
  approveHiveTask,
  createHiveTask,
  getHiveTask,
  getHiveStatus,
  type HiveTask,
} from '../../lib/hiveBuildApi';

const STARTERS = [
  'Build me a habit tracker with daily streaks',
  'Make a tip calculator for restaurants',
  'Create a grocery list with checkboxes',
  'Interview prep flashcards app',
  'Water intake tracker for 30 days',
  'Expense log with categories',
];

type ChatLine = { id: string; role: 'user' | 'ai'; content: string };

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function HiveAppsBuildPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(searchParams.get('q') || '');
  const [lines, setLines] = useState<ChatLine[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        'Describe the app you want in plain English. I will quote a price, you approve, and Hive Magic builds it — right here in the browser.',
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [activeTask, setActiveTask] = useState<HiveTask | null>(null);
  const [online, setOnline] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef(false);

  useEffect(() => {
    void getHiveStatus().then((s) => setOnline(!!s?.online));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, activeTask]);

  const appendAi = useCallback((content: string) => {
    setLines((prev) => [...prev, { id: newId(), role: 'ai', content }]);
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback(
    (taskId: string) => {
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const task = await getHiveTask(taskId);
          setActiveTask(task);
          if (task.status === 'complete') {
            stopPoll();
            const appId = task.appId || task.deliverable?.appId;
            appendAi(
              `Your app **${task.title || 'is ready'}**! Opening it now — refresh happens automatically when tweaks land.`
            );
            if (appId) {
              setTimeout(() => navigate(`/hive-apps/run/${appId}`), 800);
            }
          } else if (task.status === 'failed') {
            stopPoll();
            appendAi(task.reply || 'Build failed — try a smaller first version or rephrase.');
          }
        } catch {
          // keep polling
        }
      }, 4000);
    },
    [appendAi, navigate, stopPoll]
  );

  useEffect(() => () => stopPoll(), [stopPoll]);

  const onBuild = async (message: string) => {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setLines((prev) => [...prev, { id: newId(), role: 'user', content: text }]);
    setPrompt('');

    try {
      const task = await createHiveTask(text);
      setActiveTask(task);
      const estimate = task.estimate
        ? `~$${task.estimate.costUsd.toFixed(2)} · ~${task.estimate.minutes} min`
        : 'estimate pending';
      appendAi(task.reply || `Got it. ${task.summary || ''}\n\nEstimate: ${estimate}`);

      if (task.status === 'awaiting_approval') {
        appendAi('Tap **Approve & Build** below when you are ready.');
      } else if (task.status === 'building') {
        startPoll(task.id);
      } else if (task.status === 'complete') {
        const appId = task.appId || task.deliverable?.appId;
        if (appId) navigate(`/hive-apps/run/${appId}`);
      }
    } catch (e) {
      appendAi(e instanceof Error ? e.message : 'Build could not start — check connection or credits.');
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    if (!activeTask || busy) return;
    setBusy(true);
    try {
      const task = await approveHiveTask(activeTask.id);
      setActiveTask(task);
      appendAi('Approved — Hive Magic is building your app. This page updates automatically.');
      startPoll(task.id);
    } catch (e) {
      appendAi(e instanceof Error ? e.message : 'Could not approve build.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
    if (q && !bootRef.current) {
      bootRef.current = true;
      void onBuild(q);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SEO
        title="Build a Hive App — AiBhive"
        description="Describe an app in plain English. Approve the quote and Hive Magic builds it in your browser — same flow as mobile."
      />
      <AssistantTopSpacer />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-bee-amber/10 mb-3">
            <Wand2 className="w-7 h-7 text-bee-amber" />
          </div>
          <h1 className="text-3xl font-black text-white">Build with Hive Magic</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Full build loop in the browser {online ? '· Hive online' : '· connecting…'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 flex flex-col min-h-[420px] max-h-[min(70vh,640px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {lines.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-bee-amber text-bee-black font-medium'
                      : 'bg-white/10 text-slate-200 border border-white/10'
                  }`}
                >
                  {m.content.replace(/\*\*/g, '')}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-bee-amber" />
                Working…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {activeTask?.status === 'awaiting_approval' ? (
            <div className="px-4 py-3 border-t border-white/10 bg-emerald-500/5">
              <button
                type="button"
                onClick={() => void onApprove()}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-bee-amber text-bee-black font-extrabold disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                Approve & Build
                {activeTask.estimate ? ` (~$${activeTask.estimate.costUsd.toFixed(2)})` : ''}
              </button>
            </div>
          ) : null}

          {activeTask?.status === 'building' ? (
            <div className="px-4 py-3 border-t border-white/10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-bee-amber" />
              Building {activeTask.title || 'your app'}…
            </div>
          ) : null}

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder='e.g. "Build me a workout log with sets and reps"'
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-bee-amber/40 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void onBuild(prompt);
                  }
                }}
              />
              <button
                type="button"
                disabled={busy || !prompt.trim()}
                onClick={() => void onBuild(prompt)}
                className="px-4 rounded-xl bg-bee-amber text-bee-black font-extrabold disabled:opacity-50 self-end"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Try these</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setPrompt(s);
                  void onBuild(s);
                }}
                className="px-3 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {activeTask?.status === 'complete' && activeTask.appId ? (
          <div className="mt-6 text-center">
            <Link
              to={`/hive-apps/run/${activeTask.appId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-sm border border-emerald-500/30"
            >
              <Rocket className="w-4 h-4" />
              Open {activeTask.title || 'your app'}
            </Link>
          </div>
        ) : null}

        <p className="text-center text-slate-500 text-xs mt-10">
          <Link to="/hive-apps" className="text-bee-amber hover:underline">
            ← Back to My Apps
          </Link>
        </p>
      </div>
    </>
  );
}
