import { useState } from 'react';
import type { User } from 'firebase/auth';
import { FileUp, Loader2 } from 'lucide-react';
import { prosJson, type ProsJob } from '../../lib/prosApi';
import { prosAdmin as t } from './prosAdminTheme';

type Props = {
  user: User;
};

export default function ProsManualIngestPanel({ user }: Props) {
  const [brand, setBrand] = useState('');
  const [title, setTitle] = useState('');
  const [packId, setPackId] = useState<ProsJob['packId']>('pool');
  const [modelPrefixes, setModelPrefixes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [chunkText, setChunkText] = useState('');
  const [scope, setScope] = useState<'company' | 'global'>('company');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ingest = async () => {
    if (!brand.trim() || !title.trim() || !chunkText.trim()) {
      setMessage('Brand, title, and chunk text are required.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await prosJson<{ success: boolean; chunksWritten: number; manualId: string }>(
        '/api/pros/knowledge/manuals/ingest',
        user,
        {
          method: 'POST',
          body: JSON.stringify({
            brand: brand.trim(),
            title: title.trim(),
            packId,
            modelPrefixes: modelPrefixes
              .split(/[,;\s]+/)
              .map((s) => s.trim())
              .filter(Boolean),
            sourceUrl: sourceUrl.trim() || undefined,
            scope,
            chunks: [{ page: 1, text: chunkText.trim() }],
          }),
        }
      );
      setMessage(`Ingested ${res.chunksWritten} chunk(s) · manual ${res.manualId}`);
      setChunkText('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Ingest failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${t.card} p-5 space-y-4 max-w-2xl`}>
      <h2 className="font-bold text-lg flex items-center gap-2">
        <FileUp className="w-5 h-5 text-sky-600" />
        Manual knowledge ingest
      </h2>
      <p className="text-sm text-slate-600">
        Paste extracted PDF text (one chunk at a time for now). Bulk pipeline can push thousands via the same API.
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Brand — Pentair, Carrier…"
          className={t.input}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Manual title"
          className={t.input}
        />
        <select
          value={packId}
          onChange={(e) => setPackId(e.target.value as ProsJob['packId'])}
          className={t.input}
        >
          <option value="pool">Pool</option>
          <option value="electrical">Electrical</option>
          <option value="property">Property</option>
          <option value="plumbing">Plumbing</option>
          <option value="hvac">HVAC</option>
          <option value="fiber">Fiber Optics</option>
        </select>
        <input
          value={modelPrefixes}
          onChange={(e) => setModelPrefixes(e.target.value)}
          placeholder="Model prefixes — RU199, IC40"
          className={t.input}
        />
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="Source PDF URL (optional)"
          className={`${t.input} md:col-span-2`}
        />
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as 'company' | 'global')}
          className={t.input}
        >
          <option value="company">Company knowledge only</option>
          <option value="global">Global corpus (platform admin)</option>
        </select>
      </div>
      <textarea
        value={chunkText}
        onChange={(e) => setChunkText(e.target.value)}
        placeholder="Paste manual excerpt text here…"
        rows={8}
        className={`w-full font-mono ${t.textarea}`}
      />
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void ingest()}
        className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 ${t.btnPrimary}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
        Ingest chunk
      </button>
    </div>
  );
}
