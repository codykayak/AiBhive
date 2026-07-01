import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  LogOut,
  GraduationCap,
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
  HomeworkPaymentRequiredError,
  listHomeworkDocuments,
  uploadHomeworkDocument,
  viewHomeworkDocument,
  type HomeworkDocument,
} from '../lib/homeworkApi';
import { compressAndIngestImageFiles, type OcrFormat } from '../lib/homeworkOcr';
import { downloadRagLibrary, type RagExportFormat } from '../lib/homeworkExport';
import WebPlansStrip from '../components/app/WebPlansStrip';

type Step = 'rag' | 'assign';
export type HomeworkVariant = 'admin' | 'public';

const OCR_FORMATS: OcrFormat[] = ['Markdown', 'Plain Text', 'Preserve Layout'];
const EXPORT_FORMATS: { id: RagExportFormat; label: string }[] = [
  { id: 'txt', label: 'TXT' },
  { id: 'md', label: 'Markdown' },
  { id: 'pdf', label: 'PDF' },
];
const MAX_PAGES_PER_BATCH = 100;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i;

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return IMAGE_EXTENSIONS.test(file.name);
}

async function collectImageFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const collected: File[] = [];

  const traverseEntry = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File | null>((resolve) => {
        (entry as FileSystemFileEntry).file(resolve, () => resolve(null));
      });
      if (file && isImageFile(file)) collected.push(file);
      return;
    }
    if (!entry.isDirectory) return;

    const reader = (entry as FileSystemDirectoryEntry).createReader();
    await new Promise<void>((resolve) => {
      const readBatch = () => {
        reader.readEntries(
          async (entries) => {
            if (!entries.length) {
              resolve();
              return;
            }
            await Promise.all(entries.map(traverseEntry));
            readBatch();
          },
          () => resolve()
        );
      };
      readBatch();
    });
  };

  const items = dataTransfer.items;
  if (items?.length) {
    const entries = Array.from(items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.webkitGetAsEntry())
      .filter((entry): entry is FileSystemEntry => entry !== null);

    if (entries.length) {
      await Promise.all(entries.map(traverseEntry));
      if (collected.length) return collected;
    }
  }

  return Array.from(dataTransfer.files).filter(isImageFile);
}

export function HomeworkWorkspace({ variant = 'admin' }: { variant?: HomeworkVariant }) {
  const isPublic = variant === 'public';
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
  const [exportBusy, setExportBusy] = useState(false);
  const [exportFormat, setExportFormat] = useState<RagExportFormat>('txt');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewText, setViewText] = useState('');
  const [viewTitle, setViewTitle] = useState('');

  const [assignmentText, setAssignmentText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [completing, setCompleting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerMeta, setAnswerMeta] = useState<{ provider: string; model: string; hadRag: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const assignmentFileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const verifyAdminAccess = useCallback(async (currentUser: User) => {
    const token = await currentUser.getIdToken();
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403) {
      setError('Access denied. Your Google account is not on the allowlist.');
      await signOut(auth);
      return false;
    }
    return res.ok;
  }, []);

  const formatError = (err: unknown, fallback: string) => {
    if (err instanceof HomeworkPaymentRequiredError) return err.message;
    return err instanceof Error ? err.message : fallback;
  };

  const loadDocuments = useCallback(async (currentUser: User) => {
    setLoadingDocs(true);
    setError(null);
    try {
      const docs = await listHomeworkDocuments(currentUser);
      setDocuments(docs);
    } catch (err: unknown) {
      setError(formatError(err, 'Failed to load documents'));
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setLoadingAuth(false);
      if (!u) return;
      if (!isPublic) {
        const allowed = await verifyAdminAccess(u);
        if (!allowed) return;
      }
      loadDocuments(u);
    });
    return () => unsubscribe();
  }, [isPublic, loadDocuments, verifyAdminAccess]);

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

  const addOcrFiles = useCallback((incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter(isImageFile);
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
  }, []);

  const handleImageInputChange = (fileList: FileList | null) => {
    if (fileList?.length) addOcrFiles(fileList);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFolderInputChange = (fileList: FileList | null) => {
    if (fileList?.length) addOcrFiles(fileList);
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (ocrBusy) return;
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragActive(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setDragActive(false);
    if (ocrBusy) return;
    const images = await collectImageFilesFromDataTransfer(e.dataTransfer);
    if (images.length) addOcrFiles(images);
    else setError('Drop image files or a folder of page photos.');
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
      setError(formatError(err, 'OCR failed'));
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
      setError(formatError(err, 'Upload failed'));
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

  const handleExportLibrary = async () => {
    if (!user || documents.length === 0) return;
    setExportBusy(true);
    setError(null);
    try {
      await downloadRagLibrary(user, exportFormat);
    } catch (err: unknown) {
      setError(formatError(err, 'Export failed'));
    } finally {
      setExportBusy(false);
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
        customPrompt: customPrompt.trim() || undefined,
      });
      setAnswer(result.text);
      setAnswerMeta({
        provider: result.provider,
        model: result.model,
        hadRag: result.hadRagContext,
      });
    } catch (err: unknown) {
      setError(formatError(err, 'Completion failed'));
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
      <div className={`${isPublic ? 'py-10' : 'min-h-[80vh]'} flex items-center justify-center py-24 px-4`}>
        <SEO
          title={isPublic ? 'Homework Bot | AiBhive Apps' : 'Private Access | AiBhive'}
          description={
            isPublic
              ? 'Upload reference pages, build a private RAG library, and complete assignments with Grok.'
              : 'Authorized access only.'
          }
          noIndex={!isPublic}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'glass-card p-10 max-w-md w-full rounded-3xl text-center',
            isPublic ? 'border border-bee-amber/20' : 'border border-red-500/20'
          )}
        >
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
              isPublic ? 'bg-bee-amber/10' : 'bg-red-500/10'
            )}
          >
            {isPublic ? (
              <GraduationCap className="w-10 h-10 text-bee-amber" />
            ) : (
              <Lock className="w-10 h-10 text-red-400" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isPublic ? 'Homework Bot' : 'Restricted Area'}
          </h1>
          <p className="text-slate-400 mb-2">
            {isPublic
              ? 'Sign in to build your private reference library and complete assignments.'
              : 'This page is private and not indexed.'}
          </p>
          <p className="text-slate-500 text-sm mb-8">
            {isPublic
              ? 'OCR and Grok completion use Hive credits. Your RAG files are private to your account.'
              : 'Sign in with an authorized Google account.'}
          </p>
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
      <SEO
        title={isPublic ? 'Homework Bot | AiBhive Apps' : 'Homework | AiBhive'}
        description={
          isPublic
            ? 'OCR your reference pages into a private RAG library, then complete assignments with Grok.'
            : 'Private RAG workspace.'
        }
        noIndex={!isPublic}
      />

      {isPublic && (
        <div className="mb-8">
          <WebPlansStrip />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                'p-2 rounded-xl border',
                isPublic ? 'bg-bee-amber/10 border-bee-amber/20' : 'bg-red-500/10 border-red-500/20'
              )}
            >
              {isPublic ? (
                <GraduationCap className="w-5 h-5 text-bee-amber" />
              ) : (
                <Lock className="w-5 h-5 text-red-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">{isPublic ? 'Homework Bot' : 'Homework'}</h1>
          </div>
          <p className="text-slate-400 text-sm">
            {isPublic
              ? 'Your reference library is private to your account. OCR and completion use Hive credits.'
              : 'Step 1: OCR your reference pages into RAG. Step 2: Grok completes the assignment from that library.'}
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
              Photograph or scan your reference material — upload <strong className="text-slate-300">10–50 pages at a time</strong> (auto-batched).
              Larger sets are split, OCR&apos;d, and saved to RAG automatically. No copy-paste.
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

            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !ocrBusy && imageInputRef.current?.click()}
              onClick={() => !ocrBusy && imageInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-colors mb-4',
                ocrBusy && 'opacity-50 cursor-not-allowed',
                !ocrBusy && 'cursor-pointer',
                dragActive
                  ? 'border-bee-amber bg-bee-amber/10'
                  : 'border-white/15 hover:border-bee-amber/40'
              )}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                disabled={ocrBusy}
                onChange={(e) => handleImageInputChange(e.target.files)}
                onClick={(e) => e.stopPropagation()}
              />
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is supported in Chromium/Safari
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                disabled={ocrBusy}
                onChange={(e) => handleFolderInputChange(e.target.files)}
              />
              <ImageIcon className="w-10 h-10 text-bee-amber mx-auto mb-3" />
              <p className="text-white font-medium mb-1">
                {dragActive ? 'Drop to add pages' : 'Drop page images here or click to browse'}
              </p>
              <p className="text-slate-500 text-sm mb-4">
                Select many at once in the file picker (Shift/Cmd+click) — JPEG, PNG, HEIC
              </p>
              <p className="text-slate-500 text-xs">
                {ocrFiles.length} selected · max {MAX_PAGES_PER_BATCH} per OCR run
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                disabled={ocrBusy}
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Add more pages
              </button>
              <button
                type="button"
                disabled={ocrBusy}
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                Select folder
              </button>
              {ocrFiles.length > 0 && (
                <button
                  type="button"
                  disabled={ocrBusy}
                  onClick={() => setOcrFiles([])}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all ({ocrFiles.length})
                </button>
              )}
            </div>

            {ocrFiles.length > 0 && (
              <div className="mb-4 max-h-48 overflow-y-auto rounded-xl bg-black/20 p-3">
                <ul className="space-y-1 text-sm text-slate-400">
                  {ocrFiles.map((f, i) => (
                    <li key={`${f.name}-${f.size}-${i}`} className="flex items-center justify-between gap-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Your RAG library</h2>
                {loadingDocs && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
              </div>
              {documents.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as RagExportFormat)}
                    disabled={exportBusy}
                    className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm"
                    aria-label="Export format"
                  >
                    {EXPORT_FORMATS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={exportBusy || documents.length === 0}
                    onClick={handleExportLibrary}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bee-amber/15 hover:bg-bee-amber/25 border border-bee-amber/30 text-bee-amber text-sm font-medium disabled:opacity-50"
                  >
                    {exportBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Download all
                  </button>
                </div>
              )}
            </div>
            {documents.length > 0 && (
              <p className="text-slate-500 text-xs mb-4">
                Export combines every document in your library into one file ({totalChars.toLocaleString()} chars
                {totalPages > 0 ? ` · ${totalPages} OCR pages` : ''}).
              </p>
            )}
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Custom instructions for Grok <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="e.g. Write in first person, keep answers under 200 words each, use APA citations, sound like a college sophomore, focus on chapter 3 themes…"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 text-sm resize-y"
            />
            <label className="block text-sm font-medium text-slate-300 mb-2">Assignment</label>
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

export default function Homework() {
  return <HomeworkWorkspace variant="admin" />;
}
