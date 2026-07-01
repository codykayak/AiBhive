import { useCallback, useEffect, useRef, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  LogOut,
  ScanText,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider } from '../firebase';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';
import {
  completeHomeworkAssignment,
  copyToClipboard,
  deleteHomeworkDocument,
  listHomeworkDocuments,
  uploadHomeworkDocument,
  viewHomeworkDocument,
  type HomeworkDocument,
} from '../lib/homeworkApi';
import { compressAndIngestImageFiles, type OcrFormat } from '../lib/homeworkOcr';

type Step = 'rag' | 'assign';

const OCR_FORMATS: OcrFormat[] = ['Markdown', 'Plain Text', 'Preserve Layout'];
const MAX_PAGES_PER_BATCH = 100;

export default function Homework() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('rag');

  const [documents, setDocuments] = useState<HomeworkDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrTitle, setOcrTitle] = useState('');
  const [ocrFormat, setOcrFormat] = useState<OcrFormat>('Markdown');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');

  const [pdfBusy, setPdfBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewText, setViewText] = useState('');
  const [viewTitle, setViewTitle] = useState('');

  const [assignmentText, setAssignmentText] = useState('');
  const [completing, setCompleting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerMeta, setAnswerMeta] = useState<{ provider: string; model: string; hadRag: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const assignmentFileRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async (currentUser: User) => {
    setLoadingDocs(true);
    setError(null);
    try {
      const docs = await listHomeworkDocuments(currentUser);
      setDocuments(docs);
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
      if (status === 403) {
        setError('Access denied. Your Google account is not on the allowlist.');
        await signOut(auth);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      }
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoadingAuth(false);
      if (u) loadDocuments(u);
    });
    return () => unsubscribe();
  }, [loadDocuments]);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setDocuments([]);
    setOcrFiles([]);
    setAnswer('');
    setAnswerMeta(null);
  };

  const addOcrFiles = (incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!images.length) {
      setError('Select image files (photos or scans of your pages).');
      return;
    }
    setError(null);
    setOcrFiles((prev) => {
      const merged = [...prev, ...images];
      if (merged.length > MAX_PAGES_PER_BATCH) {
        setError(`Max ${MAX_PAGES_PER_BATCH} pages per OCR batch. Run another batch after this one saves.`);
        return merged.slice(0, MAX_PAGES_PER_BATCH);
      }
      return merged;
    });
  };

  const removeOcrFile = (index: number) => {
    setOcrFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOcrIngest = async () => {
    if (!user || ocrFiles.length === 0) {
      setError('Add at least one page image to OCR.');
      return;
    }
    setOcrBusy(true);
    setOcrProgress(0);
    setError(null);
    try {
      await compressAndIngestImageFiles(user, ocrFiles, {
        format: ocrFormat,
        title: ocrTitle.trim() || undefined,
        onProgress: (pct, label) => {
          setOcrProgress(pct);
          setOcrStatus(label);
        },
      });
      setOcrFiles([]);
      setOcrTitle('');
      setOcrStatus('');
      await loadDocuments(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OCR failed');
    } finally {
      setOcrBusy(false);
      setOcrProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!user) return;
    setPdfBusy(true);
    setError(null);
    try {
      await uploadHomeworkDocument(user, file, file.name);
      await loadDocuments(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPdfBusy(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteHomeworkDocument(user, id);
      await loadDocuments(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const openView = async (id: string) => {
    if (!user) return;
    setViewOpen(true);
    setViewLoading(true);
    setViewText('');
    setViewTitle('');
    try {
      const doc = await viewHomeworkDocument(user, id);
      setViewTitle(doc.title);
      setViewText(doc.text);
    } catch (err: unknown) {
      setViewText(err instanceof Error ? err.message : 'Could not load document');
    } finally {
      setViewLoading(false);
    }
  };

  const handleComplete = async (file?: File) => {
    if (!user) return;
    if (!assignmentText.trim() && !file) {
      setError('Paste assignment text or upload an assignment file.');
      return;
    }
    if (documents.length === 0) {
      setError('Build your RAG library first (Step 1) — upload page images for OCR.');
      return;
    }
    setCompleting(true);
    setError(null);
    setAnswer('');
    setAnswerMeta(null);
    try {
      const result = await completeHomeworkAssignment(user, {
        assignmentText: assignmentText.trim() || undefined,
        file,
      });
      setAnswer(result.text);
      setAnswerMeta({
        provider: result.provider,
        model: result.model,
        hadRag: result.hadRagContext,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Completion failed');
    } finally {
      setCompleting(false);
      if (assignmentFileRef.current) assignmentFileRef.current.value = '';
    }
  };

  const handleCopyAnswer = async () => {
    if (!answer) return;
    await copyToClipboard(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalChars = documents.reduce((sum, d) => sum + (d.chars || 0), 0);
  const totalPages = documents.reduce((sum, d) => sum + (d.pageCount || 0), 0);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-12 h-12 text-bee-amber animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-24 px-4">
        <SEO title="Private Access | AiBhive" description="Authorized access only." noIndex />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 max-w-md w-full rounded-3xl text-center border border-red-500/20"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Restricted Area</h1>
          <p className="text-slate-400 mb-2">This page is private and not indexed.</p>
          <p className="text-slate-500 text-sm mb-8">Sign in with an authorized Google account.</p>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start text-sm text-left">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SEO title="Homework | AiBhive" description="Private RAG workspace." noIndex />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Homework</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Step 1: OCR your reference pages into RAG. Step 2: Grok completes the assignment from that library.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm truncate max-w-[200px]">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => setStep('rag')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors',
            step === 'rag' ? 'bg-bee-amber text-bee-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          )}
        >
          <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold">1</span>
          <ScanText className="w-4 h-4" />
          OCR → RAG library
        </button>
        <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
        <button
          type="button"
          onClick={() => setStep('assign')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors',
            step === 'assign' ? 'bg-bee-amber text-bee-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          )}
        >
          <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold">2</span>
          <Sparkles className="w-4 h-4" />
          Complete assignment
        </button>
        {documents.length > 0 && (
          <span className="text-slate-500 text-xs sm:ml-auto">
            RAG ready: {documents.length} doc{documents.length === 1 ? '' : 's'}
            {totalPages > 0 ? ` · ${totalPages} OCR pages` : ''} · {totalChars.toLocaleString()} chars
          </span>
        )}
      </div>

      {step === 'rag' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-bee-amber/20">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <ScanText className="w-5 h-5 text-bee-amber" />
              Upload page photos for OCR
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Photograph or scan your reference material — up to <strong className="text-slate-300">{MAX_PAGES_PER_BATCH} pages per batch</strong>.
              OCR runs automatically and saves straight into your private RAG library. No copy-paste needed.
              For 200+ pages, run multiple batches.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Batch title (optional) e.g. Chapter 3 notes"
                value={ocrTitle}
                onChange={(e) => setOcrTitle(e.target.value)}
                disabled={ocrBusy}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
              <select
                value={ocrFormat}
                onChange={(e) => setOcrFormat(e.target.value as OcrFormat)}
                disabled={ocrBusy}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm"
              >
                {OCR_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={ocrBusy}
              onChange={(e) => {
                if (e.target.files?.length) addOcrFiles(e.target.files);
              }}
            />

            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !ocrBusy && imageInputRef.current?.click()}
              onClick={() => !ocrBusy && imageInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed border-white/15 rounded-2xl p-8 text-center transition-colors mb-4',
                ocrBusy ? 'opacity-50 cursor-not-allowed' : 'hover:border-bee-amber/40 cursor-pointer'
              )}
            >
              <ImageIcon className="w-10 h-10 text-bee-amber mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Drop page images here or click to browse</p>
              <p className="text-slate-500 text-sm">JPEG, PNG, HEIC — {ocrFiles.length}/{MAX_PAGES_PER_BATCH} selected</p>
            </div>

            {ocrFiles.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto rounded-xl bg-black/20 p-3">
                <ul className="space-y-1 text-sm text-slate-400">
                  {ocrFiles.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {i + 1}. {f.name}
                      </span>
                      <button
                        type="button"
                        disabled={ocrBusy}
                        onClick={() => removeOcrFile(i)}
                        className="text-slate-500 hover:text-red-400 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ocrBusy && (
              <div className="mb-4">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full bg-bee-amber transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                <p className="text-slate-400 text-sm">{ocrStatus || 'Processing…'}</p>
              </div>
            )}

            <button
              type="button"
              disabled={ocrBusy || ocrFiles.length === 0}
              onClick={handleOcrIngest}
              className="w-full py-3.5 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-black font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {ocrBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
              {ocrBusy ? 'OCR in progress…' : `OCR ${ocrFiles.length || ''} page${ocrFiles.length === 1 ? '' : 's'} → save to RAG`}
            </button>
          </div>

          <details className="glass-card rounded-2xl">
            <summary className="p-4 cursor-pointer text-slate-400 text-sm hover:text-white">
              Also have a PDF or text file? (optional)
            </summary>
            <div className="px-4 pb-4">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".txt,.md,.pdf,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
              />
              <button
                type="button"
                disabled={pdfBusy}
                onClick={() => pdfInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-50"
              >
                {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload PDF / TXT
              </button>
            </div>
          </details>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your RAG library</h2>
              {loadingDocs && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
            </div>
            {documents.length === 0 && !loadingDocs ? (
              <p className="text-slate-500 text-sm py-6 text-center">
                No documents yet. Upload page images above — OCR will populate this automatically.
              </p>
            ) : (
              <ul className="space-y-2 mb-6">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-black/20 border border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate flex items-center gap-2">
                        {doc.source === 'ocr' && <ScanText className="w-3.5 h-3.5 text-bee-amber shrink-0" />}
                        {doc.title}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {doc.pageCount ? `${doc.pageCount} pages · ` : ''}
                        {doc.chars.toLocaleString()} chars
                        {doc.source === 'ocr' ? ' · OCR' : doc.originalFilename ? ` · ${doc.originalFilename}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => openView(doc.id)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === doc.id}
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 disabled:opacity-50"
                      >
                        {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={documents.length === 0}
              onClick={() => setStep('assign')}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Continue to assignment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'assign' && (
        <div className="space-y-6">
          <div className="glass-card p-4 rounded-2xl bg-bee-amber/5 border border-bee-amber/20">
            <p className="text-slate-300 text-sm">
              <FileText className="w-4 h-4 inline mr-2 text-bee-amber" />
              Grok will pull from your RAG library automatically —{' '}
              <strong className="text-white">
                {documents.length} document{documents.length === 1 ? '' : 's'}
                {totalPages > 0 ? `, ${totalPages} OCR pages` : ''}, {totalChars.toLocaleString()} characters
              </strong>
              . You only need to provide the assignment below.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-bee-amber" />
              Your assignment
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Paste the homework questions or upload a short assignment file. Reference material stays in the system.
            </p>
            <textarea
              placeholder="Paste assignment questions here…"
              value={assignmentText}
              onChange={(e) => setAssignmentText(e.target.value)}
              rows={8}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 text-sm resize-y"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={completing || documents.length === 0}
                onClick={() => handleComplete()}
                className="px-6 py-3 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-black font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {completing ? 'Working…' : 'Complete with Grok'}
              </button>
              <input
                ref={assignmentFileRef}
                type="file"
                accept=".txt,.md,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleComplete(file);
                }}
              />
              <button
                type="button"
                disabled={completing || documents.length === 0}
                onClick={() => assignmentFileRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload assignment file
              </button>
            </div>
          </div>

          {answer && (
            <div className="glass-card p-6 rounded-2xl border border-bee-amber/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Answer</h2>
                  {answerMeta && (
                    <p className="text-slate-500 text-xs mt-1">
                      {answerMeta.provider} / {answerMeta.model}
                      {answerMeta.hadRag ? ' · grounded in your RAG library' : ''}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopyAnswer}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-200 leading-relaxed">
                {answer}
              </div>
            </div>
          )}
        </div>
      )}

      {viewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-3xl max-h-[80vh] rounded-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-white font-semibold truncate pr-4">{viewTitle || 'Document'}</h3>
              <button type="button" onClick={() => setViewOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {viewLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-bee-amber" />
                </div>
              ) : (
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{viewText}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
