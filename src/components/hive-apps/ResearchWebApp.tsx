import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  Radar,
  Send,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import WebPlansStrip from '../app/WebPlansStrip';
import {
  buildDorkUrl,
  CLOUD_TOOLS,
  DEFAULT_INTENT,
  fetchCloudToolsMeta,
  resolveDomain,
  runCloudTool,
  sendIntelChat,
  TARGET_TYPES,
  type ChatTurn,
  type CloudToolId,
  type IntelTargetType,
  type ToolRunResult,
} from '../../lib/intelWebApi';
import {
  createIntelWebCase,
  listIntelWebCases,
  updateIntelWebCase,
  type IntelWebCase,
} from '../../lib/intelWebStorage';

type Props = { expanded?: boolean };

function toolLabel(id: CloudToolId) {
  return CLOUD_TOOLS.find((t) => t.id === id)?.name ?? id;
}

/** Full Intel Agent — mirrors mobile Research / Intel Agent on the web. */
export default function ResearchWebApp({ expanded }: Props) {
  const brand = brandFor('purple');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [targetType, setTargetType] = useState<IntelTargetType>('company');
  const [targetLabel, setTargetLabel] = useState('');
  const [userIntent, setUserIntent] = useState(DEFAULT_INTENT);
  const [restrictRegion, setRestrictRegion] = useState(false);
  const [regionLocation, setRegionLocation] = useState('');
  const [radiusMiles, setRadiusMiles] = useState('50');
  const [enabledTools, setEnabledTools] = useState<CloudToolId[]>(() =>
    CLOUD_TOOLS.filter((t) => t.defaultOn).map((t) => t.id)
  );
  const [toolCosts, setToolCosts] = useState<Record<string, number>>({});
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState('');
  const [activeCase, setActiveCase] = useState<IntelWebCase | null>(null);
  const [recentCases, setRecentCases] = useState<IntelWebCase[]>([]);
  const [error, setError] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([
    {
      role: 'ai',
      content:
        'I\'m your Intel research assistant (Grok when available, otherwise Hive Cloud). Set a target above and tap **Run Intel Agent**, or ask me anything about OSINT, due diligence, or how AiBhive research works.',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatProvider, setChatProvider] = useState<string | null>(null);

  const activeTarget = TARGET_TYPES.find((t) => t.id === targetType)!;
  const domain = resolveDomain(targetLabel, targetType);

  const refreshCases = useCallback(() => {
    setRecentCases(listIntelWebCases().slice(0, 5));
  }, []);

  useEffect(() => {
    refreshCases();
    void fetchCloudToolsMeta().then((m) => {
      if (m?.costsUsd) setToolCosts(m.costsUsd);
    });
  }, [refreshCases]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const toggleTool = (id: CloudToolId) => {
    setEnabledTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const buildTargetContext = (c?: IntelWebCase | null) => {
    const t = c?.target ?? {
      type: targetType,
      label: targetLabel,
      domain,
      userIntent,
      region:
        restrictRegion && regionLocation.trim()
          ? { location: regionLocation.trim(), radiusMiles: parseInt(radiusMiles, 10) || 50 }
          : undefined,
    };
    const results = c?.toolResults ?? activeCase?.toolResults ?? [];
    const dump = results
      .filter((r) => r.status === 'done' && r.data)
      .map((r) => `### ${toolLabel(r.toolId)}\n${r.summary}\n${r.data?.slice(0, 6000)}`)
      .join('\n\n');
    return `Target type: ${t.type}\nLabel: ${t.label}\nDomain: ${t.domain || domain || 'n/a'}\nIntent: ${t.userIntent || userIntent}\n${
      t.region ? `Region: ${t.region.location} (${t.region.radiusMiles} mi)` : ''
    }\n\nTOOL RESULTS:\n${dump || '(none yet)'}`;
  };

  const runAgent = async () => {
    if (!targetLabel.trim()) {
      setError('Enter a company, website, or person to research.');
      return;
    }
    if (!enabledTools.length) {
      setError('Enable at least one cloud research module.');
      return;
    }

    setError('');
    setRunning(true);
    setRunStatus('Creating case…');

    const region =
      restrictRegion && regionLocation.trim()
        ? { location: regionLocation.trim(), radiusMiles: Math.min(100, Math.max(30, parseInt(radiusMiles, 10) || 50)) }
        : undefined;

    let intelCase = createIntelWebCase({
      target: {
        type: targetType,
        label: targetLabel.trim(),
        domain: domain || undefined,
        userIntent: userIntent.trim(),
        region,
      },
      enabledTools,
    });
    intelCase = updateIntelWebCase(intelCase.id, { status: 'running', toolResults: [] })!;
    setActiveCase(intelCase);

    const params = {
      company: targetLabel.trim(),
      domain: domain || '',
      userIntent: userIntent.trim(),
      targetType,
      url: domain ? `https://${domain}` : '',
      restrictToRegion: !!region,
      location: region?.location ?? '',
      radiusMiles: region?.radiusMiles ?? 50,
    };

    const results: ToolRunResult[] = [];

    try {
      for (const toolId of enabledTools) {
        setRunStatus(`Running ${toolLabel(toolId)}…`);
        if (toolId === 'firecrawl_scrape' && !domain) {
          results.push({ toolId, status: 'skipped', error: 'No domain for scrape' });
          continue;
        }
        const result = await runCloudTool(toolId, params);
        results.push(result);
        intelCase = updateIntelWebCase(intelCase.id, { toolResults: [...results] })!;
        setActiveCase({ ...intelCase });
      }

      setRunStatus('Synthesizing intelligence brief…');
      const synthPrompt = `Synthesize an intelligence brief from the tool results for target "${targetLabel.trim()}". Include executive summary, key findings (bullets), data gaps, and recommended next steps.`;

      const synth = await sendIntelChat({
        message: synthPrompt,
        history: [],
        targetContext: buildTargetContext({ ...intelCase, toolResults: results }),
      });

      setChatProvider(synth.provider);
      intelCase = updateIntelWebCase(intelCase.id, {
        status: 'complete',
        toolResults: results,
        brief: synth.text,
      })!;
      setActiveCase(intelCase);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `**Intelligence brief — ${targetLabel.trim()}**\n\n${synth.text}`,
        },
      ]);
      refreshCases();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Research run failed';
      setError(msg);
      updateIntelWebCase(intelCase.id, { status: 'error', error: msg, toolResults: results });
    } finally {
      setRunning(false);
      setRunStatus('');
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatLoading(true);
    setError('');
    const userTurn: ChatTurn = { role: 'user', content: text };
    setChatHistory((prev) => [...prev, userTurn]);

    try {
      const reply = await sendIntelChat({
        message: text,
        history: chatHistory.filter((m) => m.role === 'user' || m.role === 'ai').slice(-10),
        targetContext: buildTargetContext(activeCase),
      });
      setChatProvider(reply.provider);
      setChatHistory((prev) => [...prev, { role: 'ai', content: reply.text }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed';
      setError(msg);
      setChatHistory((prev) => [...prev, { role: 'ai', content: `⚠️ ${msg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const loadCase = (c: IntelWebCase) => {
    setActiveCase(c);
    setTargetType(c.target.type);
    setTargetLabel(c.target.label);
    setUserIntent(c.target.userIntent || DEFAULT_INTENT);
    if (c.target.region) {
      setRestrictRegion(true);
      setRegionLocation(c.target.region.location);
      setRadiusMiles(String(c.target.radiusMiles));
    }
    setEnabledTools(c.enabledTools);
    if (c.brief) {
      setChatHistory([
        {
          role: 'ai',
          content: `Loaded case **${c.target.label}**.\n\n${c.brief}`,
        },
      ]);
    }
  };

  const dorkQuery =
    targetType === 'person'
      ? `"${targetLabel}" site:linkedin.com OR site:twitter.com`
      : targetType === 'domain'
        ? `site:${domain || targetLabel} about contact`
        : `"${targetLabel}" leadership news contact`;

  return (
    <div className={`space-y-6 ${expanded ? '' : 'max-w-6xl mx-auto'}`}>
      <WebPlansStrip />

      <div
        className="rounded-2xl border p-5 md:p-6"
        style={{ borderColor: `${brand.primary}44`, backgroundColor: `${brand.primary}08` }}
      >
        <div className="flex gap-4 items-start">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: brand.primarySoft }}
          >
            <Radar className="w-6 h-6" style={{ color: brand.primary }} />
          </div>
          <div>
            <h2 className="text-xl font-black" style={{ color: brand.accentText }}>
              AI-directed OSINT
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: `${brand.accentText}aa` }}>
              Same Intel Agent as the AiBhive app — plan the search, run Hive Cloud tools, get an
              exportable brief. Google dorks open in your browser (we never scrape Google directly).
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400">
          <Shield className="w-4 h-4 shrink-0 text-bee-amber mt-0.5" />
          Authorized research only — public data for legitimate business, security, and journalistic use.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Intel agent controls */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Target</p>
            <div className="flex flex-wrap gap-2">
              {TARGET_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTargetType(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    targetType === t.id
                      ? 'text-bee-black'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                  style={targetType === t.id ? { backgroundColor: brand.primary } : undefined}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{activeTarget.hint}</p>
            <input
              value={targetLabel}
              onChange={(e) => setTargetLabel(e.target.value)}
              placeholder={activeTarget.placeholder}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-bee-amber/40"
            />
            <textarea
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-bee-amber/40 resize-none"
              placeholder="What do you want to learn?"
            />

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={restrictRegion}
                onChange={(e) => setRestrictRegion(e.target.checked)}
                className="rounded border-white/20"
              />
              Regional filter (city + radius)
            </label>
            {restrictRegion ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={regionLocation}
                  onChange={(e) => setRegionLocation(e.target.value)}
                  placeholder="Miami, FL"
                  className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm"
                />
                <select
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(e.target.value)}
                  className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm"
                >
                  {['30', '50', '75', '100'].map((m) => (
                    <option key={m} value={m}>
                      {m} mi
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 pt-2">
              Hive Cloud modules
            </p>
            {CLOUD_TOOLS.map((tool) => (
              <label
                key={tool.id}
                className="flex items-start gap-3 rounded-xl border border-white/10 p-3 cursor-pointer hover:border-white/20"
              >
                <input
                  type="checkbox"
                  checked={enabledTools.includes(tool.id)}
                  onChange={() => toggleTool(tool.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-white text-sm font-bold">{tool.name}</p>
                  <p className="text-slate-500 text-xs">{tool.description}</p>
                  {toolCosts[tool.id] != null ? (
                    <p className="text-bee-amber text-xs mt-0.5">~${toolCosts[tool.id].toFixed(3)} / run</p>
                  ) : null}
                </div>
              </label>
            ))}

            <a
              href={buildDorkUrl(dorkQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-bee-amber hover:underline"
            >
              Open Google dork in browser
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              disabled={running}
              onClick={() => void runAgent()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-bee-black disabled:opacity-50"
              style={{ backgroundColor: brand.primary }}
            >
              {running ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {runStatus || 'Running…'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Run Intel Agent
                </>
              )}
            </button>

            {error ? (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3">
                {error}
              </p>
            ) : null}
          </div>

          {activeCase?.toolResults?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <p className="text-white font-bold text-sm">Tool results</p>
              {activeCase.toolResults.map((r) => (
                <div key={r.toolId} className="flex items-start gap-2 text-sm">
                  {r.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  ) : r.status === 'skipped' ? (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold">{toolLabel(r.toolId)}</p>
                    <p className="text-slate-500 text-xs">{r.summary || r.error || r.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {recentCases.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-white font-bold text-sm mb-3">Recent cases</p>
              <div className="space-y-2">
                {recentCases.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => loadCase(c)}
                    className="w-full text-left rounded-xl border border-white/5 bg-black/20 px-4 py-3 hover:border-bee-amber/30 transition-colors"
                  >
                    <p className="text-white text-sm font-bold truncate">{c.target.label}</p>
                    <p className="text-slate-500 text-xs capitalize">{c.status} · {c.target.type}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Large Grok chat */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#070a0f] overflow-hidden min-h-[520px] lg:min-h-[640px]">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-white font-black">Research chat</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {chatProvider === 'grok' ? 'Powered by Grok (Hive Cloud)' : 'Powered by Hive Cloud AI'}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-bee-amber" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[360px] max-h-[480px] lg:max-h-[520px]">
            {chatHistory.map((m, i) => (
              <div
                key={i}
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'ml-8 bg-bee-amber/15 border border-bee-amber/25 text-white'
                    : 'mr-4 bg-white/[0.04] border border-white/10 text-slate-200'
                }`}
              >
                {m.content.split('**').map((chunk, j) =>
                  j % 2 === 1 ? (
                    <strong key={j} className="text-white font-bold">
                      {chunk}
                    </strong>
                  ) : (
                    chunk
                  )
                )}
              </div>
            ))}
            {chatLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-bee-amber" />
                Thinking…
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 bg-black/30">
            <div className="flex flex-col gap-3">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendChat();
                  }
                }}
                rows={4}
                placeholder="Ask Grok anything about your target, OSINT strategy, or next research steps…"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-bee-amber/40 resize-none min-h-[100px]"
              />
              <button
                type="button"
                disabled={chatLoading || !chatInput.trim()}
                onClick={() => void sendChat()}
                className="self-end inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bee-amber text-bee-black font-extrabold disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
