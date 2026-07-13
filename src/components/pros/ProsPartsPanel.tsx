import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Package,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import {
  prosListPartRequests,
  prosUpdatePartRequest,
  type ProsPartRequest,
  type ProsPartRequestStatus,
} from '../../lib/prosPartsApi';
import { DemoSampleBadge } from './ProsDemoPreviewBanner';
import { cn } from '../../lib/utils';

type Filter = ProsPartRequestStatus | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'pending_approval', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'ordered', label: 'Ordered' },
  { id: 'declined', label: 'Declined' },
  { id: 'all', label: 'All' },
];

const STATUS_STYLES: Record<ProsPartRequestStatus, string> = {
  pending_approval: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-sky-500/20 text-sky-300',
  ordered: 'bg-emerald-500/20 text-emerald-300',
  declined: 'bg-red-500/20 text-red-300',
};

type Props = {
  user: User;
  isManager: boolean;
  onRefresh?: () => void;
};

export default function ProsPartsPanel({ user, isManager, onRefresh }: Props) {
  const [filter, setFilter] = useState<Filter>('pending_approval');
  const [requests, setRequests] = useState<ProsPartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prosListPartRequests(user, filter === 'all' ? 'all' : filter);
      setRequests(res.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load part requests');
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (
    request: ProsPartRequest,
    status: ProsPartRequestStatus,
    extra?: { declineReason?: string; supplierNote?: string }
  ) => {
    if (!isManager) return;
    setBusyId(request.id);
    setError(null);
    try {
      await prosUpdatePartRequest(user, request.id, { status, ...extra });
      await load();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const approve = (r: ProsPartRequest) => {
    if (r.id.startsWith('demo-')) return;
    void updateStatus(r, 'approved');
  };

  const markOrdered = (r: ProsPartRequest) => {
    if (r.id.startsWith('demo-')) return;
    const note = window.prompt('Supplier / PO note (optional)', r.supplierNote || '') ?? '';
    void updateStatus(r, 'ordered', { supplierNote: note.trim() || undefined });
  };

  const decline = (r: ProsPartRequest) => {
    if (r.id.startsWith('demo-')) return;
    const reason = window.prompt('Reason for declining (shown to tech)', 'Not approved') ?? '';
    if (!reason.trim()) return;
    void updateStatus(r, 'declined', { declineReason: reason.trim() });
  };

  const pendingCount = requests.filter((r) => r.status === 'pending_approval').length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 flex flex-wrap gap-4 items-start justify-between">
        <div className="flex items-start gap-3">
          <Package className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-lg">Parts ordering</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Techs submit part requests from Diagnose after a diagnosis. Review here, approve for purchase,
              then mark ordered once your accountant or supplier confirms.
            </p>
          </div>
        </div>
        {filter === 'pending_approval' && pendingCount > 0 ? (
          <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-full bg-amber-500 text-black">
            {pendingCount} awaiting review
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-bold uppercase',
              filter === f.id ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:text-white'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/15 text-red-300 px-4 py-3 text-sm">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading part requests…
        </div>
      ) : requests.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          {filter === 'pending_approval'
            ? 'No parts waiting for approval. Techs tap Order part below a diagnosis in Diagnose.'
            : 'No part requests in this filter.'}
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase px-2 py-1 rounded-full',
                        STATUS_STYLES[r.status]
                      )}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500 font-bold">{r.packId}</span>
                    {r.id.startsWith('demo-') ? <DemoSampleBadge /> : null}
                    {r.quantity > 1 ? (
                      <span className="text-[10px] text-slate-500">×{r.quantity}</span>
                    ) : null}
                  </div>
                  <h3 className="font-bold text-lg">{r.partName}</h3>
                  {r.partNumber ? (
                    <p className="text-sm font-mono text-amber-300 mt-0.5">#{r.partNumber}</p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5">Part number not confirmed — verify before ordering</p>
                  )}
                </div>
                {r.createdAt ? (
                  <div className="text-[11px] text-slate-500 text-right">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                ) : null}
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-400">
                {r.brand ? <div>Brand: <span className="text-slate-200">{r.brand}</span></div> : null}
                {r.equipmentModel ? (
                  <div>Model: <span className="text-slate-200">{r.equipmentModel}</span></div>
                ) : null}
                {r.jobTitle ? (
                  <div className="sm:col-span-2">
                    Job: <span className="text-slate-200">{r.jobTitle}</span>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  Requested by: <span className="text-slate-200">{r.requestedByName}</span>
                  {r.requestedByEmail ? (
                    <span className="text-slate-500"> · {r.requestedByEmail}</span>
                  ) : null}
                </div>
                {r.notes ? (
                  <div className="sm:col-span-2 border-l-2 border-amber-500/40 pl-3 text-slate-300">
                    {r.notes}
                  </div>
                ) : null}
                {r.partUrl ? (
                  <div className="sm:col-span-2">
                    <a
                      href={r.partUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Part link from tech
                    </a>
                  </div>
                ) : null}
                {r.diagnoseQuery ? (
                  <div className="sm:col-span-2 text-xs text-slate-500 italic">
                    Diagnosis context: {r.diagnoseQuery.slice(0, 200)}
                    {r.diagnoseQuery.length > 200 ? '…' : ''}
                  </div>
                ) : null}
              </div>

              {r.partName || r.partNumber ? (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    [r.brand, r.partNumber || r.partName, r.equipmentModel].filter(Boolean).join(' ')
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Search suppliers
                </a>
              ) : null}

              {r.approvedByName ? (
                <p className="text-xs text-slate-500">
                  Approved by {r.approvedByName}
                  {r.approvedAt ? ` · ${new Date(r.approvedAt).toLocaleString()}` : ''}
                </p>
              ) : null}
              {r.orderedByName ? (
                <p className="text-xs text-emerald-400/80">
                  Ordered by {r.orderedByName}
                  {r.orderedAt ? ` · ${new Date(r.orderedAt).toLocaleString()}` : ''}
                  {r.supplierNote ? ` · ${r.supplierNote}` : ''}
                </p>
              ) : null}
              {r.declineReason ? (
                <p className="text-xs text-red-300">Declined: {r.declineReason}</p>
              ) : null}
              {r.id.startsWith('demo-') ? (
                <p className="text-xs text-sky-300/80">Sample request — techs submit real orders from Diagnose.</p>
              ) : null}

              {isManager && r.status === 'pending_approval' && !r.id.startsWith('demo-') ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => approve(r)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-4 py-2 text-xs font-bold"
                  >
                    {busyId === r.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => decline(r)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25 px-4 py-2 text-xs font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              ) : null}

              {isManager && r.status === 'approved' && !r.id.startsWith('demo-') ? (
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => markOrdered(r)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 text-black px-4 py-2 text-xs font-bold"
                >
                  {busyId === r.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5" />
                  )}
                  Mark ordered
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!isManager ? (
        <p className="text-slate-500 text-sm">
          Only owners and managers can approve and mark parts ordered. You can view requests submitted by your team.
        </p>
      ) : null}
    </div>
  );
}
