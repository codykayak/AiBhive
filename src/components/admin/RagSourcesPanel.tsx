import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  FileText,
  Globe,
  Plus,
  Loader2,
  Eye,
  Trash2,
  Upload,
  X,
  ExternalLink,
  Database,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminJson, adminFormData } from '../../lib/adminApi';

export interface RagSource {
  id: string;
  title: string;
  type: 'website' | 'document' | 'builtin';
  url?: string | null;
  active: boolean;
  categories: string[];
  previewText?: string | null;
  builtin?: boolean;
  mimeType?: string | null;
  originalFilename?: string | null;
  description?: string | null;
}

type SourcesResponse = { sources: RagSource[] };
type ViewResponse = {
  source: RagSource;
  previewText?: string | null;
  downloadUrl?: string | null;
  externalUrl?: string | null;
};

interface RagSourcesPanelProps {
  user: User;
}

export default function RagSourcesPanel({ user }: RagSourcesPanelProps) {
  const [sources, setSources] = useState<RagSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [websiteTitle, setWebsiteTitle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [addLegal, setAddLegal] = useState(true);
  const [addMedical, setAddMedical] = useState(true);
  const [addingWebsite, setAddingWebsite] = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<ViewResponse | null>(null);

  const categories = [
    ...(addLegal ? ['legal'] : []),
    ...(addMedical ? ['medical'] : []),
  ];

  const loadSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminJson<SourcesResponse>('/api/admin/rag-sources', user);
      setSources(data.sources ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load RAG sources');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const data = await adminJson<ViewResponse>(`/api/admin/rag-sources/${id}/view`, user);
      setViewData(data);
    } catch (err: unknown) {
      setViewData({
        source: sources.find((s) => s.id === id)!,
        previewText: err instanceof Error ? err.message : 'Could not load preview',
      });
    } finally {
      setViewLoading(false);
    }
  };

  const addWebsite = async () => {
    if (!websiteTitle.trim() || !websiteUrl.trim()) {
      setError('Website title and URL are required.');
      return;
    }
    if (categories.length === 0) {
      setError('Select at least one category (Legal or Medical).');
      return;
    }
    setAddingWebsite(true);
    setError(null);
    try {
      await adminJson('/api/admin/rag-sources/website', user, {
        method: 'POST',
        body: JSON.stringify({
          title: websiteTitle.trim(),
          url: websiteUrl.trim(),
          categories,
        }),
      });
      setWebsiteTitle('');
      setWebsiteUrl('');
      await loadSources();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add website');
    } finally {
      setAddingWebsite(false);
    }
  };

  const addDocument = async () => {
    if (!docFile) {
      setError('Choose a document to upload.');
      return;
    }
    if (categories.length === 0) {
      setError('Select at least one category (Legal or Medical).');
      return;
    }
    setAddingDoc(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', docFile);
      form.append('title', docTitle.trim() || docFile.name);
      form.append('categories', JSON.stringify(categories));
      await adminFormData('/api/admin/rag-sources/document', user, form);
      setDocTitle('');
      setDocFile(null);
      await loadSources();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setAddingDoc(false);
    }
  };

  const toggleActive = async (source: RagSource) => {
    setBusyId(source.id);
    try {
      await adminJson(`/api/admin/rag-sources/${source.id}`, user, {
        method: 'PATCH',
        body: JSON.stringify({ active: !source.active }),
      });
      await loadSources();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const removeSource = async (source: RagSource) => {
    if (
      !window.confirm(
        `Remove "${source.title}" from Pass 3 references? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(source.id);
    try {
      await adminJson(`/api/admin/rag-sources/${source.id}`, user, { method: 'DELETE' });
      await loadSources();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
      <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
        <Database className="w-5 h-5 text-bee-amber" />
        Pass 3: RAG Verification &amp; Databases
      </h3>
      <p className="text-sm text-slate-400 mb-6">
        Reference documents and websites Gemini uses during legal/medical Pass 3 checks.
        View sources, add PDFs or public URLs, and toggle which corpora are active.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-bee-amber animate-spin" />
        </div>
      ) : (
        <ul className="space-y-3 mb-8">
          {sources.map((source) => (
            <li
              key={source.id}
              className={cn(
                'p-4 rounded-xl border transition-colors',
                source.active
                  ? 'bg-black/20 border-white/10'
                  : 'bg-black/10 border-white/5 opacity-70'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {source.type === 'website' ? (
                      <Globe className="w-4 h-4 text-bee-amber flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-bee-amber flex-shrink-0" />
                    )}
                    <span className="text-white font-medium">{source.title}</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border',
                        source.active
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      )}
                    >
                      {source.active ? 'Active' : 'Inactive'}
                    </span>
                    {source.builtin && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bee-amber/10 text-bee-amber border border-bee-amber/20">
                        Built-in
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {source.type === 'website' ? 'Website' : 'Document'} ·{' '}
                    {source.categories?.join(', ') || 'general'}
                  </p>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-bee-amber hover:underline truncate block max-w-full"
                    >
                      {source.url}
                    </a>
                  )}
                  {source.originalFilename && (
                    <p className="text-xs text-slate-500 mt-1">{source.originalFilename}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openView(source.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-bee-amber/30 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    disabled={busyId === source.id}
                    onClick={() => toggleActive(source)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  >
                    {source.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === source.id}
                    onClick={() => removeSource(source)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-white/10">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-bee-amber" />
            Add website
          </h4>
          <input
            type="text"
            placeholder="Display title"
            value={websiteTitle}
            onChange={(e) => setWebsiteTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-bee-amber/50 text-sm"
          />
          <input
            type="url"
            placeholder="https://example.com/reference"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-bee-amber/50 text-sm"
          />
          <CategoryToggles
            legal={addLegal}
            medical={addMedical}
            onLegal={setAddLegal}
            onMedical={setAddMedical}
          />
          <button
            type="button"
            onClick={addWebsite}
            disabled={addingWebsite}
            className="w-full py-2.5 bg-bee-amber/20 border border-bee-amber/40 text-bee-amber font-semibold rounded-xl hover:bg-bee-amber/30 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {addingWebsite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Add website to RAG
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-bee-amber" />
            Upload document
          </h4>
          <input
            type="text"
            placeholder="Title (optional)"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-bee-amber/50 text-sm"
          />
          <input
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,application/pdf,text/plain"
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-bee-amber/20 file:text-bee-amber file:font-medium"
          />
          <p className="text-xs text-slate-500">PDF, TXT, MD, CSV, or JSON · max 20MB · indexed via Gemini File API</p>
          <CategoryToggles
            legal={addLegal}
            medical={addMedical}
            onLegal={setAddLegal}
            onMedical={setAddMedical}
          />
          <button
            type="button"
            onClick={addDocument}
            disabled={addingDoc || !docFile}
            className="w-full py-2.5 bg-bee-amber/20 border border-bee-amber/40 text-bee-amber font-semibold rounded-xl hover:bg-bee-amber/30 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {addingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload &amp; register document
          </button>
        </div>
      </div>

      {viewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rag-view-title"
        >
          <div className="glass-card max-w-2xl w-full max-h-[85vh] flex flex-col rounded-2xl border border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h4 id="rag-view-title" className="text-lg font-bold text-white truncate pr-4">
                {viewData?.source?.title ?? 'Source preview'}
              </h4>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-grow">
              {viewLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-bee-amber animate-spin" />
                </div>
              ) : (
                <>
                  {viewData?.externalUrl && (
                    <a
                      href={viewData.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-bee-amber hover:underline text-sm mb-4"
                    >
                      Open live URL <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {viewData?.downloadUrl && (
                    <a
                      href={viewData.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-bee-amber hover:underline text-sm mb-4 ml-0 block"
                    >
                      Download stored file <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-black/30 p-4 rounded-xl border border-white/10 max-h-[50vh] overflow-y-auto">
                    {viewData?.previewText ||
                      'No cached preview. Gemini will still use this source during Pass 3 when active.'}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryToggles({
  legal,
  medical,
  onLegal,
  onMedical,
}: {
  legal: boolean;
  medical: boolean;
  onLegal: (v: boolean) => void;
  onMedical: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-4 text-sm">
      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={legal}
          onChange={(e) => onLegal(e.target.checked)}
          className="rounded border-white/20 text-bee-amber focus:ring-bee-amber"
        />
        Legal
      </label>
      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={medical}
          onChange={(e) => onMedical(e.target.checked)}
          className="rounded border-white/20 text-bee-amber focus:ring-bee-amber"
        />
        Medical
      </label>
    </div>
  );
}
