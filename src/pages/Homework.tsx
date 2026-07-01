import { useCallback, useEffect, useRef, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  BookOpen,
  Copy,
  Check,
  FileText,
  Loader2,
  Lock,
  LogOut,
  Sparkles,
  Trash2,
  Upload,
  Eye,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider } from '../firebase';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';
import {
  addHomeworkTextDocument,
  completeHomeworkAssignment,
  copyToClipboard,
  deleteHomeworkDocument,
  listHomeworkDocuments,
  uploadHomeworkDocument,
  viewHomeworkDocument,
  type HomeworkDocument,
} from '../lib/homeworkApi';

type Tab = 'library' | 'assignments';

export default function Homework() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('library');

  const [documents, setDocuments] = useState<HomeworkDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteBusy, setPasteBusy] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setAnswer('');
    setAnswerMeta(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploadBusy(true);
    setError(null);
    try {
      await uploadHomeworkDocument(user, file, docTitle.trim() || file.name);
      setDocTitle('');
      await loadDocuments(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasteSubmit = async () => {
    if (!user || !pasteTitle.trim() || !pasteText.trim()) {
      setError('Title and text are required.');
      return;
    }
    setPasteBusy(true);
    setError(null);
    try {
      await addHomeworkTextDocument(user, pasteTitle.trim(), pasteText.trim());
      setPasteTitle('');
      setPasteText('');
      await loadDocuments(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save text');
    } finally {
      setPasteBusy(false);
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
        <SEO
          title="Private Access | AiBhive"
          description="Authorized access only."
          noIndex
        />
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
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center shadow-lg"
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
            <span className="text-xs uppercase tracking-wider text-red-400/80 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
              Private
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            RAG reference library + Grok-powered assignment completion. Not public. Not indexed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm truncate max-w-[200px]">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
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

      <div className="flex gap-2 mb-8">
        {(
          [
            { id: 'library' as Tab, label: 'Reference Library', icon: BookOpen },
            { id: 'assignments' as Tab, label: 'Complete Assignment', icon: Sparkles },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-bee-amber text-bee-black'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-bee-amber" />
                Upload document
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Upload OCR&apos;d text files or PDFs to build your private RAG corpus.
              </p>
              <input
                type="text"
                placeholder="Document title (optional)"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full mb-3 px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <button
                type="button"
                disabled={uploadBusy}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl bg-bee-amber/90 hover:bg-bee-amber text-bee-black font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadBusy ? 'Uploading…' : 'Choose file'}
              </button>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-bee-amber" />
                Paste text
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Paste OCR output directly if you already have plain text.
              </p>
              <input
                type="text"
                placeholder="Document title"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                className="w-full mb-3 px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
              <textarea
                placeholder="Paste document text here…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={4}
                className="w-full mb-3 px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 text-sm resize-y"
              />
              <button
                type="button"
                disabled={pasteBusy}
                onClick={handlePasteSubmit}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pasteBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {pasteBusy ? 'Saving…' : 'Add to library'}
              </button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                RAG corpus ({documents.length} documents, {totalChars.toLocaleString()} chars)
              </h2>
              {loadingDocs && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
            </div>

            {documents.length === 0 && !loadingDocs ? (
              <p className="text-slate-500 text-sm py-8 text-center">
                No reference documents yet. Upload your OCR&apos;d materials above.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-black/20 border border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{doc.title}</p>
                      <p className="text-slate-500 text-xs">
                        {doc.chars.toLocaleString()} chars
                        {doc.originalFilename ? ` · ${doc.originalFilename}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openView(doc.id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === doc.id}
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-bee-amber" />
              Assignment
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Paste or upload your assignment. Grok will answer using your reference library (
              {documents.length} docs, {totalChars.toLocaleString()} chars).
            </p>
            <textarea
              placeholder="Paste assignment questions or instructions here…"
              value={assignmentText}
              onChange={(e) => setAssignmentText(e.target.value)}
              rows={8}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 text-sm resize-y"
            />
            <div className="flex flex-wrap gap-3">
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
                disabled={completing}
                onClick={() => handleComplete()}
                className="px-6 py-3 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-black font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {completing ? 'Working…' : 'Complete with Grok'}
              </button>
              <button
                type="button"
                disabled={completing}
                onClick={() => assignmentFileRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
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
                      {answerMeta.hadRag ? ' · grounded in RAG corpus' : ' · no RAG corpus used'}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopyAnswer}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm transition-colors"
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
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
              >
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
