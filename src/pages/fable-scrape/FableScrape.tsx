import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  Search,
  Shield,
  Image as ImageIcon,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ScanText,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';
import { SEO } from '../../components/SEO';

type ScanImage = { url: string; alt?: string; filename: string; ext?: string };
type ScanDoc = { url: string; label?: string; filename: string; ext?: string };

type ScanResult = {
  engine: string;
  finalUrl: string;
  title: string;
  text: string;
  textChars: number;
  images: ScanImage[];
  documents: ScanDoc[];
  cookies: string;
  blocked: boolean;
  directAsset?: boolean;
};

type Engine = 'auto' | 'firecrawl' | 'stealth';

const ENGINES: { id: Engine; label: string; sub: string }[] = [
  { id: 'auto', label: 'Auto', sub: 'Best available engine' },
  { id: 'firecrawl', label: 'Max stealth', sub: 'Cloud anti-bot (Cloudflare)' },
  { id: 'stealth', label: 'Standard', sub: 'Browser emulation' },
];

const OCR_FORMATS = ['Markdown', 'Plain Text', 'Preserve Layout'];

function saveBlob(base64: string, mimeType: string, filename: string) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function saveText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function FableScrape() {
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState<Engine>('auto');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');

  const [ocrFormat, setOcrFormat] = useState('Markdown');
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [copied, setCopied] = useState(false);

  const allSelected = useMemo(
    () => !!result?.images.length && selectedImages.size === result.images.length,
    [result, selectedImages]
  );

  const handleScan = async () => {
    const target = url.trim();
    if (!target) {
      setError('Enter a URL to scrape.');
      return;
    }
    const normalized = /^https?:\/\//i.test(target) ? target : `https://${target}`;
    setError('');
    setResult(null);
    setOcrText('');
    setOcrError('');
    setSelectedImages(new Set());
    setScanning(true);
    try {
      const res = await fetch('/api/fable-scrape/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, engine }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Scan failed (${res.status}).`);
      setResult(data as ScanResult);
      setSelectedImages(new Set((data.images as ScanImage[]).map((i) => i.url)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setScanning(false);
    }
  };

  const toggleImage = (imgUrl: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(imgUrl)) next.delete(imgUrl);
      else next.add(imgUrl);
      return next;
    });
  };

  const toggleAll = () => {
    if (!result) return;
    if (allSelected) setSelectedImages(new Set());
    else setSelectedImages(new Set(result.images.map((i) => i.url)));
  };

  const downloadOne = async (assetUrl: string, filename: string) => {
    setDownloadStatus(`Downloading ${filename}…`);
    try {
      const res = await fetch('/api/fable-scrape/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: assetUrl, referer: result?.finalUrl, cookies: result?.cookies }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Download failed.');
      saveBlob(data.base64, data.mimeType, data.filename || filename);
      setDownloadStatus('');
    } catch (err) {
      setDownloadStatus(err instanceof Error ? err.message : 'Download failed.');
    }
  };

  const downloadSelected = async () => {
    if (!result) return;
    const targets = result.images.filter((i) => selectedImages.has(i.url));
    if (!targets.length) return;
    setDownloadingAll(true);
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      setDownloadStatus(`Downloading ${i + 1} / ${targets.length}: ${targets[i].filename}`);
      try {
        const res = await fetch('/api/fable-scrape/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targets[i].url, referer: result.finalUrl, cookies: result.cookies }),
        });
        const data = await res.json();
        if (res.ok) {
          saveBlob(data.base64, data.mimeType, data.filename || targets[i].filename);
          ok += 1;
          await new Promise((r) => setTimeout(r, 350));
        }
      } catch {
        /* continue */
      }
    }
    setDownloadStatus(`Downloaded ${ok} / ${targets.length} images.`);
    setDownloadingAll(false);
  };

  const runOcr = async () => {
    if (!result) return;
    const urls = result.images.filter((i) => selectedImages.has(i.url)).map((i) => i.url);
    if (!urls.length) {
      setOcrError('Select at least one image to OCR.');
      return;
    }
    setOcrError('');
    setOcrText('');
    setOcrRunning(true);
    try {
      const res = await fetch('/api/fable-scrape/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: urls.slice(0, 100),
          referer: result.finalUrl,
          cookies: result.cookies,
          format: ocrFormat,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR failed.');
      setOcrText(data.text || '');
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'OCR failed.');
    } finally {
      setOcrRunning(false);
    }
  };

  const copyOcr = () => {
    navigator.clipboard.writeText(ocrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="py-24">
      <SEO
        title="Fable Scrape — Stealth Image & Document Harvester | AiBhive"
        description="Scrape hard-to-reach research sites, download images and documents undetected, and OCR them in one pass. Built for historical archive research."
        keywords="stealth web scraper, download images undetected, historical document scraping, OCR archive, anti-bot scraper"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6 border border-bee-amber/20"
          >
            <Shield className="w-4 h-4" />
            Research Harvester
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Fable <span className="text-gradient">Scrape</span>
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Pull images and text documents from archives that normally block bots — then OCR them in a single pass.
            No more manual right-click-and-save marathons.
          </p>
        </header>

        {/* Scan input */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-slate-300 text-sm font-bold mb-2">Archive or page URL</label>
              <div className="relative">
                <Globe className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="https://digitalarchive.example.org/collection/manuscript-42"
                  className="w-full bg-[#0f1115]/70 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:border-bee-amber/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="lg:w-72">
              <label className="block text-slate-300 text-sm font-bold mb-2">Stealth engine</label>
              <div className="grid grid-cols-3 gap-2">
                {ENGINES.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEngine(e.id)}
                    title={e.sub}
                    className={`px-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      engine === e.id
                        ? 'border-bee-amber bg-bee-amber/10 text-bee-amber'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="mt-5 w-full py-4 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {scanning ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Scanning undetected…
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-3" />
                Scan &amp; Harvest
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-8">
            {/* Summary bar */}
            <div className="glass-card p-5 rounded-2xl flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="font-bold text-white truncate max-w-md">{result.title || result.finalUrl}</span>
              </span>
              <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-400">
                Engine: {result.engine}
              </span>
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-bee-amber" /> {result.images.length} images
              </span>
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-bee-amber" /> {result.documents.length} documents
              </span>
              {result.blocked && (
                <span className="text-xs font-bold text-amber-400 inline-flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Site may be challenging — try Max stealth
                </span>
              )}
              <a
                href={result.finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 inline-flex items-center gap-1 hover:underline ml-auto"
              >
                Open source <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Images */}
            {result.images.length > 0 && (
              <section className="glass-card p-6 sm:p-8 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <ImageIcon className="w-5 h-5 mr-3 text-bee-amber" />
                    Images ({selectedImages.size}/{result.images.length} selected)
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={toggleAll}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 flex items-center gap-2"
                    >
                      {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                    <button
                      onClick={downloadSelected}
                      disabled={downloadingAll || selectedImages.size === 0}
                      className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold hover:bg-bee-yellow disabled:opacity-40 flex items-center gap-2"
                    >
                      {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download selected
                    </button>
                  </div>
                </div>

                {downloadStatus && <p className="text-xs text-slate-400 mb-4">{downloadStatus}</p>}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {result.images.map((img) => {
                    const isSel = selectedImages.has(img.url);
                    return (
                      <div
                        key={img.url}
                        className={`group relative rounded-xl overflow-hidden border transition-all ${
                          isSel ? 'border-bee-amber ring-1 ring-bee-amber/40' : 'border-white/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleImage(img.url)}
                          className="block w-full aspect-square bg-[#0f1115]"
                        >
                          {/* Preview via proxy is best-effort; hotlink may fail silently. */}
                          <img
                            src={img.url}
                            alt={img.alt || img.filename}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = '0.15';
                            }}
                          />
                        </button>
                        <div className="absolute top-2 left-2">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center ${
                              isSel ? 'bg-bee-amber text-bee-black' : 'bg-black/50 text-white'
                            }`}
                          >
                            {isSel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </div>
                        </div>
                        <div className="p-2 bg-black/40">
                          <p className="text-[11px] text-slate-300 truncate" title={img.filename}>
                            {img.filename}
                          </p>
                          <button
                            onClick={() => downloadOne(img.url, img.filename)}
                            className="mt-1 text-[11px] font-bold text-bee-amber inline-flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* OCR panel */}
            {result.images.length > 0 && (
              <section className="glass-card p-6 sm:p-8 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <ScanText className="w-5 h-5 mr-3 text-bee-amber" />
                    OCR selected images
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                      {OCR_FORMATS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setOcrFormat(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            ocrFormat === f ? 'bg-bee-amber text-bee-black' : 'text-slate-400'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={runOcr}
                      disabled={ocrRunning || selectedImages.size === 0}
                      className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold hover:bg-bee-yellow disabled:opacity-40 flex items-center gap-2"
                    >
                      {ocrRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
                      Extract text ({selectedImages.size})
                    </button>
                  </div>
                </div>

                {ocrError && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                    <p className="text-sm">{ocrError}</p>
                  </div>
                )}

                <div className="bg-[#0f1115]/50 border border-white/10 rounded-xl p-4 min-h-[180px] max-h-[420px] overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap">
                  {ocrText ? (
                    ocrText
                  ) : (
                    <span className="text-slate-600">
                      {ocrRunning
                        ? 'Fetching images undetected and running OCR…'
                        : 'Extracted text from the selected images will appear here.'}
                    </span>
                  )}
                </div>

                {ocrText && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={copyOcr}
                      className="py-2.5 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy text'}
                    </button>
                    <button
                      onClick={() => saveText(ocrText, 'fable-scrape-ocr.txt')}
                      className="py-2.5 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm"
                    >
                      <Download className="w-4 h-4" /> Download .txt
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Documents */}
            {result.documents.length > 0 && (
              <section className="glass-card p-6 sm:p-8 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center mb-5">
                  <FileText className="w-5 h-5 mr-3 text-bee-amber" />
                  Documents ({result.documents.length})
                </h2>
                <div className="space-y-2">
                  {result.documents.map((doc) => (
                    <div
                      key={doc.url}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10"
                    >
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate" title={doc.filename}>
                          {doc.filename}
                        </p>
                        <p className="text-slate-500 text-xs truncate">{doc.label || doc.url}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          {doc.ext || 'file'}
                        </span>
                        <button
                          onClick={() => downloadOne(doc.url, doc.filename)}
                          className="px-3 py-1.5 rounded-lg bg-bee-amber text-bee-black text-xs font-extrabold hover:bg-bee-yellow flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Page text */}
            {result.text && (
              <section className="glass-card p-6 sm:p-8 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-bee-amber" />
                    Page text ({result.textChars.toLocaleString()} chars)
                  </h2>
                  <button
                    onClick={() => saveText(result.text, 'fable-scrape-page.txt')}
                    className="py-2 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm"
                  >
                    <Download className="w-4 h-4" /> Download .txt
                  </button>
                </div>
                <div className="bg-[#0f1115]/50 border border-white/10 rounded-xl p-4 max-h-[360px] overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap">
                  {result.text}
                </div>
              </section>
            )}

            {result.images.length === 0 && result.documents.length === 0 && !result.text && (
              <div className="glass-card p-10 rounded-2xl text-center text-slate-400">
                No images, documents, or text were found on this page. Try the Max stealth engine.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
