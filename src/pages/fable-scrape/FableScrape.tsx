import { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Copy,
  ScanText,
  CheckSquare,
  Square,
  ExternalLink,
  Wifi,
  Server,
  KeyRound,
  Layers,
  BookOpen,
  Zap,
} from 'lucide-react';
import { SEO } from '../../components/SEO';

type Asset = { url: string; alt?: string; label?: string; filename: string; ext?: string; iconLikely?: boolean };
type CrawlPage = { url: string; title: string; images: number; pdfs: number; documents: number; videos: number };

type ScanResult = {
  engine: string;
  routingMode: string;
  finalUrl: string;
  startUrl?: string;
  title?: string;
  text?: string;
  textChars?: number;
  images: Asset[];
  pdfs: Asset[];
  documents: Asset[];
  videos: Asset[];
  cookies: string;
  blocked?: boolean;
  directAsset?: boolean;
  pagesVisited?: number;
  pages?: CrawlPage[];
  stoppedReason?: string | null;
  truncated?: boolean;
};

type Engine = 'auto' | 'firecrawl' | 'stealth';
type RunMode = 'single' | 'crawl';
type RouteMode = 'browser' | 'residential' | 'custom' | 'server';
type Provider = 'dataimpulse' | 'iproyal' | 'webshare' | 'generic';

const ENGINES: { id: Engine; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'firecrawl', label: 'Max stealth' },
  { id: 'stealth', label: 'Standard' },
];

const OCR_FORMATS = ['Markdown', 'Plain Text', 'Preserve Layout'];

const PROVIDER_PRESETS: Record<Provider, { label: string; template: string }> = {
  dataimpulse: { label: 'DataImpulse', template: 'http://USERNAME:PASSWORD@gw.dataimpulse.com:823' },
  iproyal: { label: 'IPRoyal', template: 'http://USERNAME:PASSWORD@geo.iproyal.com:12321' },
  webshare: { label: 'Webshare', template: 'http://USERNAME:PASSWORD@p.webshare.io:80' },
  generic: { label: 'Other / generic', template: 'http://USERNAME:PASSWORD@HOST:PORT' },
};

function saveBytes(bytes: BlobPart, mimeType: string, filename: string) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function saveText(text: string, filename: string) {
  saveBytes(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'text/plain', filename);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(bin);
}

/** Fetch an asset directly in the browser (uses the USER's IP). Throws on CORS/errors. */
async function clientFetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer', credentials: 'omit' });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.blob();
}

export default function FableScrape() {
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState<Engine>('auto');
  const [runMode, setRunMode] = useState<RunMode>('single');

  const [include, setInclude] = useState({ images: true, pdfs: true, docs: true, videos: false });
  const [includeIcons, setIncludeIcons] = useState(false);

  const [maxPages, setMaxPages] = useState(5);
  const [maxDepth, setMaxDepth] = useState(1);
  const [sameHostOnly, setSameHostOnly] = useState(true);

  const [routeMode, setRouteMode] = useState<RouteMode>('browser');
  const [provider, setProvider] = useState<Provider>('dataimpulse');
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyStatus, setProxyStatus] = useState<{ available: boolean; rotating: boolean; count: number } | null>(null);
  const [firecrawlAvail, setFirecrawlAvail] = useState(false);
  const [proxyTest, setProxyTest] = useState<{ testing: boolean; ip?: string; error?: string }>({ testing: false });
  const [ackMyIp, setAckMyIp] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [brokenPreviews, setBrokenPreviews] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');

  const [ocrFormat, setOcrFormat] = useState('Markdown');
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/fable-scrape/status')
      .then((r) => r.json())
      .then((d) => {
        setProxyStatus(d.residentialProxy || null);
        setFirecrawlAvail(!!d.firecrawl);
      })
      .catch(() => {});
  }, []);

  const routing = useMemo(
    () => ({ mode: routeMode, proxyUrl: routeMode === 'custom' ? proxyUrl.trim() : undefined }),
    [routeMode, proxyUrl]
  );

  const allSelected = useMemo(
    () => !!result?.images.length && selectedImages.size === result.images.length,
    [result, selectedImages]
  );

  const routingReady =
    routeMode === 'server' ||
    (routeMode === 'browser' && ackMyIp) ||
    (routeMode === 'residential' && !!proxyStatus?.available) ||
    (routeMode === 'custom' && proxyUrl.trim().length > 8);

  const applyProvider = (p: Provider) => {
    setProvider(p);
    if (!proxyUrl.trim() || Object.values(PROVIDER_PRESETS).some((v) => v.template === proxyUrl.trim())) {
      setProxyUrl(PROVIDER_PRESETS[p].template);
    }
  };

  const testProxy = async () => {
    setProxyTest({ testing: true });
    try {
      const res = await fetch('/api/fable-scrape/test-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Proxy test failed.');
      setProxyTest({ testing: false, ip: data.exitIp });
    } catch (err) {
      setProxyTest({ testing: false, error: err instanceof Error ? err.message : 'Proxy test failed.' });
    }
  };

  const handleScan = async () => {
    const target = url.trim();
    if (!target) {
      setError('Enter a URL to scrape.');
      return;
    }
    if (!routingReady) {
      setError(
        routeMode === 'browser'
          ? 'Please acknowledge the My-IP risk note before scanning.'
          : routeMode === 'residential'
            ? 'Residential proxies are not configured on this server. Choose another route.'
            : 'Enter a valid proxy URL for custom routing.'
      );
      return;
    }
    const normalized = /^https?:\/\//i.test(target) ? target : `https://${target}`;
    setError('');
    setResult(null);
    setOcrText('');
    setOcrError('');
    setSelectedImages(new Set());
    setBrokenPreviews(new Set());
    setScanning(true);
    try {
      const endpoint = runMode === 'crawl' ? '/api/fable-scrape/crawl' : '/api/fable-scrape/scan';
      const body: Record<string, unknown> =
        runMode === 'crawl'
          ? { url: normalized, engine, include, includeIcons, routing, maxPages, maxDepth, sameHostOnly }
          : { url: normalized, engine, include, includeIcons, routing };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Scan failed (${res.status}).`);
      setResult(data as ScanResult);
      setSelectedImages(new Set((data.images as Asset[]).map((i) => i.url)));
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

  /** Download one asset: client-side (user IP) in browser mode, else server proxy. */
  const downloadOne = async (assetUrl: string, filename: string) => {
    setDownloadStatus(`Downloading ${filename}…`);
    try {
      if (routeMode === 'browser') {
        const blob = await clientFetchBlob(assetUrl);
        saveBytes(blob, blob.type || 'application/octet-stream', filename);
      } else {
        const res = await fetch('/api/fable-scrape/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: assetUrl, referer: result?.finalUrl, cookies: result?.cookies, routing }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Download failed.');
        saveBytes(base64ToBytes(data.base64), data.mimeType, data.filename || filename);
      }
      setDownloadStatus('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed.';
      setDownloadStatus(
        routeMode === 'browser'
          ? `${filename}: blocked in browser mode (CORS). Switch to residential/custom routing for this file.`
          : `${filename}: ${msg}`
      );
    }
  };

  const downloadList = async (targets: Asset[]) => {
    if (!targets.length) return;
    setDownloadingAll(true);
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      setDownloadStatus(`Downloading ${i + 1} / ${targets.length}: ${targets[i].filename}`);
      try {
        if (routeMode === 'browser') {
          const blob = await clientFetchBlob(targets[i].url);
          saveBytes(blob, blob.type || 'application/octet-stream', targets[i].filename);
          ok += 1;
        } else {
          const res = await fetch('/api/fable-scrape/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targets[i].url, referer: result?.finalUrl, cookies: result?.cookies, routing }),
          });
          const data = await res.json();
          if (res.ok) {
            saveBytes(base64ToBytes(data.base64), data.mimeType, data.filename || targets[i].filename);
            ok += 1;
          }
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        /* continue */
      }
    }
    setDownloadStatus(`Downloaded ${ok} / ${targets.length}.${ok < targets.length && routeMode === 'browser' ? ' Some were blocked by CORS — try residential/custom routing.' : ''}`);
    setDownloadingAll(false);
  };

  const downloadSelectedImages = () => {
    if (!result) return;
    downloadList(result.images.filter((i) => selectedImages.has(i.url)));
  };

  const runOcr = async () => {
    if (!result) return;
    const targets = result.images.filter((i) => selectedImages.has(i.url));
    if (!targets.length) {
      setOcrError('Select at least one image to OCR.');
      return;
    }
    setOcrError('');
    setOcrText('');
    setOcrRunning(true);
    try {
      let text = '';
      if (routeMode === 'browser') {
        // Fetch images with the user's IP, then send base64 to the OCR endpoint.
        const base64Images: string[] = [];
        const failed: string[] = [];
        for (const t of targets.slice(0, 100)) {
          try {
            const blob = await clientFetchBlob(t.url);
            if (!blob.type.startsWith('image/')) continue;
            base64Images.push(await blobToBase64(blob));
          } catch {
            failed.push(t.filename);
          }
        }
        if (!base64Images.length) {
          throw new Error(
            `Could not fetch any images in browser mode (CORS). ${failed.length} blocked — switch routing to residential/custom.`
          );
        }
        const res = await fetch('/api/ocr-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: base64Images, format: ocrFormat }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'OCR failed.');
        text = data.text || '';
      } else {
        const res = await fetch('/api/fable-scrape/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: targets.map((t) => t.url).slice(0, 100),
            referer: result.finalUrl,
            cookies: result.cookies,
            routing,
            format: ocrFormat,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'OCR failed.');
        text = data.text || '';
      }
      setOcrText(text);
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

  const totalAssets =
    (result?.images.length || 0) + (result?.pdfs.length || 0) + (result?.documents.length || 0) + (result?.videos.length || 0);

  return (
    <main className="py-24">
      <SEO
        title="Fable Scrape — Stealth Image, Doc & Video Harvester | AiBhive"
        description="Scrape bot-blocked archives undetected: filter images/PDFs/docs/videos, crawl multiple pages, route through your own IP or rotating residential proxies, and OCR in one pass."
        keywords="stealth web scraper, residential proxy scraper, download images undetected, crawl archive, historical document scraping, OCR"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-10">
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
            Pull images, PDFs, documents, and videos from archives that normally block bots — filter exactly what you
            want, crawl as deep as you choose, route through your own IP or rotating residential proxies, and OCR in one
            pass.
          </p>
          <Link
            to="/fable-scrape/guide"
            className="inline-flex items-center gap-2 mt-5 text-bee-amber font-bold text-sm hover:underline"
          >
            <BookOpen className="w-4 h-4" />
            Read the full user guide
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </header>

        {/* Config card */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl mb-8 space-y-6">
          {/* Run mode + URL */}
          <div>
            <div className="flex gap-2 mb-3">
              {(['single', 'crawl'] as RunMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRunMode(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                    runMode === m
                      ? 'border-bee-amber bg-bee-amber/10 text-bee-amber'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {m === 'single' ? <Globe className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  {m === 'single' ? 'Single page' : 'Crawl site'}
                </button>
              ))}
            </div>
            <label className="block text-slate-300 text-sm font-bold mb-2">
              {runMode === 'crawl' ? 'Start URL' : 'Archive or page URL'}
            </label>
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

          {/* Crawl scope */}
          {runMode === 'crawl' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Max pages (≤40)</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={maxPages}
                  onChange={(e) => setMaxPages(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
                  className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-bee-amber/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Link depth (≤4)</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Math.max(0, Math.min(4, Number(e.target.value) || 0)))}
                  className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-bee-amber/50 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 self-end pb-2 cursor-pointer">
                <input type="checkbox" checked={sameHostOnly} onChange={(e) => setSameHostOnly(e.target.checked)} className="accent-bee-amber w-4 h-4" />
                <span className="text-slate-300 text-sm">Same domain only</span>
              </label>
            </div>
          )}

          {/* Content filters */}
          <div>
            <p className="text-slate-300 text-sm font-bold mb-2">Content to harvest</p>
            <div className="flex flex-wrap gap-2">
              {([
                ['images', 'Images', ImageIcon],
                ['pdfs', 'PDFs', FileType2],
                ['docs', 'Text & docs', FileText],
                ['videos', 'Videos', Video],
              ] as [keyof typeof include, string, typeof ImageIcon][]).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setInclude((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                    include[key]
                      ? 'border-bee-amber bg-bee-amber/10 text-bee-amber'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {include[key] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            {include.images && (
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={includeIcons} onChange={(e) => setIncludeIcons(e.target.checked)} className="accent-bee-amber w-4 h-4" />
                <span className="text-slate-400 text-sm">Include icons &amp; UI sprites (off = content images only)</span>
              </label>
            )}
          </div>

          {/* Stealth engine */}
          <div>
            <p className="text-slate-300 text-sm font-bold mb-2">Stealth engine</p>
            <div className="flex flex-wrap gap-2">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEngine(e.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    engine === e.id
                      ? 'border-bee-amber bg-bee-amber/10 text-bee-amber'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {e.label}
                  {e.id === 'firecrawl' && !firecrawlAvail ? ' (needs key)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* IP routing */}
          <div>
            <p className="text-slate-300 text-sm font-bold mb-2 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-bee-amber" /> IP routing — whose address the site sees
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {([
                ['browser', 'My IP (browser)', 'Free', Wifi],
                ['residential', 'Residential (rotating)', proxyStatus?.available ? 'Ready' : 'Not set up', Server],
                ['custom', 'Custom proxy', 'Your provider', KeyRound],
                ['server', 'Server (host IP)', 'Advanced', Server],
              ] as [RouteMode, string, string, typeof Wifi][]).map(([id, label, tag, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRouteMode(id)}
                  className={`px-3 py-3 rounded-xl text-left border transition-all ${
                    routeMode === id
                      ? 'border-bee-amber bg-bee-amber/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className={`flex items-center gap-2 text-sm font-bold ${routeMode === id ? 'text-bee-amber' : 'text-white'}`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{tag}</span>
                </button>
              ))}
            </div>

            {/* My IP disclaimer */}
            {routeMode === 'browser' && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-amber-300 font-bold flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" /> Using your own IP — please read
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-[13px] text-amber-100/90">
                  <li>The target site can see and log <strong>your</strong> real IP address.</li>
                  <li>Heavy scraping may get <strong>your</strong> IP rate-limited or banned by that site.</li>
                  <li>Activity may be tied to you by your ISP and the target.</li>
                  <li>Only scrape content you're permitted to, and respect each site's terms.</li>
                  <li>Some sites block browser (CORS) downloads — those items are flagged; switch routing for them.</li>
                </ul>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" checked={ackMyIp} onChange={(e) => setAckMyIp(e.target.checked)} className="accent-bee-amber w-4 h-4" />
                  <span className="text-amber-100 text-sm font-medium">I understand the risks of using my own IP.</span>
                </label>
              </div>
            )}

            {routeMode === 'residential' && (
              <p className="mt-3 text-sm text-slate-400">
                {proxyStatus?.available
                  ? `AiBhive residential pool active${proxyStatus.rotating ? ' (rotating IPs)' : ''}. The host IP is never exposed.`
                  : 'No residential pool configured on this server. Set FABLE_SCRAPE_RESIDENTIAL_PROXY, or use Custom proxy / My IP.'}
              </p>
            )}

            {routeMode === 'custom' && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PROVIDER_PRESETS) as Provider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyProvider(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        provider === p ? 'border-bee-amber bg-bee-amber/10 text-bee-amber' : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      {PROVIDER_PRESETS[p].label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="http://USERNAME:PASSWORD@gateway.provider.com:PORT"
                  spellCheck={false}
                  className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2.5 text-white font-mono text-sm placeholder:text-slate-600 focus:border-bee-amber/50 focus:outline-none"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={testProxy}
                    disabled={proxyTest.testing || proxyUrl.trim().length < 8}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 disabled:opacity-40 flex items-center gap-2"
                  >
                    {proxyTest.testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Test connection
                  </button>
                  {proxyTest.ip && (
                    <span className="text-sm text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Exit IP: {proxyTest.ip}
                    </span>
                  )}
                  {proxyTest.error && (
                    <span className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {proxyTest.error}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Works with DataImpulse, IPRoyal, Webshare, and any HTTP(S) residential proxy. Credentials are used for
                  this session only.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full py-4 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {scanning ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                {runMode === 'crawl' ? 'Crawling undetected…' : 'Scanning undetected…'}
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-3" />
                {runMode === 'crawl' ? 'Crawl & Harvest' : 'Scan & Harvest'}
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-8">
            {/* Summary bar */}
            <div className="glass-card p-5 rounded-2xl flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="font-bold text-white truncate max-w-sm">{result.title || result.startUrl || result.finalUrl}</span>
              </span>
              <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-400">
                {result.engine} · {result.routingMode}
              </span>
              {typeof result.pagesVisited === 'number' && (
                <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-bee-amber" /> {result.pagesVisited} pages
                </span>
              )}
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-bee-amber" /> {result.images.length}
              </span>
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <FileType2 className="w-3.5 h-3.5 text-bee-amber" /> {result.pdfs.length}
              </span>
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-bee-amber" /> {result.documents.length}
              </span>
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-bee-amber" /> {result.videos.length}
              </span>
              {result.blocked && (
                <span className="text-xs font-bold text-amber-400 inline-flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> May be challenging — try Max stealth
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

            {result.stoppedReason && (
              <p className="text-xs text-slate-500 -mt-4">Crawl stopped: {result.stoppedReason}.</p>
            )}

            {totalAssets === 0 && !result.text && (
              <div className="glass-card p-10 rounded-2xl text-center text-slate-400">
                Nothing matched your filters on this page. Enable more content types, turn on icons, or try Max stealth.
              </div>
            )}

            {/* Images */}
            {result.images.length > 0 && (
              <section className="glass-card p-6 sm:p-8 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <ImageIcon className="w-5 h-5 mr-3 text-bee-amber" />
                    Images ({selectedImages.size}/{result.images.length} selected)
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={toggleAll} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 flex items-center gap-2">
                      {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                    <button
                      onClick={downloadSelectedImages}
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
                      <div key={img.url} className={`group relative rounded-xl overflow-hidden border transition-all ${isSel ? 'border-bee-amber ring-1 ring-bee-amber/40' : 'border-white/10'}`}>
                        <button type="button" onClick={() => toggleImage(img.url)} className="block w-full aspect-square bg-[#0f1115]">
                          {brokenPreviews.has(img.url) ? (
                            <span className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 px-2">
                              <ImageIcon className="w-8 h-8 opacity-40" />
                              <span className="text-[10px] text-center">{img.ext ? img.ext.toUpperCase() : 'IMG'}</span>
                            </span>
                          ) : (
                            <img
                              src={img.url}
                              alt={img.alt || img.filename}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={() => setBrokenPreviews((prev) => new Set(prev).add(img.url))}
                            />
                          )}
                        </button>
                        <div className="absolute top-2 left-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSel ? 'bg-bee-amber text-bee-black' : 'bg-black/50 text-white'}`}>
                            {isSel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </div>
                        </div>
                        <div className="p-2 bg-black/40">
                          <p className="text-[11px] text-slate-300 truncate" title={img.filename}>{img.filename}</p>
                          <button onClick={() => downloadOne(img.url, img.filename)} className="mt-1 text-[11px] font-bold text-bee-amber inline-flex items-center gap-1 hover:underline">
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
                        <button key={f} onClick={() => setOcrFormat(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${ocrFormat === f ? 'bg-bee-amber text-bee-black' : 'text-slate-400'}`}>
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
                  {ocrText ? ocrText : <span className="text-slate-600">{ocrRunning ? 'Fetching images and running OCR…' : 'Extracted text from the selected images will appear here.'}</span>}
                </div>
                {ocrText && (
                  <div className="mt-4 flex gap-3">
                    <button onClick={copyOcr} className="py-2.5 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy text'}
                    </button>
                    <button onClick={() => saveText(ocrText, 'fable-scrape-ocr.txt')} className="py-2.5 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm">
                      <Download className="w-4 h-4" /> Download .txt
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* PDFs / Documents / Videos */}
            <FileSection title="PDFs" icon={FileType2} items={result.pdfs} onDownload={downloadOne} onDownloadAll={() => downloadList(result.pdfs)} downloadingAll={downloadingAll} />
            <FileSection title="Documents" icon={FileText} items={result.documents} onDownload={downloadOne} onDownloadAll={() => downloadList(result.documents)} downloadingAll={downloadingAll} />
            <FileSection title="Videos" icon={Video} items={result.videos} onDownload={downloadOne} onDownloadAll={() => downloadList(result.videos)} downloadingAll={downloadingAll} note="Videos can be large. My-IP (browser) mode streams straight to your machine." />

            {/* Crawl pages */}
            {result.pages && result.pages.length > 0 && (
              <section className="glass-card p-6 sm:p-8 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center mb-4">
                  <Layers className="w-5 h-5 mr-3 text-bee-amber" />
                  Pages crawled ({result.pages.length})
                </h2>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                  {result.pages.map((p) => (
                    <div key={p.url} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate" title={p.title}>{p.title}</p>
                        <p className="text-slate-500 text-xs truncate">{p.url}</p>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{p.images}i · {p.pdfs}p · {p.documents}d · {p.videos}v</span>
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
                    Page text ({(result.textChars || 0).toLocaleString()} chars)
                  </h2>
                  <button onClick={() => saveText(result.text || '', 'fable-scrape-page.txt')} className="py-2 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 flex items-center gap-2 font-medium text-sm">
                    <Download className="w-4 h-4" /> Download .txt
                  </button>
                </div>
                <div className="bg-[#0f1115]/50 border border-white/10 rounded-xl p-4 max-h-[360px] overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap">
                  {result.text}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function FileSection({
  title,
  icon: Icon,
  items,
  onDownload,
  onDownloadAll,
  downloadingAll,
  note,
}: {
  title: string;
  icon: typeof FileText;
  items: Asset[];
  onDownload: (url: string, filename: string) => void;
  onDownloadAll: () => void;
  downloadingAll: boolean;
  note?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="glass-card p-6 sm:p-8 rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Icon className="w-5 h-5 mr-3 text-bee-amber" />
          {title} ({items.length})
        </h2>
        <button
          onClick={onDownloadAll}
          disabled={downloadingAll}
          className="px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold hover:bg-bee-yellow disabled:opacity-40 flex items-center gap-2"
        >
          {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download all
        </button>
      </div>
      {note && <p className="text-xs text-slate-500 mb-3">{note}</p>}
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.url} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate" title={it.filename}>{it.filename}</p>
              <p className="text-slate-500 text-xs truncate">{it.label || it.url}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400">{it.ext || 'file'}</span>
              <button onClick={() => onDownload(it.url, it.filename)} className="px-3 py-1.5 rounded-lg bg-bee-amber text-bee-black text-xs font-extrabold hover:bg-bee-yellow flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
