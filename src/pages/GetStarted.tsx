import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Music, 
  Mic2, 
  Languages, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  LogIn,
  Loader2,
  DollarSign,
  Clock
} from 'lucide-react';
import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { SEO } from '../components/SEO';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi', 
  'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Arabic'
];

export default function GetStarted() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [voiceSampleUrl, setVoiceSampleUrl] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [audioMinutes, setAudioMinutes] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  // Check URL parameters for successful checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccess(true);
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Options
  const [options, setOptions] = useState({
    transcribeTranslate: false,
    audioToText: false,
    cloneVoice: false,
    freeSample: false
  });

  const [context, setContext] = useState({
    legal: false,
    medical: false,
    standard: true
  });

  const [languages, setLanguages] = useState({
    from: 'English',
    to: 'Spanish'
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, isVoiceSample = false) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (isVoiceSample) {
      setVoiceSample(selectedFile);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Basic word count for text files
    if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt')) {
      const text = await selectedFile.text();
      const words = text.trim().split(/\s+/).length;
      setWordCount(words);
    } else if (selectedFile.type.includes('audio') || selectedFile.type.includes('video')) {
      // Try to get audio duration
      const audio = new Audio(URL.createObjectURL(selectedFile));
      audio.onloadedmetadata = () => {
        setAudioMinutes(Math.ceil(audio.duration / 60));
      };
    } else {
      // Fallback for other types
      setWordCount(500); 
    }
  };

  const calculatePrice = () => {
    let total = 0;
    
    if (options.transcribeTranslate) {
      total += (wordCount / 1000) * 0.50;
    }
    
    if (options.audioToText) {
      total += (audioMinutes / 3) * 1.00;
    }
    
    if (options.cloneVoice) {
      total += (wordCount / 1000) * 10.00;
    }

    // Free sample logic: if selected and under 250 words, and no other paid services are selected
    if (options.freeSample && wordCount <= 250) {
      if (!options.transcribeTranslate && !options.audioToText && !options.cloneVoice) {
        return 0;
      }
    }

    return total;
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a file.');
      return;
    }

    if (options.cloneVoice && !voiceSample) {
      setError('Please upload a voice sample for cloning.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Generate a temporary session ID since the user is not authenticated yet
      const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // 1. Upload Main File
      const mainFileRef = ref(storage, `leads/${sessionId}/${Date.now()}_${file.name}`);
      const mainUploadTask = uploadBytesResumable(mainFileRef, file);

      let vsUrl = null;
      if (voiceSample) {
        const vsRef = ref(storage, `leads/${sessionId}/sample_${Date.now()}_${voiceSample.name}`);
        const vsUpload = await uploadBytesResumable(vsRef, voiceSample);
        vsUrl = await getDownloadURL(vsUpload.ref);
      }

      mainUploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (err) => {
          console.error('Upload failed:', err);
          setError('File upload failed.');
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(mainUploadTask.snapshot.ref);
          setFileUrl(downloadURL);
          setVoiceSampleUrl(vsUrl);

          // 2. Save to Firestore
          const docRef = await addDoc(collection(db, 'leads'), {
            userId: sessionId,
            fileUrl: downloadURL,
            voiceSampleUrl: vsUrl,
            fileLengthWords: wordCount,
            audioMinutes: audioMinutes,
            calculatedPrice: calculatePrice(),
            options,
            languages,
            context,
            status: 'pending_payment',
            createdAt: serverTimestamp()
          });

          setUploading(false);

          // 3. Initiate Checkout
          initiateCheckout(docRef.id);
        }
      );
    } catch (err) {
      console.error('Submission failed:', err);
      setError('Submission failed. Please try again.');
      setUploading(false);
    }
  };

  const initiateCheckout = async (leadId: string) => {
    try {
      const price = calculatePrice();
      if (price === 0) {
        if (!email || !email.includes('@')) {
           setError('Please provide a valid email address for free samples so we can send you the results.');
           setUploading(false);
           return;
        }

        // Kick off free processing
        const res = await fetch('/api/process-free-sample', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ leadId, email }),
        });

        if (res.ok) {
           setSuccess(true);
        } else {
           setError('Failed to process free sample.');
        }
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          amount: price,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        setError('Failed to initiate checkout.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to initiate checkout.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-bee-amber animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-24">
      <SEO 
        title="Get Started - Calculate Your AI Transcription Price | AiBhive"
        description="Calculate your price for AI transcription, translation, and voice cloning. Upload your file and get an instant quote from AiBhive."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-6"
          >
            Get <span className="text-gradient">Started</span>
          </motion.h1>
          <p className="text-xl text-slate-400">
            Calculate your price by uploading the following
          </p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-[2.5rem] text-center"
          >
            <CheckCircle2 className="w-20 h-20 text-bee-amber mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-6">Quote Submitted!</h2>
            <p className="text-slate-400 mb-10 text-lg">
              The Hive is processing your request. One of our agents will contact you shortly with the final details.
            </p>
            <button 
              onClick={() => setSuccess(false)}
              className="px-10 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Submit Another
            </button>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* File Upload */}
            <section className="glass-card p-10 rounded-[2.5rem]">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                <Upload className="w-6 h-6 mr-3 text-bee-amber" />
                1. Upload Your Content
              </h2>
              <div 
                className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-bee-amber/40 transition-all duration-500 cursor-pointer bg-white/5 group relative overflow-hidden"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input 
                  id="fileInput"
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-16 h-16 text-bee-amber mb-4" />
                    <p className="text-white font-bold text-xl">{file.name}</p>
                    <p className="text-slate-500 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <div className="mt-6 flex gap-8">
                      <div className="flex items-center text-slate-400">
                        <FileText className="w-4 h-4 mr-2" />
                        {wordCount} Words
                      </div>
                      <div className="flex items-center text-slate-400">
                        <Clock className="w-4 h-4 mr-2" />
                        {audioMinutes} Mins
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 text-bee-amber mx-auto mb-6 group-hover:scale-110 transition-transform" />
                    <p className="text-white font-bold text-xl">Click or drag file to upload</p>
                    <p className="text-slate-500 mt-2">Audio, Video, or Text files (Max 50MB)</p>
                  </>
                )}
              </div>
            </section>

            {/* Options */}
            <section className="glass-card p-10 rounded-[2.5rem]">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-3 text-bee-amber" />
                2. Select Services
              </h2>
              <div className="space-y-6">
                {/* Option A */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-bee-amber/30 transition-all">
                  <div className="flex items-start mb-6">
                    <input 
                      type="checkbox" 
                      checked={options.transcribeTranslate}
                      onChange={(e) => setOptions({...options, transcribeTranslate: e.target.checked})}
                      className="w-6 h-6 accent-bee-amber mr-4 mt-1 cursor-pointer"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">A) Transcribe and Translate</h3>
                      <p className="text-slate-400 text-sm mb-4">$0.50 USD per 1000 words</p>
                    </div>
                  </div>
                  {options.transcribeTranslate && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">From</label>
                        <select 
                          value={languages.from}
                          onChange={(e) => setLanguages({...languages, from: e.target.value})}
                          className="w-full bg-bee-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-bee-amber outline-none"
                        >
                          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">To</label>
                        <select 
                          value={languages.to}
                          onChange={(e) => setLanguages({...languages, to: e.target.value})}
                          className="w-full bg-bee-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-bee-amber outline-none"
                        >
                          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option B */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-bee-amber/30 transition-all flex items-start">
                  <input 
                    type="checkbox" 
                    checked={options.audioToText}
                    onChange={(e) => setOptions({...options, audioToText: e.target.checked})}
                    className="w-6 h-6 accent-bee-amber mr-4 mt-1 cursor-pointer"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">B) Audio to Text</h3>
                    <p className="text-slate-400 text-sm">$1.00 USD per 3 minutes of audio</p>
                  </div>
                </div>

                {/* Option C */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-bee-amber/30 transition-all">
                  <div className="flex items-start mb-6">
                    <input 
                      type="checkbox" 
                      checked={options.cloneVoice}
                      onChange={(e) => setOptions({...options, cloneVoice: e.target.checked})}
                      className="w-6 h-6 accent-bee-amber mr-4 mt-1 cursor-pointer"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">C) Clone Voice</h3>
                      <p className="text-slate-400 text-sm">$10 USD per 1000 words (Sample is free)</p>
                    </div>
                  </div>
                  {options.cloneVoice && (
                    <div className="mt-4">
                      <label className="block text-slate-500 text-xs font-bold mb-3 uppercase">Upload Voice Sample (Free)</label>
                      <div 
                        className="border border-dashed border-white/20 rounded-xl p-6 text-center hover:border-bee-amber/40 transition-all cursor-pointer bg-white/5 group"
                        onClick={() => document.getElementById('voiceSampleInput')?.click()}
                      >
                        <input 
                          id="voiceSampleInput"
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(e, true)}
                        />
                        {voiceSample ? (
                          <div className="flex items-center justify-center text-bee-amber">
                            <Mic2 className="w-5 h-5 mr-2" />
                            <span className="font-bold">{voiceSample.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Mic2 className="w-8 h-8 text-bee-amber/60 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-slate-400 text-sm font-medium">Click to upload voice sample</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Option D */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-bee-amber/30 transition-all flex items-start">
                  <input 
                    type="checkbox" 
                    checked={options.freeSample}
                    onChange={(e) => setOptions({...options, freeSample: e.target.checked})}
                    className="w-6 h-6 accent-bee-amber mr-4 mt-1 cursor-pointer"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">D) Free Sample</h3>
                    <p className="text-slate-400 text-sm">Free sample if under 250 words</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Context Section */}
            <section className="glass-card p-10 rounded-[2.5rem]">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-bee-amber" />
                3. Select Context (Accuracy Check)
              </h2>
              <div className="space-y-4">
                <p className="text-slate-400 text-sm mb-4">
                  Select a context to ensure our AI uses specialized models to check for high-risk terms and mistranslations.
                </p>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={context.standard}
                      onChange={(e) => setContext(prev => ({
                        ...prev,
                        standard: e.target.checked,
                        ...(e.target.checked && { legal: false, medical: false })
                      }))}
                      className="w-5 h-5 accent-bee-amber"
                    />
                    <span className="text-white font-medium">Standard</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={context.legal}
                      onChange={(e) => setContext(prev => ({
                        ...prev,
                        legal: e.target.checked,
                        standard: false
                      }))}
                      className="w-5 h-5 accent-bee-amber"
                    />
                    <span className="text-white font-medium">Legal</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={context.medical}
                      onChange={(e) => setContext(prev => ({
                        ...prev,
                        medical: e.target.checked,
                        standard: false
                      }))}
                      className="w-5 h-5 accent-bee-amber"
                    />
                    <span className="text-white font-medium">Medical</span>
                  </label>
                </div>
                {(context.legal || context.medical) && (
                  <div className="mt-4 p-4 bg-bee-amber/10 border border-bee-amber/30 rounded-xl">
                    <p className="text-bee-amber text-sm flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                      We will perform a secondary scan using advanced LLMs to identify high-risk terms and prevent common contextual mistranslations in your output.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Total Cost */}
            <section className="glass-card p-10 rounded-[2.5rem] border-bee-amber/30 bg-bee-amber/5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Estimated Total Cost</h2>
                  <p className="text-slate-400">Based on your selections and file analysis</p>
                </div>
                <div className="text-5xl font-extrabold text-bee-amber flex items-center">
                  <DollarSign className="w-8 h-8 mr-1" />
                  {calculatePrice().toFixed(2)}
                  <span className="text-xl text-slate-500 ml-2 font-bold uppercase">USD</span>
                </div>
              </div>
            </section>

            {calculatePrice() === 0 && (
              <section className="glass-card p-8 rounded-[2rem]">
                <h3 className="text-xl font-bold text-white mb-4">Where should we send your free sample?</h3>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:border-bee-amber outline-none placeholder:text-slate-500"
                  required
                />
              </section>
            )}

            {error && (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center text-red-400">
                <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
                {error}
              </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={uploading || !file}
              className="w-full py-6 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow flex items-center justify-center text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Uploading {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  Submit Lead <ArrowRight className="ml-3 w-7 h-7" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
