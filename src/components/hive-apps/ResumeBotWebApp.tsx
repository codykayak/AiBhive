import { useCallback, useEffect, useState } from 'react';
import {
  Camera,
  Copy,
  FileText,
  ImagePlus,
  Link2,
  Loader2,
  Sparkles,
  Trash2,
  ChevronLeft,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import { fileToBase64, generateResumeKit, type ResumeKitResult } from '../../lib/resumeBotApi';

const PROFILE_KEY = 'aibhive_resume_bot_profile';

type Profile = {
  name: string;
  email: string;
  phone: string;
  history: string;
};

type Props = {
  expanded?: boolean;
};

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {
    // ignore
  }
  return { name: '', email: '', phone: '', history: '' };
}

function saveProfile(p: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function ResultSection({
  title,
  text,
  onCopy,
}: {
  title: string;
  text: string;
  onCopy: () => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-amber-300 font-bold text-sm uppercase tracking-wide">{title}</h3>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
        {text}
      </div>
    </section>
  );
}

/** Full Auto-Bot Resume — same flow as mobile, runs in browser via Hive Cloud AI. */
export default function ResumeBotWebApp({ expanded }: Props) {
  const brand = brandFor('amber');
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobImages, setJobImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [kit, setKit] = useState<ResumeKitResult | null>(null);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const updateProfile = (patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const onResumePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
    e.target.value = '';
  };

  const onJobImagesPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setJobImages((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeJobImage = (index: number) => {
    setJobImages((prev) => prev.filter((_, i) => i !== index));
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
      setTimeout(() => setStatus(''), 2000);
    } catch {
      setError('Could not copy — select text manually.');
    }
  };

  const handleGenerate = useCallback(async () => {
    setError('');
    if (!profile.name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!jobUrl.trim() && !jobDescription.trim() && jobImages.length === 0) {
      setError('Add a job URL, paste the job description, or attach a screenshot.');
      return;
    }
    if (!resumeFile && !profile.history.trim()) {
      setError('Upload a resume or add work history notes.');
      return;
    }

    setLoading(true);
    setStatus('Reading job listing…');
    try {
      const payload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        history: profile.history.trim(),
        jobUrl: jobUrl.trim(),
        jobDescription: jobDescription.trim(),
        resumeBase64: resumeFile ? await fileToBase64(resumeFile) : undefined,
        resumeMime: resumeFile?.type || 'application/pdf',
        jobImages: await Promise.all(
          jobImages.map(async (f) => ({
            base64: await fileToBase64(f),
            mime: f.type || 'image/jpeg',
          }))
        ),
      };

      setStatus('Drafting cover letter, resume & outreach email…');
      const result = await generateResumeKit(payload);
      setKit(result);
      setStep('results');
      setStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  }, [profile, jobUrl, jobDescription, resumeFile, jobImages]);

  if (step === 'results' && kit) {
    return (
      <div
        className={`flex flex-col ${expanded ? 'min-h-[calc(100vh-12rem)]' : ''}`}
        style={{ ['--brand-primary' as string]: brand.primary }}
      >
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            New application
          </button>
        </div>
        <h2 className="text-xl font-black text-white mb-1">Your Application Kit</h2>
        <p className="text-slate-400 text-sm mb-6">Copy any section into the employer site or your email app.</p>
        {status && <p className="text-emerald-400 text-xs mb-3">{status}</p>}
        <div className="space-y-5 overflow-y-auto flex-1 pr-1">
          <ResultSection title="Job details" text={kit.jobDetails} onCopy={() => void copyText(kit.jobDetails, 'Job details')} />
          <ResultSection title="Cover letter" text={kit.coverLetter} onCopy={() => void copyText(kit.coverLetter, 'Cover letter')} />
          <ResultSection title="Tailored resume" text={kit.rewrittenResume} onCopy={() => void copyText(kit.rewrittenResume, 'Resume')} />
          <ResultSection title="Cold outreach email" text={kit.coldEmail} onCopy={() => void copyText(kit.coldEmail, 'Cold email')} />
        </div>
        <p className="text-slate-600 text-xs mt-4 text-center">
          Get Job Tracker & cloud sync in the{' '}
          <a href="/download.html" className="text-amber-400 hover:underline">
            AiBhive mobile app
          </a>
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        expanded
          ? 'min-h-[calc(100vh-12rem)]'
          : 'rounded-2xl border min-h-[520px]'
      }`}
      style={
        expanded
          ? { ['--brand-primary' as string]: brand.primary }
          : { borderColor: brand.primarySoft, backgroundColor: '#0b0f14' }
      }
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2" style={{ backgroundColor: brand.primarySoft }}>
        <Sparkles className="w-5 h-5" style={{ color: brand.primary }} />
        <div>
          <p className="text-white font-bold text-sm">Auto-Bot Resume</p>
          <p className="text-slate-400 text-xs">Customized to the job posting - one click resume and cover letter.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm px-3 py-2">{error}</div>
        )}
        {status && loading && (
          <div className="flex items-center gap-2 text-amber-300 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {status}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Full name *</label>
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="Jane Doe"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
              value={profile.email}
              onChange={(e) => updateProfile({ email: e.target.value })}
              placeholder="jane@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Phone</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
              value={profile.phone}
              onChange={(e) => updateProfile({ phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Work history notes</label>
          <textarea
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/50 min-h-[80px]"
            value={profile.history}
            onChange={(e) => updateProfile({ history: e.target.value })}
            placeholder="Past roles, skills, metrics — or upload a resume below"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5" /> Job posting URL
          </label>
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Or paste job description</label>
          <textarea
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/50 min-h-[100px]"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting if you don't have a URL…"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Your resume (PDF, DOC, TXT)
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-slate-300 hover:border-amber-500/40 hover:text-white transition-colors">
            <FileText className="w-4 h-4 text-amber-400" />
            {resumeFile ? resumeFile.name : 'Choose file…'}
            <input type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain" className="hidden" onChange={onResumePick} />
          </label>
          {resumeFile && (
            <button type="button" onClick={() => setResumeFile(null)} className="ml-2 text-xs text-slate-500 hover:text-red-400">
              Remove
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" /> Job listing screenshots
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-slate-300 hover:border-amber-500/40 hover:text-white transition-colors">
            <ImagePlus className="w-4 h-4 text-amber-400" />
            Add photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={onJobImagesPick} />
          </label>
          {jobImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {jobImages.map((file, i) => (
                <div key={`${file.name}-${i}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeJobImage(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGenerate()}
          className="w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: brand.primary, color: brand.contrastText }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate application kit
            </>
          )}
        </button>
      </div>
    </div>
  );
}
