import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { KeyRound, Loader2, Save, Trash2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { prosJson, type ProsAiProvider, type ProsProviderId } from '../../lib/prosApi';
import { prosAdmin as t } from './prosAdminTheme';

const PROVIDER_BLURBS: Record<ProsProviderId, string> = {
  grok: 'Best for field vision + snappy trade diagnosis (Diagnose default).',
  claude: 'Strong reasoning for long repair write-ups and safety notes.',
  kimi: 'Kimi / Kimmy (Moonshot) — long-context helper for manuals & specs.',
  gemini: 'Google Gemini — solid general fallback and multimodal checks.',
};

export default function ProsAiKeysPanel({ user }: { user: User }) {
  const [providers, setProviders] = useState<ProsAiProvider[]>([]);
  const [preferred, setPreferred] = useState<ProsProviderId>('grok');
  const [drafts, setDrafts] = useState<Partial<Record<ProsProviderId, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await prosJson<{ preferredAiProvider: ProsProviderId; providers: ProsAiProvider[] }>(
        '/api/pros/ai-keys',
        user
      );
      setProviders(data.providers);
      setPreferred(data.preferredAiProvider || 'grok');
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to load AI keys' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePreferred = async (next: ProsProviderId) => {
    setSaving('preferred');
    setMessage(null);
    try {
      await prosJson('/api/pros/ai-keys', user, {
        method: 'POST',
        body: JSON.stringify({ preferredAiProvider: next }),
      });
      setPreferred(next);
      setMessage({ type: 'ok', text: `Default model set to ${next}` });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(null);
    }
  };

  const saveKey = async (provider: ProsProviderId) => {
    const apiKey = drafts[provider]?.trim();
    if (!apiKey) {
      setMessage({ type: 'err', text: 'Paste an API key first' });
      return;
    }
    setSaving(provider);
    setMessage(null);
    try {
      await prosJson('/api/pros/ai-keys', user, {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey }),
      });
      setDrafts((d) => ({ ...d, [provider]: '' }));
      setMessage({ type: 'ok', text: `${provider} key saved (stored encrypted server-side)` });
      await load();
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(null);
    }
  };

  const clearKey = async (provider: ProsProviderId) => {
    setSaving(`clear-${provider}`);
    try {
      await prosJson('/api/pros/ai-keys', user, {
        method: 'POST',
        body: JSON.stringify({ provider, clear: true }),
      });
      setMessage({ type: 'ok', text: `${provider} company key cleared` });
      await load();
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Clear failed' });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-16 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading AI providers…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`${t.calloutAmber} p-6`}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">AI models for Diagnose</h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Drop in company keys for <strong className="text-amber-700">Grok</strong>,{' '}
              <strong className="text-amber-700">Claude</strong>,{' '}
              <strong className="text-amber-700">Kimi / Kimmy</strong>, and{' '}
              <strong className="text-amber-700">Gemini</strong>. Field techs inherit the company default;
              keys never display in full after save.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Default provider</span>
          {(['grok', 'claude', 'kimi', 'gemini'] as ProsProviderId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => void savePreferred(id)}
              disabled={saving === 'preferred'}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors',
                preferred === id
                  ? 'bg-[#F5A623] text-slate-900 border-amber-400'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-500/40'
              )}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <div className={message.type === 'ok' ? t.success : t.error}>
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {providers.map((p) => (
          <div key={p.id} className={`${t.card} p-5 space-y-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900">{p.label}</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">{PROVIDER_BLURBS[p.id]}</p>
                <p className="mt-2 text-[11px] text-slate-400 font-mono">{p.hint}</p>
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full',
                  p.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                )}
              >
                {p.configured ? `On · ${p.source}` : 'Not set'}
              </span>
            </div>

            {p.last4 ? (
              <p className="text-sm text-slate-700">
                Current: <span className="font-mono text-amber-700">{p.last4}</span>
              </p>
            ) : null}

            <input
              type="password"
              autoComplete="off"
              placeholder={`Paste ${p.id} API key`}
              value={drafts[p.id] || ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
              className={`w-full ${t.input}`}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveKey(p.id)}
                disabled={saving === p.id}
                className={`inline-flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50 ${t.btnPrimary}`}
              >
                {saving === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save key
              </button>
              {p.source === 'company' ? (
                <button
                  type="button"
                  onClick={() => void clearKey(p.id)}
                  disabled={saving === `clear-${p.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 text-sm px-4 py-2"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
