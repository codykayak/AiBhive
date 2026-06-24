import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { createHiveBuildTask } from '../../lib/hiveStoreApi';
import { getHiveWebAuthHeaders } from '../../lib/hiveWebAuth';

const STARTERS = [
  'Build me a habit tracker with daily streaks',
  'Make a tip calculator for restaurants',
  'Create a grocery list with checkboxes',
  'Interview prep flashcards app',
  'Water intake tracker for 30 days',
  'Expense log with categories',
];

export default function HiveAppsBuildPage() {
  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState(searchParams.get('q') || '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ taskId: string; reply?: string } | null>(null);
  const [error, setError] = useState('');

  const onBuild = async (message: string) => {
    const text = message.trim();
    if (!text) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { userId, idToken } = await getHiveWebAuthHeaders();
      const task = await createHiveBuildTask(text, userId, idToken);
      if (!task) {
        setError('Build could not start. Try the AiBhive mobile app for the full experience.');
        return;
      }
      setResult(task);
    } catch {
      setError('Something went wrong. Download AiBhive and build from the Build tab.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO
        title="Build a Hive App — AiBhive Store"
        description="Describe an app in plain English. AiBhive builds it in seconds — then share, tweak, or export."
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bee-amber/10 mb-4">
            <Wand2 className="w-8 h-8 text-bee-amber" />
          </div>
          <h1 className="text-3xl font-black text-white">Build from scratch</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Describe what you want. Most apps ship in under a minute (~$1). Open AiBhive on your phone for
            the full build, tweak, and share flow.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder='e.g. "Build me a workout log with sets and reps"'
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-bee-amber/40 resize-none"
          />
          <button
            type="button"
            disabled={busy || !prompt.trim()}
            onClick={() => void onBuild(prompt)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-bee-amber text-bee-black font-extrabold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {busy ? 'Building…' : 'Build with Hive Magic'}
          </button>
        </div>

        {error ? <p className="text-red-400 text-sm text-center mt-4">{error}</p> : null}

        {result ? (
          <div className="mt-6 p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-emerald-400 font-bold text-sm mb-2">Build started</p>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{result.reply || 'Check My Apps in AiBhive when ready.'}</p>
            <p className="text-slate-500 text-xs mt-3">Task: {result.taskId}</p>
            <a
              href="https://aibhive.com/api/download/apk"
              className="inline-block mt-4 text-bee-amber font-bold text-sm"
            >
              Download AiBhive to open your app →
            </a>
          </div>
        ) : null}

        <div className="mt-10">
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
                className="px-3 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-10">
          <Link to="/hive-apps" className="text-bee-amber hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </>
  );
}
