import { useState, useRef, ChangeEvent } from 'react';
import { Loader2, Upload } from 'lucide-react';
import styles from '../researchLab.module.css';
import OwrCostGuard from './OwrCostGuard';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import { useResearchLabUser } from '../context/ResearchLabUserContext';
import { adminJson } from '../../../lib/adminApi';

const MAX_FILES = 100;
const EST_COST_PER_IMAGE = 0.06;

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1500;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas error'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export default function OwrOcrBatch() {
  const { appendOutput, setOcrText, setActiveStep } = useOwrWorkflow();
  const user = useResearchLabUser();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [showCostGuard, setShowCostGuard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const estimatedUsd = files.length * EST_COST_PER_IMAGE;

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const added = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...added].slice(0, MAX_FILES));
  }

  async function runOcr(narrow = false) {
    const batch = narrow ? files.slice(0, Math.min(20, files.length)) : files;
    if (!batch.length) {
      setError('Add up to 100 images or document scans.');
      return;
    }
    if (!user) {
      setError('Sign in required.');
      return;
    }
    setShowCostGuard(false);
    setBusy(true);
    setError('');
    setResult('');
    try {
      const images: string[] = [];
      for (const f of batch) {
        images.push(await compressImage(f));
      }
      const data = await adminJson<{ text: string; chargedUsd?: number }>(
        '/api/research-lab/ocr',
        user,
        {
          method: 'POST',
          body: JSON.stringify({ images, format: 'Markdown' }),
        },
      );
      const text = data.text ?? '';
      setResult(text);
      setOcrText(text);
      appendOutput({
        step: 'ocr',
        title: `OCR batch — ${batch.length} image(s)`,
        text,
      });
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
    } finally {
      setBusy(false);
    }
  }

  function startOcr() {
    if (estimatedUsd > 5) {
      setShowCostGuard(true);
      return;
    }
    void runOcr(false);
  }

  return (
    <div className={styles.owrOcrZone}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onFiles}
      />
      <div
        className={styles.owrOcrDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Upload className="mx-auto mb-2 text-cyan-400" size={32} />
        <p className="font-semibold text-white mb-1">Batch OCR — up to {MAX_FILES} images</p>
        <p className="text-sm text-slate-400">
          {files.length} selected · est. {estimatedUsd.toFixed(2)} Hive credits (processing + AI)
        </p>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} onClick={startOcr} disabled={busy}>
            {busy ? <Loader2 className="animate-spin inline w-4 h-4" /> : 'Run OCR batch'}
          </button>
          <button type="button" className={styles.owrBtn} onClick={() => setFiles([])} disabled={busy}>
            Clear
          </button>
        </div>
      )}
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      {result && (
        <pre className="mt-4 p-4 rounded-lg bg-black/40 text-xs text-slate-300 max-h-64 overflow-auto whitespace-pre-wrap">
          {result.slice(0, 8000)}
          {result.length > 8000 ? '\n…' : ''}
        </pre>
      )}
      {showCostGuard && (
        <OwrCostGuard
          estimatedUsd={estimatedUsd}
          onProceed={() => void runOcr(false)}
          onNarrow={() => void runOcr(true)}
          onCancel={() => setShowCostGuard(false)}
        />
      )}
    </div>
  );
}
