import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import {
  Camera,
  Loader2,
  ScanLine,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { auth, googleProvider } from '../../firebase';
import styles from './dmtMatrixDecoder.module.css';
import catalogData from '../../data/dmtSymbolCatalog.json';

interface CatalogSymbol {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  filename: string;
}

interface Detection {
  symbolId: string;
  tokenId?: string | null;
  name: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  method?: string;
  source?: string;
  description?: string;
  catalogDescription?: string;
  normalized?: { x: number; y: number; width: number; height: number };
}

interface DecodeResult {
  sessionId: string;
  merged: Detection[];
  cvDetections: Detection[];
  structuralMatches?: Detection[];
  syntax?: {
    tokenSequence?: string[];
    shannonEntropy?: number;
    bigramMatrix?: Record<string, Record<string, number>>;
    spatialGraph?: { layoutType?: string; nodeCount?: number; edgeCount?: number };
  };
  vision?: {
    summary?: string;
    matrixStructure?: string;
    decodeNotes?: string;
    researchFlags?: string[];
    symbols?: Detection[];
  };
  visionError?: string;
  workerError?: string;
  chargedUsd?: number;
}

const FALLBACK_DECODE_COST = 0.02;

async function compressImage(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1600;
        let { width, height } = img;
        if (width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg',
          previewUrl: dataUrl,
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export default function DmtMatrixDecoderPage() {
  const [user, setUser] = useState(auth.currentUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [notes, setNotes] = useState('');
  const [visionProvider, setVisionProvider] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(FALLBACK_DECODE_COST);

  const catalog = (catalogData as { symbols: CatalogSymbol[] }).symbols || [];
  const catalogById = useMemo(
    () => Object.fromEntries(catalog.map((s) => [s.id, s])),
    [catalog],
  );

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setEstimatedCost(FALLBACK_DECODE_COST);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/research-lab/estimate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'dmt-decode' }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setEstimatedCost(Number(data.estimatedCredits) || FALLBACK_DECODE_COST);
        }
      } catch {
        /* fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const drawOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !result?.merged?.length) return;
    const rect = img.getBoundingClientRect();
    const natW = img.naturalWidth || 1;
    const natH = img.naturalHeight || 1;
    const scaleX = rect.width / natW;
    const scaleY = rect.height / natH;

    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const det of result.merged) {
      const nx = det.normalized?.x ?? det.x / natW;
      const ny = det.normalized?.y ?? det.y / natH;
      const nw = det.normalized?.width ?? det.width / natW;
      const nh = det.normalized?.height ?? det.height / natH;
      const x = (det.normalized ? nx * natW : det.x) * scaleX;
      const y = (det.normalized ? ny * natH : det.y) * scaleY;
      const w = (det.normalized ? nw * natW : det.width) * scaleX;
      const h = (det.normalized ? nh * natH : det.height) * scaleY;

      ctx.strokeStyle = det.source === 'vision' ? '#e879f9' : '#22d3ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, Math.max(w, 12), Math.max(h, 12));
      ctx.fillStyle = det.source === 'vision' ? 'rgba(232,121,249,0.15)' : 'rgba(34,211,238,0.12)';
      ctx.fillRect(x, y, Math.max(w, 12), Math.max(h, 12));
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText(det.name.slice(0, 14), x + 2, y + 12);
    }
  }, [result]);

  useEffect(() => {
    drawOverlays();
    window.addEventListener('resize', drawOverlays);
    return () => window.removeEventListener('resize', drawOverlays);
  }, [drawOverlays, previewUrl]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    setError('');
    setResult(null);
    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed.previewUrl);
      setImageBase64(compressed.base64);
      setMimeType(compressed.mimeType);
    } catch {
      setError('Could not read that image.');
    }
  }

  async function signIn() {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }

  async function runDecode() {
    if (!imageBase64) {
      setError('Upload or capture a laser matrix photo first.');
      return;
    }
    if (!user) {
      setError('Sign in to decode and save results.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/research-lab/dmt-matrix/decode', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          visionProvider,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Decode failed.');
      setResult(data as DecodeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decode failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.dmt}>
      <SEO
        title="DMT Matrix Decoder — 650nm Laser Glyph AI | AiBhive Research Lab"
        description="Pioneer AI decoder for DMT laser diffraction symbols. Upload matrix photos, match against the DMT Code 100×100 glyph catalogue, and fuse CV + Gemini/Grok vision."
        keywords="DMT matrix decoder, laser code, 650nm, glyph classifier, DMT Code, visual symbols, AiBhive Research Lab"
        image="/rl-hero-historical-ancient.png"
      />

      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Research Lab · Pioneer Tool</p>
          <h1 className={styles.title}>DMT Matrix Decoder</h1>
          <p className={styles.lead}>
            Decode the laser diffraction glyph matrix — CV classifier + Gemini/Grok vision fused against
            the DMT Code 100×100 catalogue.
          </p>
        </header>

        <div className={styles.pioneer}>
          <Sparkles className={styles.pioneerIcon} size={18} aria-hidden />
          <span>
            First known AI stack built to decode reported DMT laser symbols. Upload a photo, get positioned
            glyph matches, and store sessions in Firebase for research.
          </span>
        </div>

        {!user && (
          <div className={styles.signInBanner}>
            <button type="button" onClick={() => void signIn()} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}>
              Sign in with Google
            </button>{' '}
            to decode and save results (~{estimatedCost.toFixed(2)} Hive credits per photo). Or{' '}
            <Link to="/research-lab/workspace">open Research Lab workspace</Link>.
          </div>
        )}

        <div className={styles.uploadCard}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={onFile}
          />

          {previewUrl ? (
            <div className={styles.previewWrap}>
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Uploaded laser matrix"
                className={styles.previewImg}
                onLoad={drawOverlays}
              />
              <canvas ref={canvasRef} className={styles.overlayCanvas} aria-hidden />
            </div>
          ) : (
            <button
              type="button"
              className={styles.dropzone}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className={styles.dropzoneIcon} aria-hidden />
              <span className={styles.dropzoneText}>Tap to capture or upload</span>
              <span className={styles.dropzoneHint}>650nm laser diffraction · matrix photos · sketches</span>
            </button>
          )}

          <div className={styles.controls}>
            <textarea
              className={styles.textarea}
              placeholder="Session notes — surface, dose context, what you saw…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            <select
              className={styles.select}
              value={visionProvider}
              onChange={(e) => setVisionProvider(e.target.value)}
              aria-label="Vision provider"
            >
              <option value="auto">Vision: Auto (Gemini → Grok)</option>
              <option value="gemini">Vision: Gemini</option>
              <option value="grok">Vision: Grok</option>
            </select>
            <div className={styles.row}>
              {previewUrl && (
                <button type="button" className={styles.btnGhost} onClick={() => inputRef.current?.click()}>
                  <Upload size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden />
                  Replace
                </button>
              )}
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={busy || !imageBase64}
                onClick={() => void runDecode()}
              >
                {busy ? (
                  <>
                    <Loader2 size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} className="spin" aria-hidden />
                    Decoding…
                  </>
                ) : (
                  <>
                    <ScanLine size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden />
                    Decode matrix
                  </>
                )}
              </button>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </div>
        </div>

        {result && (
          <>
            <section className={styles.section} aria-label="Decode summary">
              <h2 className={styles.sectionTitle}>Analysis</h2>
              <div className={styles.summaryCard}>
                {result.vision?.summary || 'CV classifier completed.'}
                {result.vision?.matrixStructure && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--dmt-muted)' }}>
                    Structure: <strong>{result.vision.matrixStructure}</strong>
                  </p>
                )}
                {result.vision?.decodeNotes && (
                  <p style={{ marginTop: '0.5rem' }}>{result.vision.decodeNotes}</p>
                )}
                {result.workerError && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--dmt-amber)' }}>
                    CV worker offline — vision-only mode. ({result.workerError})
                  </p>
                )}
                {result.syntax?.shannonEntropy != null && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--dmt-cyan)' }}>
                    Token entropy: <strong>{result.syntax.shannonEntropy.toFixed(3)} bits</strong>
                    {result.syntax.spatialGraph?.layoutType && (
                      <> · layout: <strong>{result.syntax.spatialGraph.layoutType}</strong></>
                    )}
                  </p>
                )}
              </div>
            </section>

            {result.syntax?.tokenSequence?.length ? (
              <section className={styles.section} aria-label="Token sequence">
                <h2 className={styles.sectionTitle}>Token sequence</h2>
                <div className={styles.summaryCard}>
                  {result.syntax.tokenSequence.join(' → ')}
                </div>
              </section>
            ) : null}

            <section className={styles.section} aria-label="Detected symbols">
              <h2 className={styles.sectionTitle}>
                Detected symbols ({result.merged?.length || 0})
              </h2>
              <ul className={styles.detectionList}>
                {(result.merged || []).map((det, i) => {
                  const meta = catalogById[det.symbolId];
                  return (
                    <li key={`${det.symbolId}-${i}`} className={styles.detectionItem}>
                      {meta ? (
                        <img
                          src={`/dmt-symbols/${meta.filename}`}
                          alt=""
                          className={styles.glyphThumb}
                        />
                      ) : (
                        <div className={styles.glyphThumb} />
                      )}
                      <div>
                        <div className={styles.detName}>{det.name}</div>
                        <div className={styles.detMeta}>
                          {det.tokenId && <span>{det.tokenId} · </span>}
                          {det.symbolId} · {det.method || det.source || 'fused'}
                          {det.catalogDescription && ` — ${det.catalogDescription.slice(0, 60)}`}
                        </div>
                      </div>
                      <span className={styles.confBadge}>
                        {Math.round((det.confidence || 0) * 100)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {!!result.vision?.researchFlags?.length && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Research flags</h2>
                <ul className={styles.detectionList}>
                  {result.vision.researchFlags.map((flag) => (
                    <li key={flag} className={styles.summaryCard}>
                      <Zap size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden />
                      {flag}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <section className={styles.section} aria-label="Glyph catalogue">
          <h2 className={styles.sectionTitle}>Catalogue ({catalog.length} glyphs)</h2>
          <div className={styles.catalogGrid}>
            {catalog.map((sym) => (
              <div key={sym.id}>
                <div className={styles.catalogItem}>
                  <img src={`/dmt-symbols/${sym.filename}`} alt={sym.name} loading="lazy" />
                </div>
                <div className={styles.catalogLabel}>{sym.name}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {previewUrl && (
        <div className={styles.stickyBar}>
          <div className={styles.stickyInner}>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={busy || !imageBase64 || !user}
              onClick={() => void runDecode()}
            >
              {busy ? 'Decoding…' : `Decode · ~${estimatedCost.toFixed(2)} credits`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
