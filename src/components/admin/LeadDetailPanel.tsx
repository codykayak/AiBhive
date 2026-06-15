import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  X,
  Loader2,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminJson } from '../../lib/adminApi';

export interface PipelinePass {
  id: string;
  name: string;
  status: string;
  models?: string[];
  modelRuns?: { model: string; label: string; status: string; note?: string; error?: string }[];
  ragSourceTitles?: string[];
  citationCount?: number;
  flagCount?: number;
  error?: string;
  stack?: string;
  note?: string;
}

export interface LeadDetail {
  id: string;
  email?: string | null;
  status: string;
  calculatedPrice?: number;
  error?: string;
  errorStack?: string;
  stripeSessionId?: string;
  fileUrls?: string[];
  fileUrl?: string;
  cleanTranslatedTextUrl?: string;
  annotatedTextUrl?: string;
  finalAudioUrl?: string;
  finalOutputTextUrl?: string;
  flags?: { term: string; warning: string; sourceTitle?: string }[];
  ragCitations?: { sourceTitle?: string; detail?: string }[];
  pipelineRun?: { passes?: PipelinePass[]; startedAt?: string; completedAt?: string };
  services?: {
    transcribeTranslate?: boolean;
    legalMedical?: boolean;
    voiceCloning?: boolean;
  };
  languages?: { to?: string };
}

interface LeadDetailPanelProps {
  user: User;
  leadId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function LeadDetailPanel({ user, leadId, onClose, onUpdated }: LeadDetailPanelProps) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminJson<{ lead: LeadDetail }>(`/api/admin/leads/${leadId}`, user);
      setLead(data.lead);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const retryPass3 = async () => {
    if (!leadId) return;
    setRetrying(true);
    setError(null);
    try {
      await adminJson(`/api/admin/leads/${leadId}/retry-pass3`, user, { method: 'POST' });
      await load();
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Pass 3 retry failed');
    } finally {
      setRetrying(false);
    }
  };

  if (!leadId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl h-full glass-card border-l border-white/10 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Lead detail</h3>
            <p className="text-xs font-mono text-slate-500 mt-1">{leadId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-bee-amber animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {lead && !loading && (
            <>
              <section>
                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Overview</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Status</dt>
                    <dd className="text-white font-medium">{lead.status}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Email</dt>
                    <dd className="text-white">{lead.email || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Amount</dt>
                    <dd className="text-white font-mono">${lead.calculatedPrice?.toFixed(2) ?? '0.00'}</dd>
                  </div>
                  {lead.stripeSessionId && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-400">Stripe session</dt>
                      <dd className="text-xs font-mono text-bee-amber break-all">{lead.stripeSessionId}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section>
                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Pipeline passes</h4>
                <ul className="space-y-2">
                  {(lead.pipelineRun?.passes ?? []).map((pass) => (
                    <li
                      key={pass.id}
                      className="p-3 rounded-xl bg-black/30 border border-white/10 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-white font-medium">{pass.name}</span>
                        <PassStatusBadge status={pass.status} />
                      </div>
                      {pass.models?.length ? (
                        <p className="text-xs text-slate-500">Models: {pass.models.join(', ')}</p>
                      ) : null}
                      {pass.modelRuns?.map((run) => (
                        <p key={run.model} className="text-xs text-slate-400 mt-1">
                          {run.label}: {run.status}
                          {run.note ? ` — ${run.note}` : ''}
                        </p>
                      ))}
                      {pass.ragSourceTitles?.length ? (
                        <p className="text-xs text-slate-400 mt-1">
                          RAG: {pass.ragSourceTitles.join('; ')}
                        </p>
                      ) : null}
                      {pass.error && (
                        <p className="text-xs text-red-400 mt-1">{pass.error}</p>
                      )}
                    </li>
                  ))}
                  {!lead.pipelineRun?.passes?.length && (
                    <li className="text-slate-500 text-sm">No pipeline log stored for this lead yet.</li>
                  )}
                </ul>
              </section>

              {(lead.flags?.length ?? 0) > 0 && (
                <section>
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Pass 3 flags</h4>
                  <ul className="space-y-2">
                    {lead.flags!.map((f) => (
                      <li
                        key={`${f.term}-${f.warning}`}
                        className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm"
                      >
                        <p className="text-bee-amber font-semibold">{f.term}</p>
                        <p className="text-slate-300 mt-1">{f.warning}</p>
                        {f.sourceTitle && (
                          <p className="text-xs text-slate-500 mt-1">Source: {f.sourceTitle}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(lead.ragCitations?.length ?? 0) > 0 && (
                <section>
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">RAG citations</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {lead.ragCitations!.map((c, i) => (
                      <li key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <p className="font-medium text-white">{c.sourceTitle || 'Source'}</p>
                        <p className="text-xs text-slate-400">{c.detail}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(lead.error || lead.errorStack) && (
                <section>
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Error</h4>
                  {lead.error && <p className="text-red-400 text-sm">{lead.error}</p>}
                  {lead.errorStack && (
                    <pre className="mt-2 text-xs text-slate-400 bg-black/40 p-3 rounded-lg overflow-x-auto max-h-40">
                      {lead.errorStack}
                    </pre>
                  )}
                </section>
              )}

              <section>
                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Downloads</h4>
                <div className="flex flex-col gap-2">
                  <DownloadLink href={lead.fileUrls?.[0] || lead.fileUrl} label="Source upload" />
                  <DownloadLink href={lead.cleanTranslatedTextUrl} label="Clean translation" />
                  <DownloadLink href={lead.annotatedTextUrl || lead.finalOutputTextUrl} label="Annotated output" />
                  <DownloadLink href={lead.finalAudioUrl} label="Cloned audio" />
                </div>
              </section>

              {lead.services?.legalMedical && (
                <button
                  type="button"
                  onClick={retryPass3}
                  disabled={retrying}
                  className="w-full py-3 bg-bee-amber/20 border border-bee-amber/40 text-bee-amber font-bold rounded-xl hover:bg-bee-amber/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {retrying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Re-run Pass 3 (RAG)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PassStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'text-[10px] px-2 py-0.5 rounded-full uppercase font-bold',
        status === 'completed' && 'bg-green-500/10 text-green-400',
        status === 'failed' && 'bg-red-500/10 text-red-400',
        status === 'skipped' && 'bg-slate-500/10 text-slate-400',
        status === 'pending' && 'bg-amber-500/10 text-amber-400'
      )}
    >
      {status}
    </span>
  );
}

function DownloadLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-sm text-bee-amber hover:underline"
    >
      <FileText className="w-4 h-4" />
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
