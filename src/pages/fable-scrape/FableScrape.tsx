import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Globe,
  Search,
  Shield,
  Image as ImageIcon,
  FileText,
  FileType2,
  Video,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ScanText,
  CheckSquare,
  Square,
  ExternalLink,
  Layers,
  BookOpen,
  Sparkles,
  Wand2,
  Languages,
  Library,
  UploadCloud,
  Cpu,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { useRouting } from './useRouting';
import { useRoster } from './useRoster';
import {
  type Asset,
  type ScanResult,
  type HarvestResult,
  type Finding,
  type LibraryEntry,
  type ProviderId,
  PROVIDER_LABELS,
  saveBytes,
  base64ToBytes,
  saveText,
  blobToBase64,
  clientFetchBlob,
  fablePost,
  fableGet,
  parseFableJson,
  fableOcrPost,
} from './shared';
import { useFableApi } from './fableApiContext';
import { useFableWorkflowBridge } from './fableWorkflowBridge';
import { parseHttpUrl } from './urlNormalize';

type Tab = 'harvest' | 'scrape' | 'translate' | 'library';
type Engine = 'auto' | 'firecrawl' | 'stealth';

const TABS: { id: Tab; label: string; icon: typeof Wand2 }[] = [
  { id: 'harvest', label: 'AI Harvest', icon: Wand2 },
  { id: 'scrape', label: 'Manual Scrape', icon: Search },
  { id: 'translate', label: 'Translation Lab', icon: Languages },
  { id: 'library', label: 'Communal Library', icon: Library },
];

const ENGINES: { id: Engine; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'firecrawl', label: 'Max stealth' },
  { id: 'stealth', label: 'Standard' },
];

const OCR_FORMATS = ['Markdown', 'Plain Text', 'Preserve Layout'];

export default function FableScrape({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>('harvest');
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState<Engine>('auto');
  const routing = useRouting();
  const roster = useRoster();

  const requireUrl = () => {
    try {
      return parseHttpUrl(url);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Invalid URL.');
    }
  };

  return (
    <main className={embedded ? 'py-0' : 'py-24'}>
      {!embedded && (
      <SEO
        title="Fable Scrape — AI Research Harvester & Stealth Scraper | AiBhive"
        description="AiBhive Fable Scrape: tell AI what to find in bot-blocked archives. Stealth crawl, residential proxies, OCR, model-of-choice translation, and publish to a communal research library."
        keywords="AI web scraper, stealth scraper, residential proxy, historical document AI, archive OCR translation, communal research library, Fable Scrape"
      />
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {!embedded && (
        <>
        <div className="fable-frame mb-8">
          <header className="fable-grid rounded-3xl px-6 py-12 sm:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/40 backdrop-blur text-bee-amber text-xs font-bold uppercase tracking-[0.25em] mb-6 border border-bee-amber/30"
            >
              <Shield className="w-4 h-4" />
              By Fable · Research Harvester
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tight"
            >
              Fable <span className="text-gradient">Scrape</span>
            </motion.h1>
            <p className="text-lg sm:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
              Tell an AI what to find. It hunts through bot-blocked archives undetected, reads and translates the
              documents with the models you choose, and posts the findings to a communal library.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 flex-wrap text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="fable-beacon text-emerald-400"><span className="block w-2 h-2 rounded-full bg-emerald-400" /></span>
                Grok · Gemini · Claude · Kimi · DeepSeek
              </span>
              <Link to="/fable-scrape/guide" className="inline-flex items-center gap-1.5 text-bee-amber font-bold hover:underline">
                <BookOpen className="w-4 h-4" /> Full user guide <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </header>
        </div>
        </>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                  tab === t.id
                    ? 'border-bee-amber bg-bee-amber/10 text-bee-amber neon-glow'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'harvest' && (
          <HarvestTab
            url={url}
            setUrl={setUrl}
            requireUrl={requireUrl}
            engine={engine}
            setEngine={setEngine}
            routing={routing}
            roster={roster}
          />
        )}
        {tab === 'scrape' && (
          <ScrapeTab
            url={url}
            setUrl={setUrl}
            requireUrl={requireUrl}
            engine={engine}
            setEngine={setEngine}
            routing={routing}
          />
        )}
        {tab === 'translate' && <TranslateTab roster={roster} />}
        {tab === 'library' && <LibraryTab />}
      </div>
    </main>
  );
}

/* ============================ AI HARVEST ============================ */

function HarvestTab({
  url,
  setUrl,
  requireUrl,
  engine,
  setEngine,
  routing,
  roster,
}: {
  url: string;
  setUrl: (v: string) => void;
  requireUrl: () => string;
  engine: Engine;
  setEngine: (e: Engine) => void;
  routing: ReturnType<typeof useRouting>;
  roster: ReturnType<typeof useRoster>;
}) {
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(10);
  const [crawl, setCrawl] = useState(true);
  const [maxPages, setMaxPages] = useState(6);
  const [maxDepth, setMaxDepth] = useState(1);
  const [translate, setTranslate] = useState(true);
  const [targetLang, setTargetLang] = useState('English');

  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<HarvestResult | null>(null);
  const [publishState, setPublishState] = useState<{ busy: boolean; msg?: string; err?: string }>({ busy: false });
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('public');
  const [estimateMsg, setEstimateMsg] = useState('');
  const api = useFableApi();
  const bridge = useFableWorkflowBridge();

  useEffect(() => {
    if (bridge?.visibility) setVisibility(bridge.visibility);
  }, [bridge?.visibility]);

  useEffect(() => {
    if (!bridge?.authHeaders) {
      setEstimateMsg('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const headers = {
          ...(await bridge.authHeaders()),
          'Content-Type': 'application/json',
        };
        const res = await fetch('/api/research-lab/estimate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            op: 'ai-harvest',
            params: {
              findingCount: count,
              usesPlatformRouting: routing.routing.mode === 'residential' || routing.routing.mode === 'server',
              roles: roster.roster,
              keys: roster.keys,
            },
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setEstimateMsg(data.message || `About $${Number(data.estimatedCredits || 0).toFixed(2)} Hive credits`);
        }
      } catch {
        if (!cancelled) setEstimateMsg('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bridge, count, routing.routing.mode, roster.roster, roster.keys]);

  const run = async () => {
    let target = '';
    try {
      target = requireUrl();
    } catch (err) {
      return setError(err instanceof Error ? err.message : 'Enter a valid archive URL.');
    }
    if (!prompt.trim()) return setError('Tell the AI what to find.');
    if (!routing.routingReady) return setError(routing.notReadyMessage);
    setError('');
    setResult(null);
    setPublishState({ busy: false });
    setRunning(true);
    try {
      const data = await fablePost(api, '/ai-harvest', {
          url: target,
          prompt: prompt.trim(),
          count,
          crawl,
          maxPages,
          maxDepth,
          engine,
          routing: routing.routing,
          roles: roster.roster,
          keys: roster.keys,
          translate,
          targetLang,
        });
      setResult(data as HarvestResult);
      const text = (data.findings || [])
        .map((f: Finding) => [f.translation, f.ocrText, f.reason].filter(Boolean).join('\n'))
        .filter(Boolean)
        .join('\n\n---\n\n');
      if (bridge) {
        if (text) bridge.setScrapeText(text);
        const urls = (data.findings || []).map((f: Finding) => f.url).filter(Boolean);
        if (urls.length) bridge.setImageUrls(urls);
        bridge.appendOutput({
          step: 'scrape',
          title: `AI Harvest — ${data.findings?.length || 0} finding(s)`,
          text: text || data.strategy || 'Harvest complete',
          sourceUrl: data.sourceUrl || target,
        });
        if (typeof data.chargedUsd === 'number') {
          bridge.addReceipt({
            feature: 'research_lab_ai_harvest',
            summary: `AI harvest (${data.findings?.length || 0} findings)`,
            rawCostUsd: 0,
            chargedUsd: data.chargedUsd,
          });
        }
        bridge.addReliability({
          op: 'ai-harvest',
          ok: true,
          engine,
          routingMode: routing.routing.mode,
          retries: Array.isArray(data.warnings) ? data.warnings.length : 0,
          reason: data.warnings?.[0],
          pagesVisited: data.candidatesConsidered,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Harvest failed.';
      setError(msg);
      bridge?.addReliability({
        op: 'ai-harvest',
        ok: false,
        engine,
        routingMode: routing.routing.mode,
        reason: msg,
      });
    } finally {
      setRunning(false);
    }
  };

  const publish = async () => {
    if (!result?.findings?.length) return;
    setPublishState({ busy: true });
    try {
      const data = await fablePost(api, '/publish', {
          findings: result.findings.filter((f) => f.ocrText || f.translation),
          prompt: result.prompt,
          sourceUrl: result.sourceUrl,
          roles: result.roles,
          targetLang,
          visibility,
          projectId: bridge?.projectId || undefined,
        });
      const shareHint = data.sharePath ? ` Share: ${data.sharePath}` : '';
      setPublishState({
        busy: false,
        msg: `Published ${data.published} finding(s) (${visibility}).${shareHint}`,
      });
      if (bridge) {
        bridge.appendOutput({
          step: 'library',
          title: `Published ${data.published} finding(s)`,
          text: `Visibility: ${visibility}${shareHint}`,
          sourceUrl: result.sourceUrl,
        });
        if (typeof data.chargedUsd === 'number') {
          bridge.addReceipt({
            feature: 'research_lab_publish',
            summary: `Publish ${data.published} finding(s)`,
            rawCostUsd: 0,
            chargedUsd: data.chargedUsd,
          });
        }
      }
    } catch (err) {
      setPublishState({ busy: false, err: err instanceof Error ? err.message : 'Publish failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-5">
        {/* Prompt */}
        <div>
          <label className="block text-slate-300 text-sm font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-bee-amber" /> What should the AI find?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. Search this archive and return 10 pages of cuneiform text that likely haven't been translated before and may contain something valuable."
            className="w-full bg-[#0f1115]/70 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-bee-amber/50 focus:outline-none resize-y"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-slate-300 text-sm font-bold mb-2">Archive / start URL</label>
          <div className="relative">
            <Globe className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://digitalarchive.example.org/collection/tablets"
              className="w-full bg-[#0f1115]/70 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:border-bee-amber/50 focus:outline-none"
            />
          </div>
          <p className="text-slate-500 text-xs mt-1.5">
            Paste the full page address (must include the site name, e.g. archive.org/…). Domain-only is fine — we add https://.
          </p>
        </div>

        {/* Scope row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-1">Findings (≤15)</label>
            <input type="number" min={1} max={8} value={count} onChange={(e) => setCount(Math.max(1, Math.min(8, Number(e.target.value) || 1)))} className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-bee-amber/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-1">Max pages</label>
            <input type="number" min={1} max={20} value={maxPages} disabled={!crawl} onChange={(e) => setMaxPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-bee-amber/50 focus:outline-none disabled:opacity-40" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-1">Link depth</label>
            <input type="number" min={0} max={4} value={maxDepth} disabled={!crawl} onChange={(e) => setMaxDepth(Math.max(0, Math.min(4, Number(e.target.value) || 0)))} className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-bee-amber/50 focus:outline-none disabled:opacity-40" />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 cursor-pointer">
            <input type="checkbox" checked={crawl} onChange={(e) => setCrawl(e.target.checked)} className="accent-bee-amber w-4 h-4" />
            <span className="text-slate-300 text-sm">Crawl site</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={translate} onChange={(e) => setTranslate(e.target.checked)} className="accent-bee-amber w-4 h-4" />
            <span className="text-slate-300 text-sm">Translate findings</span>
          </label>
          {translate && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">into</span>
              <input value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-40 bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:border-bee-amber/50 focus:outline-none" />
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 text-xs">Engine</span>
            {ENGINES.map((e) => (
              <button key={e.id} onClick={() => setEngine(e.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${engine === e.id ? 'border-bee-amber bg-bee-amber/10 text-bee-amber' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {roster.ui}
        {routing.ui}

        {estimateMsg && (
          <p className="text-xs text-cyan-300/90 text-center font-medium">{estimateMsg}</p>
        )}

        <button
          onClick={run}
          disabled={running}
          className="w-full py-4 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {running ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> AI is harvesting…</> : <><Wand2 className="w-5 h-5 mr-3" /> Run AI Harvest</>}
        </button>
        {running && (
          <div className="space-y-2">
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="fable-progress h-full w-full" /></div>
            <p className="text-xs text-slate-500 text-center">
              Director ({PROVIDER_LABELS[roster.roster.director.provider]}) is planning, then Vision ({PROVIDER_LABELS[roster.roster.vision.provider]}) reads and Translator ({PROVIDER_LABELS[roster.roster.translator.provider]}) translates. Large archives take a moment.
            </p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6">
          {result.strategy && (
            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-violet-500/60">
              <p className="text-violet-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4" /> Director strategy
              </p>
              <p className="text-slate-200 text-sm">{result.strategy}</p>
              <p className="text-slate-500 text-xs mt-2">Considered {result.candidatesConsidered} candidates · {result.findings.length} findings returned.</p>
            </div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div className="glass-card p-4 rounded-2xl border border-amber-500/20">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-amber-300/90 text-xs flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {w}</p>
              ))}
            </div>
          )}

          {result.findings.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-bee-amber" /> Findings ({result.findings.length})
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-slate-400 flex items-center gap-1.5">
                    Visibility
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as 'private' | 'unlisted' | 'public')}
                      className="bg-[#0f1115] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                    >
                      <option value="private">Private</option>
                      <option value="unlisted">Share link</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <button
                    onClick={publish}
                    disabled={publishState.busy}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-extrabold hover:bg-violet-500 disabled:opacity-40 flex items-center gap-2"
                  >
                    {publishState.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Publish to communal library
                  </button>
                </div>
              </div>
              {publishState.msg && <p className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {publishState.msg}</p>}
              {publishState.err && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {publishState.err}</p>}

              <div className="space-y-4">
                {result.findings.map((f, i) => (
                  <FindingCard key={f.url + i} finding={f} routeMode={routing.routeMode} routing={routing.routing} sourceCookies={undefined} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FindingCard({
  finding,
  routeMode,
  routing,
  index,
}: {
  finding: Finding;
  routeMode: string;
  routing: { mode: string; proxyUrl?: string };
  sourceCookies?: string;
  index: number;
}) {
  const [broken, setBroken] = useState(false);
  const [dl, setDl] = useState('');
  const api = useFableApi();

  const download = async () => {
    setDl('…');
    try {
      if (routeMode === 'browser') {
        const blob = await clientFetchBlob(finding.url);
        saveBytes(blob, blob.type || 'application/octet-stream', finding.filename);
      } else {
        const data = await fablePost(api, '/download', {
          url: finding.url,
          referer: finding.sourceUrl,
          routing,
        });
        saveBytes(base64ToBytes(data.base64), data.mimeType, data.filename || finding.filename);
      }
      setDl('');
    } catch {
      setDl(routeMode === 'browser' ? 'CORS-blocked — switch routing' : 'failed');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
      <div>
        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0f1115] aspect-square">
          {broken ? (
            <span className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <ImageIcon className="w-8 h-8 opacity-40" />
            </span>
          ) : (
            <img src={finding.url} alt={finding.alt || finding.filename} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" onError={() => setBroken(true)} />
          )}
        </div>
        <p className="text-[11px] text-slate-400 truncate mt-1" title={finding.filename}>{finding.filename}</p>
        <button onClick={download} className="mt-1 text-[11px] font-bold text-bee-amber inline-flex items-center gap-1 hover:underline">
          <Download className="w-3 h-3" /> {dl || 'Download'}
        </button>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300">Finding {index + 1}</span>
          {typeof finding.confidence === 'number' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">confidence {(finding.confidence * 100).toFixed(0)}%</span>
          )}
          <a href={finding.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-sky-400 inline-flex items-center gap-1 hover:underline ml-auto">source <ExternalLink className="w-3 h-3" /></a>
        </div>
        {finding.reason && <p className="text-slate-400 text-xs italic mb-2">“{finding.reason}”</p>}
        {finding.error ? (
          <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {finding.error}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Transcription (OCR)</p>
              <div className="bg-[#0f1115]/60 border border-white/10 rounded-lg p-3 max-h-56 overflow-y-auto text-xs text-slate-300 whitespace-pre-wrap font-mono">
                {finding.ocrText || <span className="text-slate-600">—</span>}
              </div>
            </div>
            {finding.translation && (
              <div>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Translation → {finding.targetLang}</p>
                <div className="bg-[#0f1115]/60 border border-white/10 rounded-lg p-3 max-h-56 overflow-y-auto text-xs text-slate-200 whitespace-pre-wrap">
                  {finding.translation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ MANUAL SCRAPE ============================ */

function ScrapeTab({
  url,
  setUrl,
  requireUrl,
  engine,
  setEngine,
  routing,
}: {
  url: string;
  setUrl: (v: string) => void;
  requireUrl: () => string;
  engine: Engine;
  setEngine: (e: Engine) => void;
  routing: ReturnType<typeof useRouting>;
}) {
  const [runMode, setRunMode] = useState<'single' | 'crawl'>('single');
  const [include, setInclude] = useState({ images: true, pdfs: true, docs: true, videos: false });
  const [includeIcons, setIncludeIcons] = useState(false);
  const [maxPages, setMaxPages] = useState(5);
  const [maxDepth, setMaxDepth] = useState(1);
  const [sameHostOnly, setSameHostOnly] = useState(true);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [ocrFormat, setOcrFormat] = useState('Markdown');
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [copied, setCopied] = useState(false);
  const [estimateMsg, setEstimateMsg] = useState('');
  const api = useFableApi();
  const bridge = useFableWorkflowBridge();

  const allSelected = !!result?.images.length && selectedImages.size === result.images.length;

  useEffect(() => {
    if (!bridge?.authHeaders) {
      setEstimateMsg('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const headers = {
          ...(await bridge.authHeaders()),
          'Content-Type': 'application/json',
        };
        const res = await fetch('/api/research-lab/estimate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            op: runMode === 'crawl' ? 'crawl' : 'scan',
            params: {
              pages: maxPages,
              routing: routing.routing,
              mode: routing.routing.mode,
            },
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setEstimateMsg(data.message || `About $${Number(data.estimatedCredits || 0).toFixed(2)} Hive credits`);
        }
      } catch {
        if (!cancelled) setEstimateMsg('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bridge, runMode, maxPages, routing.routing]);

  const scan = async () => {
    let target = '';
    try {
      target = requireUrl();
    } catch (err) {
      return setError(err instanceof Error ? err.message : 'Enter a valid URL.');
    }
    if (!routing.routingReady) return setError(routing.notReadyMessage);
    setError('');
    setResult(null);
    setOcrText('');
    setOcrError('');
    setSelectedImages(new Set());
    setBroken(new Set());
    setScanning(true);
    try {
      const endpoint = runMode === 'crawl' ? '/crawl' : '/scan';
      const body = runMode === 'crawl'
        ? { url: target, engine, include, includeIcons, routing: routing.routing, maxPages, maxDepth, sameHostOnly }
        : { url: target, engine, include, includeIcons, routing: routing.routing };
      const data = await fablePost(api, endpoint, body);
      setResult(data as ScanResult);
      setSelectedImages(new Set((data.images as Asset[]).map((i) => i.url)));
      if (bridge) {
        if (data.text) bridge.setScrapeText(String(data.text));
        const urls = (data.images as Asset[] | undefined)?.map((i) => i.url) || [];
        if (urls.length) bridge.setImageUrls(urls);
        bridge.appendOutput({
          step: 'scrape',
          title: `${runMode === 'crawl' ? 'Crawl' : 'Scan'} — ${data.title || target}`,
          text: String(data.text || '').slice(0, 12000) || `Found ${(data.images || []).length} images`,
          sourceUrl: data.finalUrl || target,
        });
        if (typeof data.chargedUsd === 'number') {
          bridge.addReceipt({
            feature: 'research_lab_scrape',
            summary: `${runMode} via ${data.engine || engine}`,
            rawCostUsd: 0,
            chargedUsd: data.chargedUsd,
          });
        }
        bridge.addReliability({
          op: runMode,
          ok: !data.blocked,
          engine: data.engine || engine,
          routingMode: data.routingMode || routing.routing.mode,
          retries: data.truncated ? 1 : 0,
          reason: data.blocked
            ? 'Archive blocked — try Max stealth or residential routing'
            : data.stoppedReason || undefined,
          pagesVisited: data.pagesVisited,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan failed.';
      setError(msg);
      bridge?.addReliability({
        op: runMode,
        ok: false,
        engine,
        routingMode: routing.routing.mode,
        reason: msg,
      });
    } finally {
      setScanning(false);
    }
  };

  const toggleImage = (u: string) => setSelectedImages((prev) => { const n = new Set(prev); n.has(u) ? n.delete(u) : n.add(u); return n; });
  const toggleAll = () => { if (!result) return; setSelectedImages(allSelected ? new Set() : new Set(result.images.map((i) => i.url))); };

  const downloadList = useCallback(async (targets: Asset[]) => {
    if (!targets.length || !result) return;
    setDownloadingAll(true);
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      setDownloadStatus(`Downloading ${i + 1}/${targets.length}: ${targets[i].filename}`);
      try {
        if (routing.routeMode === 'browser') {
          const blob = await clientFetchBlob(targets[i].url);
          saveBytes(blob, blob.type || 'application/octet-stream', targets[i].filename);
          ok++;
        } else {
          const data = await fablePost(api, '/download', {
            url: targets[i].url,
            referer: result.finalUrl,
            cookies: result.cookies,
            routing: routing.routing,
          });
          saveBytes(base64ToBytes(data.base64), data.mimeType, data.filename || targets[i].filename);
          ok++;
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch { /* continue */ }
    }
    setDownloadStatus(`Downloaded ${ok}/${targets.length}.${ok < targets.length && routing.routeMode === 'browser' ? ' Some blocked by CORS — try residential/custom routing.' : ''}`);
    setDownloadingAll(false);
  }, [result, routing]);

  const downloadOne = async (u: string, filename: string) => { await downloadList([{ url: u, filename }]); };

  const runOcr = async () => {
    if (!result) return;
    const targets = result.images.filter((i) => selectedImages.has(i.url));
    if (!targets.length) return setOcrError('Select at least one image.');
    setOcrError(''); setOcrText(''); setOcrRunning(true);
    try {
      let text = '';
      let chargedUsd: number | undefined;
      if (routing.routeMode === 'browser') {
        const imgs: string[] = [];
        for (const t of targets.slice(0, 50)) {
          try { const blob = await clientFetchBlob(t.url); if (blob.type.startsWith('image/')) imgs.push(await blobToBase64(blob)); } catch { /* skip */ }
        }
        if (!imgs.length) throw new Error('Could not fetch images in browser mode (CORS). Switch routing.');
        const data = await fableOcrPost(api, { images: imgs, format: ocrFormat });
        text = data.text || '';
        chargedUsd = data.chargedUsd;
      } else {
        const data = await fablePost(api, '/ocr', {
          urls: targets.map((t) => t.url).slice(0, 50),
          referer: result.finalUrl,
          cookies: result.cookies,
          routing: routing.routing,
          format: ocrFormat,
        });
        text = data.text || '';
        chargedUsd = data.chargedUsd;
      }
      setOcrText(text);
      if (bridge && text) {
        bridge.setOcrText(text);
        bridge.appendOutput({
          step: 'ocr',
          title: `Fable OCR — ${targets.length} image(s)`,
          text,
          sourceUrl: result.finalUrl,
        });
        if (typeof chargedUsd === 'number') {
          bridge.addReceipt({
            feature: 'research_lab_ocr',
            summary: `OCR ${targets.length} image(s)`,
            rawCostUsd: 0,
            chargedUsd,
          });
        }
        bridge.addReliability({
          op: 'ocr',
          ok: true,
          engine: result.engine,
          routingMode: routing.routing.mode,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR failed.';
      setOcrError(msg);
      bridge?.addReliability({
        op: 'ocr',
        ok: false,
        routingMode: routing.routing.mode,
        reason: msg,
      });
    } finally {
      setOcrRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex gap-2">
          {(['single', 'crawl'] as const).map((m) => (
            <button key={m} onClick={() => setRunMode(m)} className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2 ${runMode === m ? 'border-bee-amber bg-bee-amber/10 text-bee-amber' : 'border-white/10 bg-white/5 text-slate-400'}`}>
              {m === 'single' ? <Globe className="w-4 h-4" /> : <Layers className="w-4 h-4" />} {m === 'single' ? 'Single page' : 'Crawl site'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Globe className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && scan()} placeholder="https://digitalarchive.example.org/collection/manuscript-42" className="w-full bg-[#0f1115]/70 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:border-bee-amber/50 focus:outline-none" />
        </div>
        {runMode === 'crawl' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div><label className="block text-slate-400 text-xs font-bold mb-1">Max pages (≤20)</label><input type="number" min={1} max={20} value={maxPages} onChange={(e) => setMaxPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none" /></div>
            <div><label className="block text-slate-400 text-xs font-bold mb-1">Link depth (≤4)</label><input type="number" min={0} max={4} value={maxDepth} onChange={(e) => setMaxDepth(Math.max(0, Math.min(4, Number(e.target.value) || 0)))} className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none" /></div>
            <label className="flex items-center gap-2 self-end pb-2 cursor-pointer"><input type="checkbox" checked={sameHostOnly} onChange={(e) => setSameHostOnly(e.target.checked)} className="accent-bee-amber w-4 h-4" /><span className="text-slate-300 text-sm">Same domain only</span></label>
          </div>
        )}
        <div>
          <p className="text-slate-300 text-sm font-bold mb-2">Content to harvest</p>
          <div className="flex flex-wrap gap-2">
            {([['images', 'Images', ImageIcon], ['pdfs', 'PDFs', FileType2], ['docs', 'Text & docs', FileText], ['videos', 'Videos', Video]] as [keyof typeof include, string, typeof ImageIcon][]).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setInclude((p) => ({ ...p, [key]: !p[key] }))} className={`px-4 py-2.5 rounded-xl text-sm font-bold border flex items-center gap-2 ${include[key] ? 'border-bee-amber bg-bee-amber/10 text-bee-amber' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                {include[key] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}<Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
          {include.images && <label className="flex items-center gap-2 mt-3 cursor-pointer"><input type="checkbox" checked={includeIcons} onChange={(e) => setIncludeIcons(e.target.checked)} className="accent-bee-amber w-4 h-4" /><span className="text-slate-400 text-sm">Include icons & UI sprites</span></label>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-xs">Engine</span>
          {ENGINES.map((e) => <button key={e.id} onClick={() => setEngine(e.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${engine === e.id ? 'border-bee-amber bg-bee-amber/10 text-bee-amber' : 'border-white/10 bg-white/5 text-slate-400'}`}>{e.label}</button>)}
        </div>
        {routing.ui}
        {estimateMsg && (
          <p className="text-xs text-cyan-300/90 text-center font-medium">{estimateMsg}</p>
        )}
        <button onClick={scan} disabled={scanning} className="w-full py-4 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow text-lg disabled:opacity-50 flex items-center justify-center">
          {scanning ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> {runMode === 'crawl' ? 'Crawling…' : 'Scanning…'}</> : <><Search className="w-5 h-5 mr-3" /> {runMode === 'crawl' ? 'Crawl & Harvest' : 'Scan & Harvest'}</>}
        </button>
        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400"><AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" /><p className="text-sm">{error}</p></div>}
      </div>

      {result && (
        <div className="space-y-8">
          <div className="glass-card p-5 rounded-2xl flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="font-bold text-white truncate max-w-sm">{result.title || result.startUrl || result.finalUrl}</span></span>
            <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-400">{result.engine} · {result.routingMode}</span>
            {typeof result.pagesVisited === 'number' && <span className="text-xs text-slate-400 inline-flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-bee-amber" /> {result.pagesVisited} pages</span>}
            <span className="text-xs text-slate-400 inline-flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5 text-bee-amber" /> {result.images.length}</span>
            <span className="text-xs text-slate-400 inline-flex items-center gap-1"><FileType2 className="w-3.5 h-3.5 text-bee-amber" /> {result.pdfs.length}</span>
            <span className="text-xs text-slate-400 inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-bee-amber" /> {result.documents.length}</span>
            <span className="text-xs text-slate-400 inline-flex items-center gap-1"><Video className="w-3.5 h-3.5 text-bee-amber" /> {result.videos.length}</span>
            {result.blocked && <span className="text-xs font-bold text-amber-400 inline-flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Try Max stealth</span>}
          </div>

          {result.images.length > 0 && (
            <section className="glass-card p-6 sm:p-8 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-bold text-white flex items-center"><ImageIcon className="w-5 h-5 mr-3 text-bee-amber" /> Images ({selectedImages.size}/{result.images.length})</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={toggleAll} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 flex items-center gap-2">{allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}{allSelected ? 'Deselect all' : 'Select all'}</button>
                  <button onClick={() => downloadList(result.images.filter((i) => selectedImages.has(i.url)))} disabled={downloadingAll || !selectedImages.size} className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold hover:bg-bee-yellow disabled:opacity-40 flex items-center gap-2">{downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download selected</button>
                </div>
              </div>
              {downloadStatus && <p className="text-xs text-slate-400 mb-4">{downloadStatus}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {result.images.map((img) => {
                  const sel = selectedImages.has(img.url);
                  return (
                    <div key={img.url} className={`group relative rounded-xl overflow-hidden border ${sel ? 'border-bee-amber ring-1 ring-bee-amber/40' : 'border-white/10'}`}>
                      <button onClick={() => toggleImage(img.url)} className="block w-full aspect-square bg-[#0f1115]">
                        {broken.has(img.url) ? <span className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 px-2"><ImageIcon className="w-8 h-8 opacity-40" /><span className="text-[10px]">{img.ext ? img.ext.toUpperCase() : 'IMG'}</span></span> : <img src={img.url} alt={img.alt || img.filename} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setBroken((p) => new Set(p).add(img.url))} />}
                      </button>
                      <div className="absolute top-2 left-2"><div className={`w-6 h-6 rounded-md flex items-center justify-center ${sel ? 'bg-bee-amber text-bee-black' : 'bg-black/50 text-white'}`}>{sel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}</div></div>
                      <div className="p-2 bg-black/40"><p className="text-[11px] text-slate-300 truncate" title={img.filename}>{img.filename}</p><button onClick={() => downloadOne(img.url, img.filename)} className="mt-1 text-[11px] font-bold text-bee-amber inline-flex items-center gap-1 hover:underline"><Download className="w-3 h-3" /> Download</button></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {result.images.length > 0 && (
            <section className="glass-card p-6 sm:p-8 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-bold text-white flex items-center"><ScanText className="w-5 h-5 mr-3 text-bee-amber" /> OCR selected images</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 bg-white/5 rounded-xl p-1">{OCR_FORMATS.map((f) => <button key={f} onClick={() => setOcrFormat(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${ocrFormat === f ? 'bg-bee-amber text-bee-black' : 'text-slate-400'}`}>{f}</button>)}</div>
                  <button onClick={runOcr} disabled={ocrRunning || !selectedImages.size} className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold hover:bg-bee-yellow disabled:opacity-40 flex items-center gap-2">{ocrRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />} Extract text ({selectedImages.size})</button>
                </div>
              </div>
              {ocrError && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400"><AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" /><p className="text-sm">{ocrError}</p></div>}
              <div className="bg-[#0f1115]/50 border border-white/10 rounded-xl p-4 min-h-[180px] max-h-[420px] overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap">{ocrText || <span className="text-slate-600">{ocrRunning ? 'Fetching images and running OCR…' : 'Extracted text will appear here.'}</span>}</div>
              {ocrText && <div className="mt-4 flex gap-3"><button onClick={() => { navigator.clipboard.writeText(ocrText); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="py-2.5 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm">{copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy text'}</button><button onClick={() => saveText(ocrText, 'fable-scrape-ocr.txt')} className="py-2.5 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm"><Download className="w-4 h-4" /> Download .txt</button></div>}
            </section>
          )}

          <FileSection title="PDFs" icon={FileType2} items={result.pdfs} onDownload={downloadOne} onDownloadAll={() => downloadList(result.pdfs)} downloadingAll={downloadingAll} />
          <FileSection title="Documents" icon={FileText} items={result.documents} onDownload={downloadOne} onDownloadAll={() => downloadList(result.documents)} downloadingAll={downloadingAll} />
          <FileSection title="Videos" icon={Video} items={result.videos} onDownload={downloadOne} onDownloadAll={() => downloadList(result.videos)} downloadingAll={downloadingAll} note="Videos can be large. My-IP (browser) mode streams straight to your machine." />

          {result.pages && result.pages.length > 0 && (
            <section className="glass-card p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-white flex items-center mb-4"><Layers className="w-5 h-5 mr-3 text-bee-amber" /> Pages crawled ({result.pages.length})</h2>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto">{result.pages.map((p) => <div key={p.url} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"><div className="min-w-0"><p className="text-white text-sm truncate" title={p.title}>{p.title}</p><p className="text-slate-500 text-xs truncate">{p.url}</p></div><span className="text-[11px] text-slate-400 shrink-0">{p.images}i · {p.pdfs}p · {p.documents}d · {p.videos}v</span></div>)}</div>
            </section>
          )}

          {result.text && (
            <section className="glass-card p-6 sm:p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white flex items-center"><FileText className="w-5 h-5 mr-3 text-bee-amber" /> Page text ({(result.textChars || 0).toLocaleString()} chars)</h2><button onClick={() => saveText(result.text || '', 'fable-scrape-page.txt')} className="py-2 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm"><Download className="w-4 h-4" /> Download .txt</button></div>
              <div className="bg-[#0f1115]/50 border border-white/10 rounded-xl p-4 max-h-[360px] overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap">{result.text}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function FileSection({ title, icon: Icon, items, onDownload, onDownloadAll, downloadingAll, note }: { title: string; icon: typeof FileText; items: Asset[]; onDownload: (url: string, filename: string) => void; onDownloadAll: () => void; downloadingAll: boolean; note?: string }) {
  if (!items.length) return null;
  return (
    <section className="glass-card p-6 sm:p-8 rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-white flex items-center"><Icon className="w-5 h-5 mr-3 text-bee-amber" /> {title} ({items.length})</h2>
        <button onClick={onDownloadAll} disabled={downloadingAll} className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold hover:bg-bee-yellow disabled:opacity-40 flex items-center gap-2">{downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download all</button>
      </div>
      {note && <p className="text-xs text-slate-500 mb-3">{note}</p>}
      <div className="space-y-2">{items.map((it) => <div key={it.url} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10"><div className="min-w-0"><p className="text-white text-sm font-medium truncate" title={it.filename}>{it.filename}</p><p className="text-slate-500 text-xs truncate">{it.label || it.url}</p></div><div className="flex items-center gap-2 shrink-0"><span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400">{it.ext || 'file'}</span><button onClick={() => onDownload(it.url, it.filename)} className="px-3 py-1.5 rounded-lg bg-bee-amber text-bee-black text-xs font-extrabold hover:bg-bee-yellow flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Download</button></div></div>)}</div>
    </section>
  );
}

/* ============================ TRANSLATION LAB ============================ */

function TranslateTab({ roster }: { roster: ReturnType<typeof useRoster> }) {
  const api = useFableApi();
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [provider, setProvider] = useState<ProviderId>('gemini');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const translate = async () => {
    if (!text.trim()) return setError('Paste text to translate.');
    setError(''); setOut(''); setBusy(true);
    try {
      const data = await fablePost(api, '/translate', { text, targetLang, provider, keys: roster.keys });
      setOut(data.translation || '');
    } catch (err) { setError(err instanceof Error ? err.message : 'Translation failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Languages className="w-6 h-6 text-bee-amber" /> Translation Lab</h2>
        <p className="text-slate-400 text-sm mt-1">The same archival translation used across AiBhive — now with your choice of AI agent. Paste OCR output or any archival text.</p>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Paste document text (from a scrape, OCR batch, or anywhere)…" className="w-full bg-[#0f1115]/70 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-bee-amber/50 focus:outline-none resize-y" />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2"><span className="text-slate-400 text-sm">Into</span><input value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-44 bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-bee-amber/50 focus:outline-none" /></label>
        <label className="flex items-center gap-2"><span className="text-slate-400 text-sm">Agent</span>
          <select value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)} className="bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => <option key={id} value={id}>{PROVIDER_LABELS[id]}</option>)}
          </select>
        </label>
        <button onClick={translate} disabled={busy} className="ml-auto px-6 py-2.5 rounded-xl bg-bee-amber text-bee-black font-extrabold hover:bg-bee-yellow disabled:opacity-40 flex items-center gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />} Translate</button>
      </div>
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400"><AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" /><p className="text-sm">{error}</p></div>}
      {out && (
        <div>
          <div className="flex items-center justify-between mb-2"><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Translation → {targetLang}</p><button onClick={() => { navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs text-bee-amber font-bold inline-flex items-center gap-1">{copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy'}</button></div>
          <div className="bg-[#0f1115]/60 border border-white/10 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-wrap max-h-[420px] overflow-y-auto">{out}</div>
        </div>
      )}
    </div>
  );
}

/* ============================ COMMUNAL LIBRARY ============================ */

function LibraryTab() {
  const api = useFableApi();
  const bridge = useFableWorkflowBridge();
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    const qs = new URLSearchParams({ limit: '50' });
    if (q.trim()) qs.set('q', q.trim());
    fableGet(api, `/library?${qs}`)
      .then((d) => { if (d.error) throw new Error(d.error); setEntries(d.entries || []); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load library.'))
      .finally(() => setLoading(false));
  }, [api, q]);
  useEffect(load, [load]);

  const fork = async (entry: LibraryEntry) => {
    if (!bridge?.authHeaders) {
      setMsg('Open Research Lab workspace to fork into a project.');
      return;
    }
    try {
      const headers = { ...(await bridge.authHeaders()), 'Content-Type': 'application/json' };
      const res = await fetch(`/api/research-lab/library/${encodeURIComponent(entry.id)}/fork`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: `Fork · ${entry.title}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fork failed');
      setMsg('Forked into your Research Project.');
      bridge.appendOutput({
        step: 'library',
        title: `Forked · ${entry.title}`,
        text: entry.translation || entry.ocrText || entry.reason || '',
        sourceUrl: entry.sourceUrl,
      });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Fork failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass-card p-6 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Library className="w-6 h-6 text-bee-amber" /> Communal Library</h2>
          <p className="text-slate-400 text-sm mt-1">Live findings with topic tags, provenance, and fork-into-project.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search library…"
            className="bg-[#0f1115]/70 border border-white/10 rounded-xl px-3 py-2 text-white text-sm w-44"
          />
          <button onClick={load} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10">Refresh</button>
          <Link to="/research-lab/communal-library" className="px-4 py-2 rounded-xl bg-bee-amber/15 border border-bee-amber/40 text-bee-amber text-sm font-bold">Open map</Link>
        </div>
      </div>
      {msg && <p className="text-cyan-300 text-sm">{msg}</p>}

      {loading ? (
        <div className="text-center text-slate-400 py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-bee-amber/60" /> Loading library…</div>
      ) : error ? (
        <div className="glass-card p-8 rounded-2xl text-center"><AlertCircle className="w-8 h-8 mx-auto mb-3 text-amber-400" /><p className="text-slate-300 text-sm">{error}</p><p className="text-slate-500 text-xs mt-2">The library needs the server's Firestore credentials — it will populate in production once findings are published.</p></div>
      ) : entries.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center text-slate-400"><Library className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-bold text-white">The library is empty</p><p className="text-sm mt-1">Run an AI Harvest and publish your findings to be the first.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((e) => (
            <div key={e.id} className="glass-card rounded-2xl p-4 grid grid-cols-[88px_1fr] gap-3">
              <div className="rounded-lg overflow-hidden border border-white/10 bg-[#0f1115] w-[88px] h-[88px]">
                {e.imageUrl ? <img src={e.imageUrl} alt={e.title} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" onError={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')} /> : null}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate" title={e.title}>{e.title}</p>
                {e.reason && <p className="text-slate-500 text-xs italic truncate">“{e.reason}”</p>}
                <p className="text-slate-300 text-xs mt-1 line-clamp-3 whitespace-pre-wrap">{e.translation || e.ocrText}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-slate-500">
                  {e.topicId && <span className="px-1.5 py-0.5 rounded bg-bee-amber/10 text-bee-amber">{e.topicId}</span>}
                  {e.visibility && <span className="px-1.5 py-0.5 rounded bg-white/5">{e.visibility}</span>}
                  {e.targetLang && <span className="px-1.5 py-0.5 rounded bg-white/5">→ {e.targetLang}</span>}
                  {e.sourceUrl && <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 inline-flex items-center gap-0.5 hover:underline">source <ExternalLink className="w-2.5 h-2.5" /></a>}
                  <span className="ml-auto">{e.contributor}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void fork(e)}
                  className="mt-2 text-xs font-bold text-violet-300 hover:text-violet-200"
                >
                  Fork into project
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
