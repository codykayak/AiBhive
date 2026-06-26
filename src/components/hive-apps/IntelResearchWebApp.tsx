import { useCallback, useState } from 'react';
import {
  Compass,
  Copy,
  Globe,
  Loader2,
  MapPin,
  Radar,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import {
  runIntelResearch,
  type IntelRunStep,
  type IntelTargetType,
} from '../../lib/intelAgentApi';

const TARGET_TYPES: { id: IntelTargetType; label: string; hint: string; placeholder: string }[] = [
  { id: 'company', label: 'Company', hint: 'Business name — we find their site & leadership', placeholder: 'Acme Corporation' },
  { id: 'domain', label: 'Website', hint: 'Domain or URL — DNS, tech stack, site content', placeholder: 'example.com' },
  { id: 'person', label: 'Person', hint: 'Full name — social, LinkedIn dorks, username probe', placeholder: 'Jane Smith' },
];

const CLOUD_TOOLS = [
  { id: 'firecrawl_search' as const, label: 'Deep web search', desc: 'Firecrawl search across the open web' },
  { id: 'serp_search' as const, label: 'News & listings', desc: 'SerpAPI results (never hits Google directly)' },
  { id: 'firecrawl_scrape' as const, label: 'Site scrape', desc: 'Scrape target website when domain is known' },
];

type Props = { expanded?: boolean };

export default function IntelResearchWebApp({ expanded }: Props) {
  const brand = brandFor('purple');
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [targetType, setTargetType] = useState<IntelTargetType>('company');
  const [label, setLabel] = useState('');
  const [domain, setDomain] = useState('');
  const [userIntent, setUserIntent] = useState(
    'I want to know everything publicly available — leadership, tech stack, contacts, infrastructure, and reputation.'
  );
  const [restrictToRegion, setRestrictToRegion] = useState(false);
  const [location, setLocation] = useState('');
  const [radiusMiles, setRadiusMiles] = useState('50');
  const [enabledTools, setEnabledTools] = useState<Array<'firecrawl_search' | 'firecrawl_scrape' | 'serp_search'>>([
    'firecrawl_search',
    'serp_search',
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [brief, setBrief] = useState('');
  const [steps, setSteps] = useState<IntelRunStep[]>([]);
  const [synthesized, setSynthesized] = useState(false);

  const activeTarget = TARGET_TYPES.find((t) => t.id === targetType)!;

  const toggleTool = (id: typeof enabledTools[number]) => {
    setEnabledTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      setStatus('Brief copied');
      setTimeout(() => setStatus(''), 2000);
    } catch {
      setError('Could not copy — select text manually.');
    }
  };

  const handleRun = useCallback(async () => {
    setError('');
    if (!label.trim()) {
      setError('Enter a company, website, or person to research.');
      return;
    }
    if (!enabledTools.length) {
      setError('Enable at least one research module.');
      return;
    }

    setLoading(true);
    setStatus('Running Hive Cloud OSINT…');
    setSteps([]);

    try {
      const result = await runIntelResearch({
        targetType,
        label: label.trim(),
        domain: domain.trim() || undefined,
        userIntent: userIntent.trim(),
        restrictToRegion,
        location: location.trim(),
        radiusMiles: parseInt(radiusMiles, 10) || 50,
        tools: enabledTools,
      });
      setBrief(result.brief);
      setSteps(result.steps);
      setSynthesized(!!result.synthesized);
      setStep('results');
      setStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  }, [targetType, label, domain, userIntent, restrictToRegion, location, radiusMiles, enabledTools]);

  if (step === 'results' && brief) {
    return (
      <div
        className={`rounded-2xl border border-white/10 overflow-hidden ${expanded ? '' : 'max-h-[520px] overflow-y-auto'}`}
        style={{ background: `linear-gradient(180deg, ${brand.primarySoft} 0%, rgba(11,15,20,0.95) 40%)` }}
      >
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            New search
          </button>
          <div className="flex items-center gap-2">
            {synthesized ? (
              <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI brief
              </span>
            ) : null}
            <button
              type="button"
              onClick={copyBrief}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
        </div>

        {steps.length > 0 ? (
          <div className="px-4 sm:px-5 pt-4 flex flex-wrap gap-2">
            {steps.map((s) => (
              <span
                key={s.toolId}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                  s.status === 'done'
                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                    : s.status === 'failed'
                      ? 'border-red-500/30 text-red-400 bg-red-500/10'
                      : 'border-white/15 text-slate-400'
                }`}
              >
                {s.toolId.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        ) : null}

        <div className="p-4 sm:p-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[min(60vh,520px)] overflow-y-auto">
            {brief}
          </div>
          {status ? <p className="text-green-400 text-xs mt-2">{status}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 overflow-hidden ${expanded ? '' : 'max-h-[520px] overflow-y-auto'}`}
      style={{ background: `linear-gradient(180deg, ${brand.primarySoft} 0%, rgba(11,15,20,0.95) 40%)` }}
    >
      <div className="p-4 sm:p-5 border-b border-white/10">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: brand.primarySoft }}
          >
            <Radar className="w-5 h-5" style={{ color: brand.primary }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: brand.primaryText }}>
              Research
            </p>
            <p className="text-white font-bold text-lg mt-0.5">AI-directed OSINT</p>
            <p className="text-slate-400 text-sm mt-1">
              Hive Cloud runs Firecrawl & SerpAPI — then synthesizes an intelligence brief.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed">
          Authorized research only — publicly available data for legitimate business, security, and journalistic use.
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-500 mb-2">Target type</p>
          <div className="flex flex-wrap gap-2">
            {TARGET_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTargetType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                  targetType === t.id ? 'border-transparent text-bee-black' : 'border-white/10 text-slate-400'
                }`}
                style={targetType === t.id ? { backgroundColor: brand.primary } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-2">{activeTarget.hint}</p>
        </div>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={activeTarget.placeholder}
          className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-slate-500"
        />

        {targetType === 'company' ? (
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Domain override (optional) — acme.com"
            className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-slate-500"
          />
        ) : null}

        <textarea
          value={userIntent}
          onChange={(e) => setUserIntent(e.target.value)}
          rows={3}
          placeholder="What do you want to learn?"
          className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-slate-500 resize-none"
        />

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={restrictToRegion}
              onChange={(e) => setRestrictToRegion(e.target.checked)}
              className="rounded border-white/20"
            />
            <MapPin className="w-4 h-4 text-slate-500" />
            Restrict search to a region
          </label>
          {restrictToRegion ? (
            <div className="flex gap-2">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, state"
                className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
              />
              <select
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(e.target.value)}
                className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
              >
                {['30', '50', '75', '100'].map((m) => (
                  <option key={m} value={m}>
                    {m} mi
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-500 mb-2">Cloud modules</p>
          <div className="space-y-2">
            {CLOUD_TOOLS.map((tool) => {
              const on = enabledTools.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => toggleTool(tool.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    on ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 bg-black/20 opacity-70'
                  }`}
                >
                  <p className="text-white text-sm font-bold">{tool.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{tool.desc}</p>
                </button>
              );
            })}
          </div>
          <p className="text-slate-600 text-xs mt-2 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Uses Hive credits per module — same metering as mobile Intel Agent.
          </p>
        </div>

        {error ? (
          <p className="text-red-400 text-sm rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2">{error}</p>
        ) : null}
        {status ? <p className="text-amber-300 text-sm">{status}</p> : null}

        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-bee-black disabled:opacity-50"
          style={{ backgroundColor: brand.primary }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running research…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Run Intel Agent
            </>
          )}
        </button>

        <p className="text-center text-slate-600 text-xs flex items-center justify-center gap-1">
          <Compass className="w-3 h-3" />
          Mobile app adds username probe, DNS, Wayback & PDF export
        </p>
      </div>
    </div>
  );
}
