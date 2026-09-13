import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { JOB_LISTINGS, JobSlug } from '../../content/jobListings';

const CALL_OPTIONS = [
  { id: 'weekday-morning', label: 'Weekday mornings (8am–12pm PT)' },
  { id: 'weekday-afternoon', label: 'Weekday afternoons (12pm–5pm PT)' },
  { id: 'weekday-evening', label: 'Weekday evenings (5pm–8pm PT)' },
  { id: 'weekend', label: 'Weekends' },
  { id: 'specific', label: 'I’ll write a specific window below' },
] as const;

const inputClass =
  'w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-bee-amber/50 transition-colors';
const labelClass = 'block text-sm font-semibold text-slate-300 mb-2';

type Props = {
  lockedProduct?: JobSlug;
  heading?: string;
  subheading?: string;
};

export function JobApplicationForm({
  lockedProduct,
  heading = 'Apply',
  subheading = 'Short form. Resume, a few sentences, and when to call. That’s it.',
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [products, setProducts] = useState<string[]>(lockedProduct ? [lockedProduct] : []);
  const [aboutYou, setAboutYou] = useState('');
  const [callTime, setCallTime] = useState('');
  const [callTimeNote, setCallTimeNote] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleProduct = (id: string) => {
    if (lockedProduct) return;
    setProducts((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    if (!resume) {
      setStatus('error');
      setErrorMessage('Please upload your resume.');
      return;
    }

    const selectedProducts = lockedProduct ? [lockedProduct] : products;
    if (selectedProducts.length === 0) {
      setStatus('error');
      setErrorMessage('Please choose at least one product.');
      return;
    }

    const body = new FormData();
    body.set('name', name);
    body.set('email', email);
    body.set('phone', phone);
    body.set('products', selectedProducts.join(','));
    body.set('aboutYou', aboutYou);
    body.set('callTime', callTime);
    body.set('callTimeNote', callTimeNote);
    body.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    body.set('resume', resume);

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api/job-application`
          : '/api/job-application',
        { method: 'POST', body }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed. Email hello@aibhive.com.');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-10 text-center border border-green-500/20"
      >
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Application received</h2>
        <p className="text-slate-400 leading-relaxed mb-8">
          We’ll review your resume and call you at the time you gave us. If anything’s urgent, email
          hello@aibhive.com.
        </p>
        <Link to="/jobs" className="text-bee-amber font-semibold hover:text-bee-yellow">
          View all openings
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <header className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{heading}</h2>
        <p className="text-slate-400 leading-relaxed">{subheading}</p>
      </header>

      {status === 'error' && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 space-y-6"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass} htmlFor="jobs-name">
              Full name *
            </label>
            <input
              id="jobs-name"
              required
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobs-email">
              Email *
            </label>
            <input
              id="jobs-email"
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="jobs-phone">
            Phone *
          </label>
          <input
            id="jobs-phone"
            type="tel"
            required
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="We’ll call this number"
          />
        </div>

        {lockedProduct ? (
          <div className="rounded-lg border border-bee-amber/30 bg-bee-amber/5 px-4 py-3">
            <p className="text-sm text-slate-400">Applying for</p>
            <p className="text-white font-semibold">
              {JOB_LISTINGS.find((j) => j.slug === lockedProduct)?.orgName}
            </p>
          </div>
        ) : (
          <fieldset>
            <legend className={`${labelClass} mb-3`}>What do you want to sell? *</legend>
            <div className="space-y-2">
              {JOB_LISTINGS.map((job) => (
                <label
                  key={job.slug}
                  className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:border-bee-amber/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-amber-500"
                    checked={products.includes(job.slug)}
                    onChange={() => toggleProduct(job.slug)}
                  />
                  <span>
                    <span className="text-white font-semibold">{job.orgName}</span>
                    <span className="block text-sm text-slate-400">{job.title}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <label className={labelClass} htmlFor="jobs-resume">
            Resume *
          </label>
          <label
            htmlFor="jobs-resume"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-white/20 hover:border-bee-amber/50 cursor-pointer text-slate-300"
          >
            <Upload className="w-5 h-5 text-bee-amber" />
            <span>{resume ? resume.name : 'PDF, Word, or text — up to 8MB'}</span>
          </label>
          <input
            id="jobs-resume"
            type="file"
            required
            className="sr-only"
            accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="jobs-about">
            What should we know about you? *
          </label>
          <textarea
            id="jobs-about"
            required
            rows={5}
            className={`${inputClass} resize-y min-h-[8rem]`}
            value={aboutYou}
            onChange={(e) => setAboutYou(e.target.value)}
            placeholder="Sales background, who you already sell to, why this seat…"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="jobs-call">
            Best time for a phone call *
          </label>
          <select
            id="jobs-call"
            required
            className={inputClass}
            value={callTime}
            onChange={(e) => setCallTime(e.target.value)}
          >
            <option value="">Select a window</option>
            {CALL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className={`${inputClass} mt-3`}
            value={callTimeNote}
            onChange={(e) => setCallTimeNote(e.target.value)}
            placeholder="Optional: Tuesday after 3pm, don’t call Fridays…"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Sending
            </>
          ) : (
            <>
              Submit application
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-xs text-slate-500 text-center">
          100% remote, commission-only roles. Results vary. We’ll only use this to schedule your call.
        </p>
      </form>
    </>
  );
}
