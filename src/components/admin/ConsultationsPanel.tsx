import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Loader2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminJson } from '../../lib/adminApi';

const INTEREST_FILTERS = [
  { id: 'lead-gen', label: 'Lead generation' },
  { id: 'customer-ops', label: 'Customer ops' },
  { id: 'document-erp', label: 'Document / ERP' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'medical-legal', label: 'Medical / legal' },
  { id: 'real-estate', label: 'Real estate' },
  { id: 'phone-systems', label: 'Phone systems' },
  { id: 'transcription', label: 'Transcription' },
  { id: 'custom', label: 'Custom' },
] as const;

interface ConsultationRequest {
  id: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  interests?: string[];
  projectGoals?: string;
  painPoints?: string;
  timeline?: string;
  budget?: string;
  status?: string;
  createdAt?: { seconds: number };
}

interface ConsultationsPanelProps {
  user: User;
}

export default function ConsultationsPanel({ user }: ConsultationsPanelProps) {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs =
        selectedInterests.length > 0
          ? `?interests=${encodeURIComponent(selectedInterests.join(','))}`
          : '';
      const data = await adminJson<{ requests: ConsultationRequest[] }>(
        `/api/admin/consultations${qs}`,
        user
      );
      setRequests(data.requests ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  }, [user, selectedInterests]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const markReviewed = async (id: string) => {
    try {
      await adminJson(`/api/admin/consultations/${id}`, user, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'reviewed' }),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-bee-amber" />
          Consultation requests
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          B2B strategy calls from /book-consultation. Filter by solution interest — leave all
          unchecked to show every request.
        </p>

        <div className="flex flex-wrap gap-2">
          {INTEREST_FILTERS.map((opt) => (
            <label
              key={opt.id}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors',
                selectedInterests.includes(opt.id)
                  ? 'bg-bee-amber/15 border-bee-amber/40 text-bee-amber'
                  : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/20'
              )}
            >
              <input
                type="checkbox"
                className="rounded border-white/20 text-bee-amber focus:ring-bee-amber"
                checked={selectedInterests.includes(opt.id)}
                onChange={() => toggleInterest(opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-bee-amber animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-center text-slate-500 py-12">No consultation requests match your filters.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => {
            const expanded = expandedId === req.id;
            return (
              <li
                key={req.id}
                className="rounded-xl border border-white/10 bg-black/20 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : req.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {req.companyName} · {req.contactName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{req.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {req.interests?.map((i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-bee-amber/10 text-bee-amber border border-bee-amber/20"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        req.status === 'new'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-slate-500/10 text-slate-400'
                      )}
                    >
                      {req.status || 'new'}
                    </span>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-white/5 text-sm space-y-3">
                    <p className="text-slate-300 whitespace-pre-wrap">{req.projectGoals}</p>
                    {req.painPoints && (
                      <p className="text-slate-400">
                        <span className="text-slate-500">Pain points:</span> {req.painPoints}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Timeline: {req.timeline || '—'} · Budget: {req.budget || '—'}
                    </p>
                    {req.status === 'new' && (
                      <button
                        type="button"
                        onClick={() => markReviewed(req.id)}
                        className="text-xs font-semibold text-bee-amber hover:underline"
                      >
                        Mark as reviewed
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
