import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Play,
  Radar,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import WebPlansStrip from '../app/WebPlansStrip';
import { brandFor } from '../../lib/hiveAppBranding';
import {
  DEFAULT_INTENT,
  WEB_OSINT_TOOLS,
  buildTargetContext,
  buildDocumentContext,
  defaultToolsForTargetType,
  formatFallbackBrief,
  fetchFailureToolOffer,
  inferIntelTargetType,
  isCloudTool,
  isDiscoveryQuery,
  parseResearchDocument,
  resolveDomain,
  runCloudTool,
  runFreeToolsBatch,
  sendIntelChat,
  type FailureToolOffer,
  type FreeToolId,
  type IntelChatMessage,
  type IntelTargetType,
  type IntelWebCase,
  type ToolRunResult,
  type UploadedResearchDoc,
} from '../../lib/intelWebApi';
import { getOrCreateWebHiveUserId } from '../../lib/hiveWebUser';
import { installToolkitApp } from '../../lib/hiveStoreApi';
import {
  createIntelWebCase,
  deleteIntelWebCase,
  listIntelWebCases,
  updateIntelWebCase,
} from '../../lib/intelWebStorage';

const TARGET_TYPES: { id: IntelTargetType; label: string; placeholder: string; hint: string }[] = [
  {
    id: 'company',
    label: 'Company',
    placeholder: 'Acme Corporation',
    hint: 'Business name — we find their site & leadership',
  },
  {
    id: 'domain',
    label: 'Website',
    placeholder: 'example.com',
    hint: 'Domain or URL — DNS, tech stack, site content',
  },
  {
    id: 'person',
    label: 'Person',
    placeholder: 'Jane Smith',
    hint: 'Full name — social dorks, username probe',
  },
  {
    id: 'discovery',
    label: 'Discovery',
    placeholder: 'Find companies closed for 2+ years in Florida',
    hint: 'List/search queries — uses web search + dorks (best for defunct businesses, market scans)',
  },
];

type Props = {
  expanded?: boolean;
};

type ChatLine = { id: string; role: 'user' | 'ai'; content: string };

function toolLabel(toolId: string): string {
  return WEB_OSINT_TOOLS.find((t) => t.id === toolId)?.name ?? toolId.replace(/_/g, ' ');
}

function statusIcon(status: ToolRunResult['status']) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === 'error') return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  return <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />;
}

/** Web Intel Agent — free server OSINT + optional cloud tools + Grok chat (same pricing as mobile). */
export default function ResearchWebApp({ expanded }: Props) {
  const brand = brandFor('cyan');
  const [cases, setCases] = useState<IntelWebCase[]>(() => listIntelWebCases());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(() => listIntelWebCases()[0]?.id ?? null);
  const [targetType, setTargetType] = useState<IntelTargetType>('company');
  const [targetLabel, setTargetLabel] = useState('');
  const [userIntent, setUserIntent] = useState(DEFAULT_INTENT);
  const [enabledTools, setEnabledTools] = useState(() => defaultToolsForTargetType('company'));
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState('');
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedResearchDoc[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [failureOffer, setFailureOffer] = useState<FailureToolOffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeCase = useMemo(
    () => cases.find((c) => c.id === activeCaseId) ?? null,
    [cases, activeCaseId],
  );

  const availableTools = useMemo(
    () => WEB_OSINT_TOOLS.filter((t) => t.targets.includes(targetType)),
    [targetType],
  );

  const resolvedDomain = useMemo(
    () => resolveDomain(targetLabel, targetType),
    [targetLabel, targetType],
  );

  const refreshCases = useCallback(() => {
    setCases(listIntelWebCases());
  }, []);

  useEffect(() => {
    if (activeCase) {
      setTargetType(activeCase.target.type);
      setTargetLabel(activeCase.target.label);
      setUserIntent(activeCase.target.userIntent || DEFAULT_INTENT);
      setEnabledTools(activeCase.enabledTools);
      setUploadedDocs(activeCase.uploadedDocuments ?? []);
      if (activeCase.chatMessages?.length) {
        setChatLines(
          activeCase.chatMessages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
        );
      } else if (activeCase.brief) {
        setChatLines([{ id: 'brief', role: 'ai', content: activeCase.brief }]);
      } else {
        setChatLines([]);
      }
    }
  }, [activeCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!targetLabel.trim() && !userIntent.trim()) return;
    const inferred = inferIntelTargetType(targetLabel, userIntent);
    if (inferred === 'discovery' && targetType !== 'discovery') {
      setTargetType('discovery');
      setEnabledTools(defaultToolsForTargetType('discovery'));
    }
  }, [targetLabel, userIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistChat = useCallback(
    (lines: ChatLine[], docs = uploadedDocs) => {
      if (!activeCaseId) return;
      const chatMessages: IntelChatMessage[] = lines.map((l) => ({
        id: l.id,
        role: l.role,
        content: l.content,
        createdAt: new Date().toISOString(),
      }));
      updateIntelWebCase(activeCaseId, { chatMessages, uploadedDocuments: docs });
      refreshCases();
    },
    [activeCaseId, uploadedDocs, refreshCases],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLines, chatBusy]);

  const onTargetTypeChange = (next: IntelTargetType) => {
    setTargetType(next);
    setEnabledTools(defaultToolsForTargetType(next));
  };

  const toggleTool = (id: (typeof enabledTools)[number]) => {
    setEnabledTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleNewCase = () => {
    setActiveCaseId(null);
    setTargetLabel('');
    setUserIntent(DEFAULT_INTENT);
    setTargetType('company');
    setEnabledTools(defaultToolsForTargetType('company'));
    setChatLines([]);
    setUploadedDocs([]);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || uploadBusy) return;
    setUploadBusy(true);
    try {
      const doc = await parseResearchDocument(file);
      const next = [...uploadedDocs, doc];
      setUploadedDocs(next);
      if (activeCaseId) {
        updateIntelWebCase(activeCaseId, { uploadedDocuments: next });
        refreshCases();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCase = (id: string) => {
    deleteIntelWebCase(id);
    const next = listIntelWebCases();
    setCases(next);
    if (activeCaseId === id) {
      setActiveCaseId(next[0]?.id ?? null);
    }
  };

  const runInvestigation = async () => {
    const label = targetLabel.trim() || userIntent.trim();
    if (!label) return;
    if (!enabledTools.length) return;

    const effectiveType =
      targetType === 'discovery' || isDiscoveryQuery(targetLabel, userIntent)
        ? 'discovery'
        : targetType;
    const domain = resolveDomain(targetLabel, effectiveType);
    const intentText = userIntent.trim() || label;
    const region = activeCase?.target.region;
    const target = {
      type: effectiveType,
      label: effectiveType === 'discovery' ? intentText.slice(0, 240) : targetLabel.trim() || label,
      domain: domain || undefined,
      userIntent: intentText,
      region,
    };

    let caseId = activeCaseId;
    let caseRecord: IntelWebCase;

    if (!caseId) {
      caseRecord = createIntelWebCase({ target, enabledTools: [...enabledTools] });
      caseId = caseRecord.id;
      setActiveCaseId(caseId);
      refreshCases();
    } else {
      caseRecord = updateIntelWebCase(caseId, {
        target,
        enabledTools: [...enabledTools],
        status: 'running',
        toolResults: [],
        brief: undefined,
        error: undefined,
      })!;
      refreshCases();
    }

    setRunning(true);
    setRunProgress('Running free OSINT tools on server…');
    setChatLines([]);
    setFailureOffer(null);

    const freeIds = enabledTools.filter((id): id is FreeToolId => !isCloudTool(id));
    const cloudIds = enabledTools.filter(isCloudTool);
    const runOpts = {
      targetType: effectiveType,
      label: target.label,
      domain,
      userIntent: target.userIntent,
      region,
    };

    const allResults: ToolRunResult[] = [];

    try {
      if (freeIds.length) {
        const freeResults = await runFreeToolsBatch(freeIds, runOpts);
        allResults.push(...freeResults);
        updateIntelWebCase(caseId, { toolResults: [...allResults], status: 'running' });
        refreshCases();
      }

      for (const toolId of cloudIds) {
        setRunProgress(`Cloud: ${toolLabel(toolId)}…`);
        const result = await runCloudTool(toolId, runOpts);
        allResults.push(result);
        updateIntelWebCase(caseId, { toolResults: [...allResults], status: 'running' });
        refreshCases();
      }

      setRunProgress('Grok is synthesizing your intel brief…');
      const targetContext = buildTargetContext(target, allResults, uploadedDocs);
      const briefPrompt =
        effectiveType === 'discovery'
          ? 'Synthesize a research brief listing entities/companies matching the query. For each finding include: name, status evidence, date signals, source tool, confidence (high/medium/low). If results are thin, say what was searched and recommend next steps.'
          : 'Synthesize a complete intelligence brief from the tool results. Use: Executive summary, Key findings (bullets), Recommended next steps. Cite which tools supported each finding.';
      let brief: string;
      try {
        const briefRes = await sendIntelChat({
          message: briefPrompt,
          targetContext,
          documentContext: buildDocumentContext(uploadedDocs),
        });
        brief = briefRes.text;
      } catch (chatErr) {
        brief = formatFallbackBrief(target, allResults);
        if (allResults.some((r) => r.status === 'done')) {
          brief += `\n\n---\n_Grok synthesis unavailable: ${chatErr instanceof Error ? chatErr.message : 'Chat failed'}. Brief generated from OSINT results above._`;
        } else {
          throw chatErr;
        }
      }

      const initialLines = [{ id: `brief-${Date.now()}`, role: 'ai' as const, content: brief }];
      updateIntelWebCase(caseId, {
        status: 'complete',
        toolResults: allResults,
        brief,
        chatMessages: initialLines.map((l) => ({
          id: l.id,
          role: l.role,
          content: l.content,
          createdAt: new Date().toISOString(),
        })),
        uploadedDocuments: uploadedDocs,
      });
      refreshCases();
      setChatLines(initialLines);

      const meaningful = allResults.filter((r) => r.status === 'done' && (r.data || r.summary)).length;
      if (meaningful < 2) {
        const offer = await fetchFailureToolOffer(
          target.userIntent,
          'Research returned limited results from the tools we ran.'
        );
        if (offer) setFailureOffer(offer);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Investigation failed';
      const partial =
        allResults.length > 0
          ? `## Partial results\n\n${allResults
              .map((r) => `- **${toolLabel(r.toolId)}**: ${r.summary || r.error || r.status}`)
              .join('\n')}`
          : undefined;
      updateIntelWebCase(caseId, {
        status: allResults.length ? 'complete' : 'error',
        toolResults: allResults,
        brief: partial,
        error: msg,
      });
      refreshCases();
      if (partial) {
        setChatLines([
          { id: 'partial', role: 'ai', content: `${partial}\n\n_Synthesis note: ${msg}_` },
        ]);
      }
      const offer = await fetchFailureToolOffer(
        userIntent.trim() || targetLabel.trim(),
        msg
      );
      if (offer) setFailureOffer(offer);
    } finally {
      setRunning(false);
      setRunProgress('');
    }
  };

  const sendChat = async () => {
    if (!activeCase || !chatInput.trim() || chatBusy || !activeCase.brief) return;

    const userLine: ChatLine = { id: `u-${Date.now()}`, role: 'user', content: chatInput.trim() };
    const nextLines = [...chatLines, userLine];
    setChatLines(nextLines);
    setChatInput('');
    setChatBusy(true);

    try {
      const targetContext = buildTargetContext(
        activeCase.target,
        activeCase.toolResults,
        activeCase.uploadedDocuments ?? uploadedDocs,
      );
      const history = nextLines.slice(0, -1).map((l) => ({
        role: l.role,
        content: l.content,
      }));
      const reply = await sendIntelChat({
        message: userLine.content,
        history,
        targetContext,
        documentContext: buildDocumentContext(activeCase.uploadedDocuments ?? uploadedDocs),
      });
      const withReply = [...nextLines, { id: `a-${Date.now()}`, role: 'ai' as const, content: reply.text }];
      setChatLines(withReply);
      persistChat(withReply);
    } catch (e) {
      const withErr = [
        ...nextLines,
        {
          id: `err-${Date.now()}`,
          role: 'ai' as const,
          content: e instanceof Error ? e.message : 'Chat failed',
        },
      ];
      setChatLines(withErr);
      persistChat(withErr);
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border overflow-hidden ${expanded ? 'min-h-[640px]' : ''}`}
      style={{ borderColor: brand.primary + '44', backgroundColor: brand.surface }}
    >
      {/* Hero */}
      <div className="p-5 md:p-6 border-b border-white/10" style={{ backgroundColor: brand.primarySoft }}>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: brand.primary + '33' }}
          >
            <Radar className="w-6 h-6" style={{ color: brand.primary }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: brand.primary }}>
              Intel Agent
            </p>
            <h2 className="text-xl font-black text-white mt-0.5">AI-directed OSINT research</h2>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Free tools run on our server (same as mobile). Cloud search uses Hive credits — skipped if balance is
              low. Grok synthesizes your brief.
            </p>
          </div>
          {expanded ? (
            <Link
              to="/app"
              className="shrink-0 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10"
            >
              ← App hub
            </Link>
          ) : null}
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-5 flex-1 overflow-y-auto">
        {expanded ? <WebPlansStrip /> : null}

        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          {/* Cases sidebar */}
          <aside className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cases</p>
              <button
                type="button"
                onClick={handleNewCase}
                className="text-xs font-bold text-bee-amber hover:underline"
              >
                + New
              </button>
            </div>
            {cases.length === 0 ? (
              <p className="text-sm text-slate-500 px-1">No cases yet.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCaseId(c.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition-colors group ${
                      c.id === activeCaseId
                        ? 'border-bee-amber/50 bg-bee-amber/10'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-white truncate">{c.target.label || 'Untitled'}</span>
                      <button
                        type="button"
                        className="text-slate-500 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCase(c.id);
                        }}
                        aria-label="Delete case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                        {c.target.type}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          c.status === 'complete'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : c.status === 'error'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="space-y-4 min-w-0">
            {/* Target */}
            <section className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
              <p className="text-sm font-bold text-white">Investigation target</p>
              <div className="flex flex-wrap gap-2">
                {TARGET_TYPES.map((tt) => (
                  <button
                    key={tt.id}
                    type="button"
                    onClick={() => onTargetTypeChange(tt.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      targetType === tt.id
                        ? 'bg-bee-amber text-bee-black'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {TARGET_TYPES.find((t) => t.id === targetType)?.hint}
              </p>
              <input
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
                placeholder={TARGET_TYPES.find((t) => t.id === targetType)?.placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-bee-amber/50"
                onKeyDown={(e) => e.key === 'Enter' && !running && runInvestigation()}
              />
              {resolvedDomain && targetType !== 'domain' ? (
                <p className="text-xs text-slate-500">
                  Resolved domain: <span className="text-slate-300">{resolvedDomain}</span>
                </p>
              ) : null}
              <textarea
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-bee-amber/50 resize-y"
                placeholder="What do you want to learn?"
              />
              <button
                type="button"
                onClick={runInvestigation}
                disabled={running || !targetLabel.trim() || !enabledTools.length}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bee-amber text-bee-black font-extrabold text-sm hover:bg-bee-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run intel
                  </>
                )}
              </button>
              {runProgress ? (
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse text-bee-amber" />
                  {runProgress}
                </p>
              ) : null}
            </section>

            {/* Tools */}
            <section className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setToolsOpen((o) => !o)}
              >
                <span className="text-sm font-bold text-white">
                  OSINT tools ({enabledTools.length}/{availableTools.length})
                </span>
                {toolsOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {toolsOpen ? (
                <div className="px-4 pb-4 grid sm:grid-cols-2 gap-2">
                  {availableTools.map((tool) => (
                    <label
                      key={tool.id}
                      className="flex items-start gap-2 rounded-lg border border-white/10 p-2.5 cursor-pointer hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={enabledTools.includes(tool.id)}
                        onChange={() => toggleTool(tool.id)}
                        className="mt-1 accent-amber-500"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-white">{tool.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              tool.tier === 'free'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {tool.tier === 'free' ? 'Free' : 'Credits'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{tool.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : null}
            </section>

            {/* Results */}
            {(activeCase?.toolResults?.length ?? 0) > 0 ? (
              <section className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setResultsOpen((o) => !o)}
                >
                  <span className="text-sm font-bold text-white">
                    Tool results ({activeCase?.toolResults?.length})
                  </span>
                  {resultsOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {resultsOpen ? (
                  <div className="px-4 pb-4 space-y-2 max-h-52 overflow-y-auto">
                    {activeCase?.toolResults?.map((r) => (
                      <div key={r.toolId} className="flex gap-2 text-sm border border-white/10 rounded-lg p-2.5">
                        {statusIcon(r.status)}
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{toolLabel(r.toolId)}</p>
                          <p className="text-xs text-slate-400">
                            {r.summary || r.error || r.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {failureOffer ? (
              <section className="rounded-xl border border-bee-amber/30 bg-bee-amber/10 p-4 space-y-3">
                <p className="text-sm font-bold text-bee-amber">What to do next</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{failureOffer.reply}</p>
                {failureOffer.guideSteps?.map((step, i) => (
                  <p key={i} className="text-xs text-slate-400">
                    {i + 1}. {step.replace(/\*\*/g, '')}
                  </p>
                ))}
                <div className="flex flex-wrap gap-2">
                  {failureOffer.toolkitApp?.id ? (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold"
                      onClick={async () => {
                        const userId = getOrCreateWebHiveUserId();
                        const installed = await installToolkitApp(failureOffer.toolkitApp!.id, userId);
                        if (installed?.app) {
                          window.location.href = `/hive-apps/run/${installed.sourceAppId || installed.app.id}`;
                        }
                      }}
                    >
                      Install {failureOffer.toolkitApp.title}
                    </button>
                  ) : null}
                  {failureOffer.offerBuild ? (
                    <Link
                      to="/hive-apps/build"
                      className="px-4 py-2 rounded-xl border border-white/20 text-white text-sm font-bold"
                    >
                      Build custom tool
                    </Link>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* Grok chat */}
            <section
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: brand.primary + '55', backgroundColor: 'rgba(0,0,0,0.25)' }}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" style={{ color: brand.primary }} />
                <p className="text-sm font-bold text-white">Grok intel chat</p>
              </div>
              <p className="text-xs text-slate-500">
                Large follow-up chat — same Hive credit pricing as the mobile app. Upload .txt or .pdf
                exports from your research for Grok to analyze alongside OSINT results.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,text/plain,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadBusy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-xs font-bold text-white hover:bg-white/5 disabled:opacity-50"
                >
                  {uploadBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload .txt / .pdf
                </button>
                {uploadedDocs.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-xs text-slate-300"
                  >
                    <FileText className="w-3 h-3" />
                    {d.name} ({d.chars.toLocaleString()} chars)
                  </span>
                ))}
              </div>
              <div
                className={`rounded-xl border border-white/10 bg-black/30 p-4 overflow-y-auto ${
                  expanded ? 'min-h-[360px] max-h-[50vh]' : 'min-h-[200px] max-h-64'
                }`}
              >
                {!chatLines.length ? (
                  <p className="text-sm text-slate-500 text-center py-10">
                    Run an investigation to generate an intel brief, then ask Grok follow-ups here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {chatLines.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-xl px-3 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-bee-amber/20 text-white ml-6 border border-bee-amber/30'
                            : 'bg-white/[0.04] text-slate-200 mr-6 border border-white/10'
                        }`}
                      >
                        {m.content}
                      </div>
                    ))}
                    {chatBusy ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Grok is thinking…
                      </div>
                    ) : null}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Grok about findings, risks, next steps… (Enter to send, Shift+Enter for newline)"
                rows={expanded ? 5 : 3}
                disabled={!activeCase?.brief || chatBusy}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-bee-amber/50 resize-y disabled:opacity-50 min-h-[100px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendChat();
                  }
                }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void sendChat()}
                  disabled={!activeCase?.brief || chatBusy || !chatInput.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chatBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send to Grok
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
