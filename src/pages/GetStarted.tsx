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
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { SEO } from '../components/SEO';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi', 
  'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Arabic',
  'Italian', 'Korean', 'Turkish', 'Dutch', 'Polish',
  'Indonesian', 'Vietnamese', 'Thai', 'Swedish', 'Greek'
];

export default function GetStarted() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'audio' | 'text' | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [cloningText, setCloningText] = useState('');

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

  // Services
  const [selectedServices, setSelectedServices] = useState({
    transcribeTranslate: false,
    voiceCloning: false,
    legalMedical: false
  });

  const [languages, setLanguages] = useState({
    from: 'English',
    to: 'Spanish'
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, isVoiceSample = false) => {
    if (!e.target.files?.length) return;

    if (isVoiceSample === true) {
      setVoiceSample(e.target.files[0]);
      return;
    }

    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    // Keep 'file' as the primary for backwards compatibility, or use the first one
    if (!file) {
      setFile(newFiles[0]);
    }
    setError(null);

    // Determine type and count for all files
    let totalWords = wordCount;
    let totalMinutes = audioMinutes;
    let currentFileType = fileType;

    for (const selectedFile of newFiles) {
      const typedFile = selectedFile as File;
      if (typedFile.type.includes('text') || typedFile.name.endsWith('.txt') || typedFile.name.endsWith('.pdf') || typedFile.name.endsWith('.docx')) {
        currentFileType = 'text';
        try {
          const text = await typedFile.text();
          const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
          totalWords += (words || 250);
        } catch (err) {
          totalWords += 250;
        }
      } else if (typedFile.type.includes('audio') || typedFile.type.includes('video')) {
        currentFileType = 'audio';
        await new Promise<void>((resolve) => {
          const audio = new Audio(URL.createObjectURL(typedFile));
          audio.onloadedmetadata = () => {
            totalMinutes += Math.max(1, Math.ceil(audio.duration / 60));
            resolve();
          };
          audio.onerror = () => {
             totalMinutes += 1;
             resolve();
          }
        });
      } else {
        currentFileType = 'text';
        totalWords += 250;
      }
    }

    setFileType(currentFileType);
    setWordCount(totalWords);
    setAudioMinutes(totalMinutes);
  };

  const calculatePrice = () => {
    // If files uploaded but type isn't fully determined or fallback occurred,
    // we default to text pricing base to prevent breaking checkout.
    const effectiveFileType = fileType || 'text';

    let total = 0;
    const { transcribeTranslate, voiceCloning, legalMedical } = selectedServices;

    // Minimum charge or basic parsing
    if (effectiveFileType === 'text') {
      const words = Math.max(1, wordCount);
      if (transcribeTranslate) total += words * 0.025;
      if (legalMedical) total += words * 0.035;
      if (voiceCloning) total += words * 0.035;
    } else if (effectiveFileType === 'audio' || effectiveFileType === 'video') {
      const minutes = Math.max(1, audioMinutes);
      if (transcribeTranslate) total += minutes * 2.49;
      if (legalMedical) total += minutes * 3.29;
      if (voiceCloning) total += minutes * 1.99;
    }

    // Ensure two decimal precision
    return Number(total.toFixed(2));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload a file.');
      return;
    }

    if (selectedServices.voiceCloning && !voiceSample) {
      setError('Please upload a voice sample for cloning.');
      return;
    }

    if (selectedServices.voiceCloning && !cloningText) {
      setError('Please provide text for voice cloning.');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address to start your project.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let uid;
      try {
        if (!auth.currentUser) {
          const userCredential = await signInAnonymously(auth);
          uid = userCredential.user.uid;
        } else {
          uid = auth.currentUser.uid;
        }
      } catch (authErr) {
        console.warn("Anonymous auth failed (is it enabled in Firebase?). Falling back to random ID.", authErr);
        uid = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      }

      const sessionId = uid;

      let vsUrl = null;
      if (voiceSample) {
        try {
          const vsRef = ref(storage, `leads/${sessionId}/sample_${Date.now()}_${voiceSample.name}`);
          const vsUpload = await uploadBytesResumable(vsRef, voiceSample);
          vsUrl = await getDownloadURL(vsUpload.ref);
        } catch (vsErr) {
          console.error('Voice sample upload failed:', vsErr);
          setError('Voice sample upload failed. Please try again.');
          setUploading(false);
          return;
        }
      }

      // 1. Upload All Main Files
      const fileUrls: string[] = [];
      let totalBytes = files.reduce((acc, f) => acc + f.size, 0);
      let bytesTransferredArray = new Array(files.length).fill(0);

      try {
          await Promise.all(files.map(async (fileObj, index) => {
            const fileRef = ref(storage, `leads/${sessionId}/${Date.now()}_${fileObj.name}`);
            const uploadTask = uploadBytesResumable(fileRef, fileObj);

            return new Promise<void>((resolve, reject) => {
              uploadTask.on('state_changed',
                (snapshot) => {
                  bytesTransferredArray[index] = snapshot.bytesTransferred;
                  const currentTotalTransferred = bytesTransferredArray.reduce((acc, bytes) => acc + bytes, 0);
                  const progress = (currentTotalTransferred / totalBytes) * 100;
                  // Handle rare edge cases where progress calculation goes slightly above 100
                  setUploadProgress(Math.min(100, Math.max(0, progress)));
                },
                (err) => {
                  console.error(`Upload failed for ${fileObj.name}:`, err);
                  reject(err);
                },
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

          // Set primary fileUrl for backward compatibility (using first file)
          if (fileUrls.length > 0) {
            setFileUrl(fileUrls[0]);
          }
          setVoiceSampleUrl(vsUrl);

          // 2. Save to Firestore
          const docRef = await addDoc(collection(db, 'leads'), {
            userId: sessionId,
            email,
            fileUrl: fileUrls[0] || null, // Keep primary for backend single-file processing
            fileUrls: fileUrls, // Add array for multi-file support later
            voiceSampleUrl: vsUrl,
            cloningText,
            fileType,
            fileLengthWords: wordCount,
            audioMinutes: audioMinutes,
            calculatedPrice: calculatePrice(),
            services: selectedServices,
            languages,
            status: 'pending_payment',
            createdAt: serverTimestamp()
          });

          // 3. Initiate Checkout
          await initiateCheckout(docRef.id, calculatePrice());
      } catch (uploadErr: any) {
         console.error('File upload or database step failed:', uploadErr);
         setError('Submission failed during processing: ' + (uploadErr.message || 'Unknown error.'));
         setUploading(false);
         // Reset progress on failure so next attempt restarts
         setUploadProgress(0);
         return;
      }

    } catch (err: any) {
      console.error('Submission failed:', err);
      // Only set generic error if we didn't already set a more specific one
      setError((prev) => prev || ('Submission failed. ' + (err.message || 'Please try again.')));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const initiateCheckout = async (leadId: string, finalPrice: number) => {
    try {
      if (finalPrice <= 0) {
        setError('Please select a service or upload a valid file to proceed.');
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      console.log('Initiating checkout for lead:', leadId, 'price:', finalPrice);
      // Set to 100% since files are completely uploaded at this point and we're just waiting for checkout API
      setUploadProgress(100);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          email,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Checkout session API returned status: ${response.status}. ${errText}`);
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        setError('Failed to initiate checkout.');
        setUploading(false);
        setUploadProgress(0);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError('Failed to initiate checkout. ' + (err.message || 'Please try again.'));
      setUploading(false);
      setUploadProgress(0);
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
                  multiple={true}
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, false)}
                />
                {files.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-16 h-16 text-bee-amber mb-4" />
                    <p className="text-white font-bold text-xl">
                      {files.length === 1 ? files[0].name : `${files.length} files selected`}
                    </p>
                    <p className="text-slate-500 mt-2">
                      {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
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
                    <p className="text-white font-bold text-xl">Click or drag files to upload</p>
                    <p className="text-slate-500 mt-2">Audio, Video, or Text files (Max 50MB per file)</p>
                  </>
                )}
              </div>
            </section>

            {/* Services */}
            <section className="glass-card p-10 rounded-[2.5rem]">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-3 text-bee-amber" />
                2. Choose Service (Select all that apply)
              </h2>
              <div className="space-y-6">

                {/* Transcribe + Translate */}
                <div className={`p-8 bg-white/5 border rounded-2xl transition-all ${selectedServices.transcribeTranslate ? 'border-bee-amber/60 bg-bee-amber/5' : 'border-white/10 hover:border-bee-amber/30'}`}>
                  <label className="flex items-start cursor-pointer w-full">
                    <input 
                      type="checkbox" 
                      checked={selectedServices.transcribeTranslate}
                      onChange={(e) => setSelectedServices({...selectedServices, transcribeTranslate: e.target.checked})}
                      className="w-8 h-8 accent-bee-amber mr-6 shrink-0 mt-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Transcribe + Translate</h3>
                      <p className="text-slate-400 text-base mb-6">Convert audio or text into another language</p>

                      {selectedServices.transcribeTranslate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10"
                        >
                          <div>
                            <label className="block text-slate-300 font-bold mb-3 uppercase tracking-wider text-sm">Translate From</label>
                            <select
                              value={languages.from}
                              onChange={(e) => setLanguages({...languages, from: e.target.value})}
                              className="w-full bg-bee-black/50 border border-white/20 rounded-xl px-5 py-4 text-white focus:border-bee-amber focus:ring-1 focus:ring-bee-amber outline-none transition-all shadow-inner"
                            >
                              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-3 uppercase tracking-wider text-sm">Translate To</label>
                            <select
                              value={languages.to}
                              onChange={(e) => setLanguages({...languages, to: e.target.value})}
                              className="w-full bg-bee-black/50 border border-white/20 rounded-xl px-5 py-4 text-white focus:border-bee-amber focus:ring-1 focus:ring-bee-amber outline-none transition-all shadow-inner"
                            >
                              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Voice Cloning */}
                <div className={`p-8 bg-white/5 border rounded-2xl transition-all ${selectedServices.voiceCloning ? 'border-bee-amber/60 bg-bee-amber/5' : 'border-white/10 hover:border-bee-amber/30'}`}>
                  <div className="flex items-start w-full">
                    <input 
                      type="checkbox" 
                      id="voice-cloning-checkbox"
                      checked={selectedServices.voiceCloning}
                      onChange={(e) => setSelectedServices({...selectedServices, voiceCloning: e.target.checked})}
                      className="w-8 h-8 accent-bee-amber mr-6 shrink-0 mt-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="voice-cloning-checkbox" className="cursor-pointer block">
                        <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Voice Cloning - Highest Quality</h3>
                        <p className="text-slate-400 text-base mb-6">Turn text into speech using a cloned voice</p>
                      </label>

                      {selectedServices.voiceCloning && (
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
                            <span className="block text-slate-300 font-bold mb-3 uppercase tracking-wider text-sm">Text to speak in cloned voice</span>
                            <textarea
                              value={cloningText}
                              onChange={(e) => setCloningText(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Paste the script here..."
                              className="w-full bg-bee-black/50 border border-white/20 rounded-xl px-5 py-4 text-white focus:border-bee-amber focus:ring-1 focus:ring-bee-amber outline-none transition-all shadow-inner h-32 resize-none relative z-10"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Legal & Medical */}
                <div className={`p-8 bg-white/5 border rounded-2xl transition-all ${selectedServices.legalMedical ? 'border-bee-amber/60 bg-bee-amber/5' : 'border-white/10 hover:border-bee-amber/30'}`}>
                  <label className="flex items-start cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={selectedServices.legalMedical}
                      onChange={(e) => setSelectedServices({...selectedServices, legalMedical: e.target.checked})}
                      className="w-8 h-8 accent-bee-amber mr-6 shrink-0 mt-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Legal & Medical - Highest accuracy anywhere in 2026</h3>
                      <p className="text-slate-400 text-base">Uses specialized Swarm tech models for ultra high accuracy</p>
                    </div>
                  </label>
                </div>
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

            <section className="glass-card p-8 rounded-[2rem]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <LogIn className="w-6 h-6 mr-3 text-bee-amber" />
                Enter your email to receive project updates
              </h3>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:border-bee-amber outline-none placeholder:text-slate-500 transition-all"
                required
              />
            </section>

            {error && (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center text-red-400">
                <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
                {error}
              </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={uploading || files.length === 0}
              className="w-full py-6 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow flex items-center justify-center text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Processing {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  Start my Project <ArrowRight className="ml-3 w-7 h-7" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Pricing Grid */}
        <section id="pricing" className="mt-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Simple rates based on your file type and selected services.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Text Pricing */}
            <div className="glass-card p-10 rounded-[2.5rem] border-white/10 relative overflow-hidden group hover:border-bee-amber/30 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-bee-amber/50 transition-all" />
              <div className="flex items-center mb-8">
                <div className="bg-white/10 p-3 rounded-xl mr-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Text Files</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Translation</span>
                  <span className="font-bold text-white bg-white/5 px-4 py-1 rounded-lg">$0.025 <span className="text-sm font-normal text-slate-500">/ word</span></span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Legal/Medical</span>
                  <span className="font-bold text-white bg-white/5 px-4 py-1 rounded-lg">$0.035 <span className="text-sm font-normal text-slate-500">/ word</span></span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-300">Voice Cloning</span>
                  <span className="font-bold text-white bg-white/5 px-4 py-1 rounded-lg">$0.035 <span className="text-sm font-normal text-slate-500">/ word</span></span>
                </li>
              </ul>
            </div>

            {/* Audio Pricing */}
            <div className="glass-card p-10 rounded-[2.5rem] border-bee-amber/20 bg-bee-amber/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-bee-amber to-transparent" />
              <div className="flex items-center mb-8">
                <div className="bg-bee-amber/20 p-3 rounded-xl mr-4">
                  <Music className="w-6 h-6 text-bee-amber" />
                </div>
                <h3 className="text-2xl font-bold text-white">Audio Files</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Transcribe + Translate</span>
                  <span className="font-bold text-white bg-white/5 px-4 py-1 rounded-lg">$2.49 <span className="text-sm font-normal text-slate-500">/ minute</span></span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Legal/Medical</span>
                  <span className="font-bold text-white bg-white/5 px-4 py-1 rounded-lg">$3.29 <span className="text-sm font-normal text-slate-500">/ minute</span></span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-300">Voice Cloning</span>
                  <span className="font-bold text-white bg-white/5 px-4 py-1 rounded-lg">$1.99 <span className="text-sm font-normal text-slate-500">/ minute</span></span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
