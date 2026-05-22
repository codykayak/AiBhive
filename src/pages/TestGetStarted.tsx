import { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  CreditCard,
  Mic2,
} from 'lucide-react';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { db, storage, auth } from '../firebase';
import { SEO } from '../components/SEO';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi',
  'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Arabic',
  'Italian', 'Korean', 'Turkish', 'Dutch', 'Polish',
  'Indonesian', 'Vietnamese', 'Thai', 'Swedish', 'Greek',
];

type FileKind = 'text' | 'audio';

const TEXT_RATES = {
  transcribeTranslate: 0.025,
  legalMedical: 0.035,
  voiceCloning: 0.035,
};

const AUDIO_RATES = {
  transcribeTranslate: 2.49,
  legalMedical: 3.29,
  voiceCloning: 1.99,
};

type ServiceKey = keyof typeof TEXT_RATES;

const SERVICE_LABELS: Record<ServiceKey, string> = {
  transcribeTranslate: 'Transcribe + Translate',
  legalMedical: 'Legal & Medical (Highest Accuracy)',
  voiceCloning: 'Voice Cloning',
};

function detectFileKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('audio') || file.type.startsWith('video')) return 'audio';
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.mp4') || name.endsWith('.mov')) {
    return 'audio';
  }
  return 'text';
}

async function measureFile(file: File, kind: FileKind): Promise<{ words: number; minutes: number }> {
  if (kind === 'text') {
    try {
      const text = await file.text();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      return { words: Math.max(1, words || 250), minutes: 0 };
    } catch {
      return { words: 250, minutes: 0 };
    }
  }

  return new Promise((resolve) => {
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
      const minutes = Math.max(1, Math.ceil(audio.duration / 60));
      resolve({ words: 0, minutes });
    };
    audio.onerror = () => resolve({ words: 0, minutes: 1 });
  });
}

export default function GetStarted() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [words, setWords] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [cloningText, setCloningText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [services, setServices] = useState<Record<ServiceKey, boolean>>({
    transcribeTranslate: false,
    legalMedical: false,
    voiceCloning: false,
  });
  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState('Spanish');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, isVoiceSample = false) => {
    if (!e.target.files?.length) return;

    if (isVoiceSample) {
      setVoiceSample(e.target.files[0]);
      return;
    }

    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);

    let totalWords = words;
    let totalMinutes = minutes;
    let currentKind = fileKind;

    for (const file of newFiles as File[]) {
        const kind = detectFileKind(file);
        currentKind = kind;
        const { words: w, minutes: m } = await measureFile(file, kind);
        totalWords += w;
        totalMinutes += m;
    }

    setFileKind(currentKind);
    setWords(totalWords);
    setMinutes(totalMinutes);
  };

  const lineItems: { label: string; amount: number }[] = [];
  if (files.length > 0 && fileKind) {
    const rates = fileKind === 'text' ? TEXT_RATES : AUDIO_RATES;
    const unit = fileKind === 'text' ? words : minutes;
    (Object.keys(rates) as ServiceKey[]).forEach((key) => {
      if (services[key]) {
        lineItems.push({ label: SERVICE_LABELS[key], amount: unit * rates[key] });
      }
    });
  }
  let calculatedTotal = lineItems.reduce((sum, l) => sum + l.amount, 0);
  if (calculatedTotal > 0 && calculatedTotal < 0.50) {
    lineItems.push({ label: 'Minimum Order Fee', amount: 0.50 - calculatedTotal });
    calculatedTotal = 0.50;
  }
  const total = Number(calculatedTotal.toFixed(2));

  const canSubmit =
    files.length > 0 &&
    !!fileKind &&
    Object.values(services).some(Boolean) &&
    email.includes('@') &&
    total > 0 &&
    !submitting &&
    (!services.voiceCloning || voiceSample !== null);

  const handleSubmit = async () => {
    console.log('[Checkout] Submit clicked', { fileKind, words, minutes, services, total, email });
    setError(null);

    if (files.length === 0 || !fileKind) {
      setError('Please upload a file.');
      return;
    }
    if (!Object.values(services).some(Boolean)) {
      setError('Please select at least one service.');
      return;
    }
    if (services.voiceCloning && !voiceSample) {
      setError('Please upload a voice sample for cloning.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (total <= 0) {
      setError('Please select a service to calculate a price.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    try {
      console.log('[Checkout] Step 1/3 — signing in anonymously');
      let uid: string;
      try {
        const cred = auth.currentUser ?? (await signInAnonymously(auth)).user;
        uid = cred.uid;
      } catch (authErr: any) {
        console.warn(
          '[Checkout] Anonymous sign-in unavailable, falling back to anon session id:',
          authErr?.code || authErr?.message,
        );
        uid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      }

      console.log('[Checkout] Step 2/3 — uploading file to Storage');

      let vsUrl = null;
      if (voiceSample) {
        try {
          const vsRef = ref(storage, `leads/${uid}/sample_${Date.now()}_${voiceSample.name}`);
          const vsUpload = await uploadBytesResumable(vsRef, voiceSample);
          vsUrl = await getDownloadURL(vsUpload.ref);
        } catch (vsErr) {
          console.error('Voice sample upload failed:', vsErr);
          setError('Voice sample upload failed. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      const fileUrls: string[] = [];
      let totalBytes = files.reduce((acc, f) => acc + f.size, 0);
      let bytesTransferredArray = new Array(files.length).fill(0);

      try {
          await Promise.all(files.map(async (fileObj, index) => {
            const fileRef = ref(storage, `leads/${uid}/${Date.now()}_${fileObj.name}`);
            const uploadTask = uploadBytesResumable(fileRef, fileObj);

            return new Promise<void>((resolve, reject) => {
              uploadTask.on('state_changed',
                (snapshot) => {
                  bytesTransferredArray[index] = snapshot.bytesTransferred;
                  const currentTotalTransferred = bytesTransferredArray.reduce((acc, bytes) => acc + bytes, 0);
                  const progress = (currentTotalTransferred / totalBytes) * 100;
                  setUploadProgress(Math.min(100, Math.max(0, progress)));
                },
                (err) => reject(err),
                async () => {
                  try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    fileUrls.push(downloadURL);
                    resolve();
                  } catch (err) {
                    reject(err);
                  }
                }
              );
            });
          }));
      } catch (uploadErr) {
         console.error('File upload failed:', uploadErr);
         setError('Submission failed during processing. Please try again.');
         setSubmitting(false);
         setUploadProgress(0);
         return;
      }

      console.log('[Checkout] Step 3/3 — saving lead to Firestore');
      const docRef = await addDoc(collection(db, 'leads'), {
        userId: uid,
        email,
        fileUrl: fileUrls[0] || '', // Must be string for Firestore rules
        fileUrls: fileUrls,
        fileName: files[0].name,
        fileType: fileKind,
        fileLengthWords: words,
        audioMinutes: minutes,
        services,
        voiceSampleUrl: vsUrl,
        cloningText,
        languages: { from: fromLang, to: toLang },
        calculatedPrice: total,
        status: 'pending_payment',
        createdAt: serverTimestamp(),
      });
      console.log('[Checkout] Lead saved:', docRef.id);

      console.log('[Checkout] Creating Stripe checkout session');
      const res = await fetch('/api/test-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: docRef.id, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || `Checkout failed (status ${res.status})`);
      }

      console.log('[Checkout] Redirecting to Stripe:', data.url);
      window.location.href = data.url;

    } catch (err: any) {
      console.error('[Checkout] Failed:', err);
      const code: string | undefined = err?.code;
      let msg = err?.message || 'Something went wrong. Please try again.';
      if (code === 'auth/admin-restricted-operation') {
        msg =
          'Authentication is temporarily unavailable. Please refresh the page and try again.';
      } else if (code?.startsWith('storage/')) {
        msg = `Upload failed (${code}). Please try a different file or try again shortly.`;
      } else if (code?.startsWith('permission-denied') || code === 'permission-denied') {
        msg = 'We could not save your request due to a permissions issue. Please try again.';
      }
      setError(msg);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-[2.5rem] text-center"
          >
            <CheckCircle2 className="w-20 h-20 text-bee-amber mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-6">Test Request Received!</h2>
            <p className="text-slate-400 mb-10 text-lg">
              The Hive is processing your project. You'll receive an email when it's ready.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="px-10 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Submit Another
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24">
      <SEO
        title="Get Started - Calculate Your AI Transcription Price | AiBhive"
        description="Calculate your price for AI transcription, translation, and voice cloning. Upload your file and get an instant quote from AiBhive."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-4"
          >
            Get <span className="text-gradient">Started</span>
          </motion.h1>
          <p className="text-xl text-slate-400">
            Upload your file, pick your services, and pay securely.
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1: Upload */}
          <section className="glass-card p-8 rounded-[2rem]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Upload className="w-5 h-5 mr-3 text-bee-amber" />
              1. Upload your file
            </h2>

            <label
              htmlFor="fileInput"
              className="block border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-bee-amber/40 transition-all cursor-pointer bg-white/5"
            >
              <input
                id="fileInput"
                type="file"
                multiple={true}
                className="hidden"
                onChange={(e) => handleFileChange(e, false)}
              />
              {files.length > 0 ? (
                <div className="flex flex-col items-center">
                  {fileKind === 'audio'
                    ? <Music className="w-12 h-12 text-bee-amber mb-3" />
                    : <FileText className="w-12 h-12 text-bee-amber mb-3" />}
                  <p className="text-white font-bold text-lg">
                      {files.length === 1 ? files[0].name : `${files.length} files selected`}
                  </p>
                  <p className="text-slate-500 mt-1 text-sm">
                    {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="mt-4 flex gap-6 text-sm text-slate-400">
                    {fileKind === 'text' ? (
                      <span className="flex items-center"><FileText className="w-4 h-4 mr-2" />{words} words</span>
                    ) : (
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-2" />{minutes} min</span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-bee-amber mx-auto mb-4" />
                  <p className="text-white font-bold">Click to upload a file</p>
                  <p className="text-slate-500 mt-1 text-sm">Audio, video, or text (max 50MB)</p>
                </>
              )}
            </label>
          </section>

          {/* Step 2: Services */}
          <section className="glass-card p-8 rounded-[2rem]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-3 text-bee-amber" />
              2. Choose services
            </h2>

            <div className="space-y-3">
              {(Object.keys(SERVICE_LABELS) as ServiceKey[]).map((key) => (
                <div key={key}>
                  <label
                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                      services[key]
                        ? 'border-bee-amber/60 bg-bee-amber/5'
                        : 'border-white/10 bg-white/5 hover:border-bee-amber/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={services[key]}
                      onChange={(e) => setServices({ ...services, [key]: e.target.checked })}
                      className="w-5 h-5 accent-bee-amber mr-4"
                    />
                    <span className="text-white font-semibold">{SERVICE_LABELS[key]}</span>
                  </label>

                  {key === 'voiceCloning' && services.voiceCloning && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6 pt-6 border-t border-white/10 space-y-6"
                        >
                          <div>
                            <span className="block text-slate-300 font-bold mb-3 uppercase tracking-wider text-sm">Upload Voice Sample (Max 5MB)</span>
                            <label
                              htmlFor="voiceSampleInput"
                              className="border border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-bee-amber/50 transition-all cursor-pointer bg-bee-black/40 relative z-10 block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                id="voiceSampleInput"
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => {
                                  handleFileChange(e, true);
                                }}
                              />
                              {voiceSample ? (
                                <div className="text-bee-amber font-bold flex items-center justify-center pointer-events-none">
                                  <CheckCircle2 className="w-5 h-5 mr-2" />
                                  {voiceSample.name}
                                </div>
                              ) : (
                                <div className="text-slate-400 font-medium flex items-center justify-center pointer-events-none">
                                  <Mic2 className="w-6 h-6 mr-3 text-bee-amber" />
                                  Click to upload 30s-2min clean audio
                                </div>
                              )}
                            </label>
                          </div>
                          <div>
                            <span className="block text-slate-300 font-bold mb-3 uppercase tracking-wider text-sm">Text to speak in cloned voice (Optional if file uploaded)</span>
                            <textarea
                              value={cloningText}
                              onChange={(e) => setCloningText(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder={files.length > 0 ? "Optional: Leave blank to use your uploaded file(s) for the script." : "Paste the script here..."}
                              className="w-full bg-bee-black/50 border border-white/20 rounded-xl px-5 py-4 text-white focus:border-bee-amber focus:ring-1 focus:ring-bee-amber outline-none transition-all shadow-inner h-32 resize-none relative z-10"
                            />
                          </div>
                        </motion.div>
                   )}
                </div>
              ))}
            </div>

            {services.transcribeTranslate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                <div>
                  <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">From</label>
                  <select
                    value={fromLang}
                    onChange={(e) => setFromLang(e.target.value)}
                    className="w-full bg-bee-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-bee-amber outline-none"
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">To</label>
                  <select
                    value={toLang}
                    onChange={(e) => setToLang(e.target.value)}
                    className="w-full bg-bee-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-bee-amber outline-none"
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Step 3: Email */}
          <section className="glass-card p-8 rounded-[2rem]">
            <h2 className="text-xl font-bold text-white mb-4">3. Your email</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-bee-amber outline-none placeholder:text-slate-500"
              required
            />
          </section>

          {/* Price breakdown */}
          <section className="glass-card p-8 rounded-[2rem] border-bee-amber/30 bg-bee-amber/5">
            <h2 className="text-xl font-bold text-white mb-4">Price breakdown</h2>

            {lineItems.length === 0 ? (
              <p className="text-slate-400">Upload a file and select a service to see your price.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {lineItems.map((line) => (
                  <li key={line.label} className="flex justify-between py-3 text-slate-200">
                    <span>{line.label}</span>
                    <span className="font-mono">${line.amount.toFixed(2)}</span>
                  </li>
                ))}
                <li className="flex justify-between pt-4 text-white font-bold text-2xl">
                  <span>Total</span>
                  <span className="text-bee-amber">${total.toFixed(2)} USD</span>
                </li>
              </ul>
            )}
          </section>

          {error && (
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-5 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-3" />
                Submit Request {total > 0 ? `· $${total.toFixed(2)}` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
