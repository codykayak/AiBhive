import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';

const INTEREST_OPTIONS = [
  { id: 'lead-gen', label: 'Lead generation & nurturing agents' },
  { id: 'customer-ops', label: 'Customer operations automation' },
  { id: 'document-erp', label: 'Document processing & ERP sync' },
  { id: 'workflow', label: 'Workflow orchestration' },
  { id: 'medical-legal', label: 'Medical & legal multi-agent transcription' },
  { id: 'transcription', label: 'Transcription / translation / voice' },
  { id: 'custom', label: 'Custom agentic application (describe below)' },
] as const;

const TIMELINE_OPTIONS = [
  'Exploring — no fixed deadline',
  'Within 30 days',
  '1–3 months',
  '3–6 months',
  'Enterprise rollout (6+ months)',
] as const;

const BUDGET_OPTIONS = [
  'Not sure yet',
  'Under $10k',
  '$10k – $50k',
  '$50k – $150k',
  '$150k+',
  'Enterprise / custom SOW',
] as const;

const COMPANY_SIZE_OPTIONS = [
  'Solo / founder',
  '2–10 employees',
  '11–50',
  '51–200',
  '201–1,000',
  '1,000+',
] as const;

interface FormState {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companySize: string;
  industry: string;
  website: string;
  interests: string[];
  projectGoals: string;
  currentStack: string;
  painPoints: string;
  successCriteria: string;
  timeline: string;
  budget: string;
  preferredTimes: string;
  timezone: string;
  complianceNeeds: string[];
  referralSource: string;
}

const initialForm: FormState = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  jobTitle: '',
  companySize: '',
  industry: '',
  website: '',
  interests: [],
  projectGoals: '',
  currentStack: '',
  painPoints: '',
  successCriteria: '',
  timeline: '',
  budget: '',
  preferredTimes: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  complianceNeeds: [],
  referralSource: '',
};

const COMPLIANCE_OPTIONS = [
  { id: 'hipaa', label: 'HIPAA / healthcare data' },
  { id: 'legal-hold', label: 'Legal hold / litigation' },
  { id: 'soc2', label: 'SOC 2 / enterprise security review' },
  { id: 'gdpr', label: 'GDPR / international data' },
  { id: 'none', label: 'None of the above / not sure' },
];

export default function BookConsultation() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleInterest = (id: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(id)
        ? f.interests.filter((x) => x !== id)
        : [...f.interests, id],
    }));
  };

  const toggleCompliance = (id: string) => {
    setForm((f) => ({
      ...f,
      complianceNeeds: f.complianceNeeds.includes(id)
        ? f.complianceNeeds.filter((x) => x !== id)
        : [...f.complianceNeeds, id],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api/consultation-request`
          : '/api/consultation-request',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed. Please try again or email hello@aibhive.com.');
      }

      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-bee-amber/50 transition-colors';
  const labelClass = 'block text-sm font-semibold text-slate-300 mb-2';

  if (status === 'success') {
    return (
      <main className="py-24 min-h-[70vh] flex items-center justify-center px-4">
        <SEO
          title="Consultation Request Received | AiBHive"
          description="Your AiBHive strategy call request has been received."
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-lg w-full p-10 rounded-2xl text-center border border-green-500/20"
        >
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Request received</h1>
          <p className="text-slate-400 leading-relaxed mb-8">
            Thank you. An AiBHive strategist will review your project details and reach out within one
            business day to confirm your live call or appointment.
          </p>
          <a href="/" className="text-bee-amber font-semibold hover:text-bee-yellow">
            Return to homepage
          </a>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="py-16 md:py-24">
      <SEO
        title="Book a Live Strategy Call | AiBHive"
        description="Schedule an automation audit or strategy session with AiBHive. Tell us about your company, project goals, timeline, and compliance needs."
        keywords="book AI consultation, automation audit, AiBHive strategy call, enterprise AI appointment"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <Calendar className="w-12 h-12 text-bee-amber mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Book a <span className="text-gradient">live strategy call</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Share your company context and project needs. We use this to prepare a focused session—not
            a generic sales pitch.
          </p>
        </header>

        {status === 'error' && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <fieldset className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 space-y-5">
            <legend className="text-xl font-bold text-white px-2 mb-2">Contact & company</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass} htmlFor="companyName">
                  Company name *
                </label>
                <input
                  id="companyName"
                  required
                  className={inputClass}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="contactName">
                  Your name *
                </label>
                <input
                  id="contactName"
                  required
                  className={inputClass}
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">
                  Work email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="jobTitle">
                  Job title
                </label>
                <input
                  id="jobTitle"
                  className={inputClass}
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="companySize">
                  Company size
                </label>
                <select
                  id="companySize"
                  className={inputClass}
                  value={form.companySize}
                  onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                >
                  <option value="">Select…</option>
                  {COMPANY_SIZE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="industry">
                  Industry
                </label>
                <input
                  id="industry"
                  placeholder="e.g. Healthcare, Real Estate, Agency"
                  className={inputClass}
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="website">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  placeholder="https://"
                  className={inputClass}
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 space-y-5">
            <legend className="text-xl font-bold text-white px-2 mb-2">Project interests *</legend>
            <p className="text-slate-400 text-sm -mt-2 mb-4">Select all that apply.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTEREST_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                    form.interests.includes(opt.id)
                      ? 'border-bee-amber/50 bg-bee-amber/10'
                      : 'border-white/10 bg-black/20 hover:border-white/20'
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-amber-500"
                    checked={form.interests.includes(opt.id)}
                    onChange={() => toggleInterest(opt.id)}
                  />
                  <span className="text-slate-200 text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 space-y-5">
            <legend className="text-xl font-bold text-white px-2 mb-2">Project details *</legend>
            <div>
              <label className={labelClass} htmlFor="projectGoals">
                What do you want AiBHive to accomplish? *
              </label>
              <textarea
                id="projectGoals"
                required
                rows={4}
                placeholder="Describe outcomes: e.g. automate lead outreach, reduce AP processing time, deploy medical transcription hive…"
                className={inputClass}
                value={form.projectGoals}
                onChange={(e) => setForm({ ...form, projectGoals: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="painPoints">
                Biggest pain points today
              </label>
              <textarea
                id="painPoints"
                rows={3}
                placeholder="Manual work, errors, slow turnaround, tool sprawl, compliance risk…"
                className={inputClass}
                value={form.painPoints}
                onChange={(e) => setForm({ ...form, painPoints: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="currentStack">
                Current tools & systems
              </label>
              <textarea
                id="currentStack"
                rows={3}
                placeholder="CRM, ERP, ticketing, EHR, phone system, etc."
                className={inputClass}
                value={form.currentStack}
                onChange={(e) => setForm({ ...form, currentStack: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="successCriteria">
                How will you measure success?
              </label>
              <textarea
                id="successCriteria"
                rows={2}
                placeholder="KPIs, deadlines, accuracy targets, headcount saved…"
                className={inputClass}
                value={form.successCriteria}
                onChange={(e) => setForm({ ...form, successCriteria: e.target.value })}
              />
            </div>
          </fieldset>

          <fieldset className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 space-y-5">
            <legend className="text-xl font-bold text-white px-2 mb-2">Timeline & scheduling</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass} htmlFor="timeline">
                  Desired timeline
                </label>
                <select
                  id="timeline"
                  className={inputClass}
                  value={form.timeline}
                  onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                >
                  <option value="">Select…</option>
                  {TIMELINE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="budget">
                  Budget range (optional)
                </label>
                <select
                  id="budget"
                  className={inputClass}
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                >
                  <option value="">Select…</option>
                  {BUDGET_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="timezone">
                  Your timezone
                </label>
                <input
                  id="timezone"
                  className={inputClass}
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="preferredTimes">
                  Preferred days / times for a live call
                </label>
                <textarea
                  id="preferredTimes"
                  rows={2}
                  placeholder="e.g. Tue–Thu mornings PT, avoid Fridays"
                  className={inputClass}
                  value={form.preferredTimes}
                  onChange={(e) => setForm({ ...form, preferredTimes: e.target.value })}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 space-y-4">
            <legend className="text-xl font-bold text-white px-2 mb-2">Compliance & security</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMPLIANCE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm',
                    form.complianceNeeds.includes(opt.id)
                      ? 'border-bee-amber/50 bg-bee-amber/10 text-slate-200'
                      : 'border-white/10 text-slate-400'
                  )}
                >
                  <input
                    type="checkbox"
                    className="accent-amber-500"
                    checked={form.complianceNeeds.includes(opt.id)}
                    onChange={() => toggleCompliance(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div>
              <label className={labelClass} htmlFor="referralSource">
                How did you hear about AiBHive?
              </label>
              <input
                id="referralSource"
                className={inputClass}
                value={form.referralSource}
                onChange={(e) => setForm({ ...form, referralSource: e.target.value })}
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={status === 'loading' || form.interests.length === 0}
            className="w-full py-4 bg-bee-amber text-bee-black font-bold rounded-xl hover:bg-bee-yellow transition-colors neon-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                Request live call & appointment <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-center text-slate-500 text-sm">
            By submitting, you agree we may contact you about this request. We never sell your data.
          </p>
        </form>
      </div>
    </main>
  );
}
