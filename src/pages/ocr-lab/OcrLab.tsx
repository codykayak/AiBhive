import React, { useState, ChangeEvent, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Settings,
  Download,
  Mail,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { SEO } from '../../components/SEO';

// Compress image using canvas
const compressImage = (file: File): Promise<string> => {
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          // Return base64 string without data URL prefix for API consistency
          resolve(dataUrl.split(',')[1]);
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function OcrLab() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState('');
  const [formatOption, setFormatOption] = useState('Markdown');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f: File) => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    setError('');
    setIsProcessing(true);
    setProgress(0);
    setOcrResult('');

    try {
      // 1. Compress images
      const base64Images: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(Math.round(((i) / files.length) * 50));
        const base64 = await compressImage(files[i]);
        base64Images.push(base64);
      }

      setProgress(50); // Compression done

      // 2. Send to API
      const response = await fetch('/api/ocr-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: base64Images,
          format: formatOption
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      setProgress(90);

      const data = await response.json();
      if (data.text) {
        setOcrResult(data.text);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Unexpected response from server");
      }

      setProgress(100);

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'An error occurred during processing.');
      } else {
        setError('An error occurred during processing.');
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000); // Hide progress after a bit
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ocrResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!ocrResult) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(ocrResult, 180);

    // Basic pagination
    let y = 15;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(splitText[i], 15, y);
      y += 7;
    }
    doc.save('ocr_result.pdf');
  };

  const handleEmail = () => {
    if (!ocrResult) return;
    const subject = encodeURIComponent('OCR Result from AiBHive');
    const body = encodeURIComponent(ocrResult.substring(0, 1500) + (ocrResult.length > 1500 ? '...\n\n[Truncated for email, download PDF for full text]' : ''));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <main className="py-24">
      <SEO
        title="OCR Lab - Batch Image to Text | AiBhive"
        description="AiBhive OCR Lab converts up to 100 photos into formatted text, Markdown, or PDF with vision AI — built for archives, scanned documents, and research images."
        keywords="OCR lab, batch OCR, image to text AI, scanned document OCR, AiBhive vision AI"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6 border border-bee-amber/20"
          >
            Vision AI
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            OCR <span className="text-gradient">Lab</span>
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload up to 100 photos and convert them instantly to formatted text, Markdown, or PDF using state-of-the-art vision models.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: Upload and Settings */}
          <section className="space-y-8">
            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <ImageIcon className="w-6 h-6 mr-3 text-bee-amber" />
                Select Images
              </h2>

              <div
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-bee-amber/50 hover:bg-white/5 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="bg-bee-amber/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-bee-amber/20 transition-colors">
                  <Upload className="w-8 h-8 text-bee-amber" />
                </div>
                <p className="text-white font-bold text-lg mb-2">Tap to select photos</p>
                <p className="text-slate-400 text-sm">Select up to 100 images from your gallery</p>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-slate-400 mb-3">
                    <span>{files.length} image{files.length !== 1 && 's'} selected</span>
                    <button onClick={() => setFiles([])} className="text-red-400 hover:text-red-300">Clear all</button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {files.map((file, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`OCR Lab image preview ${index + 1} ready for AiBhive batch text extraction`}
                          className="w-16 h-16 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-8 rounded-2xl">
               <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-bee-amber" />
                Formatting Options
              </h2>
              <div className="space-y-4">
                {['Plain Text', 'Markdown', 'Preserve Layout'].map((opt) => (
                  <label key={opt} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${formatOption === opt ? 'border-bee-amber bg-bee-amber/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <input
                      type="radio"
                      name="format"
                      value={opt}
                      checked={formatOption === opt}
                      onChange={() => setFormatOption(opt)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${formatOption === opt ? 'border-bee-amber' : 'border-slate-500'}`}>
                      {formatOption === opt && <div className="w-2.5 h-2.5 bg-bee-amber rounded-full" />}
                    </div>
                    <span className="text-white font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing || files.length === 0}
              className="w-full py-5 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Processing Images... {progress > 0 && `${progress}%`}
                </>
              ) : (
                'Extract Text'
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

          </section>

          {/* Right Column: Output */}
          <section className="glass-card p-8 rounded-2xl flex flex-col h-[800px] lg:h-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-bee-amber" />
                Extracted Text
              </div>
              {ocrResult && (
                <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                </span>
              )}
            </h2>

            <div className="flex-grow bg-[#0f1115]/50 border border-white/10 rounded-xl p-4 overflow-y-auto mb-6 relative custom-scrollbar font-mono text-sm text-slate-300">
              {ocrResult ? (
                <div className="whitespace-pre-wrap">{ocrResult}</div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col">
                  {isProcessing ? (
                     <Loader2 className="w-10 h-10 animate-spin text-bee-amber/50 mb-4" />
                  ) : (
                    <>
                      <FileText className="w-12 h-12 mb-4 opacity-20" />
                      <p>Your extracted text will appear here.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Export Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={handleCopy}
                disabled={!ocrResult}
                className="py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-center font-medium"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={!ocrResult}
                className="py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-center font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                PDF
              </button>
              <button
                onClick={handleEmail}
                disabled={!ocrResult}
                className="py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-center font-medium"
              >
                <Mail className="w-5 h-5 mr-2" />
                Email
              </button>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
