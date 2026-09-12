import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Home,
  Loader2,
  Phone,
  Upload,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { SITE_URL } from '../constants/site';

const PRODUCTS = [
  {
    id: 'aibhive',
    name: 'AiBhive',
    href: 'https://aibhive.com',
    image: '/hiring/hive-brand.png',
    logo: null as string | null,
    pitch: 'Cutting-edge AI technology solutions for businesses — agents, apps, and automation they can actually run.',
    sell: 'Enterprise AI, Hive Apps, and custom agentic workflows.',
  },
  {
    id: 'manydoors',
    name: 'ManyDoors AI',
    href: 'https://www.manydoorsai.com',
    image: '/hiring/manydoors-software.png',
    logo: '/hiring/manydoors-logo.svg',
    pitch: 'Property-management portfolios plus software and apps for the people in the field.',
    sell: 'Multifamily ops, resident comms, and service-tech apps.',
  },
  {
    id: 'macrorei',
    name: 'MacroREI',
    href: 'https://macrorei.com',
    image: '/hiring/macrorei-house.png',
    logo: null as string | null,
    pitch: 'Finding houses to flip — Oregon cash-home-buyer deals and investor acquisition.',
    sell: 'Off-market inventory, motivated sellers, and flip pipeline.',
  },
] as const;

const CALL_OPTIONS = [
  { id: 'weekday-morning', label: 'Weekday mornings (8am–12pm PT)' },
  { id: 'weekday-afternoon', label: 'Weekday afternoons (12pm–5pm PT)' },
  { id: 'weekday-evening', label: 'Weekday evenings (5pm–8pm PT)' },
  { id: 'weekend', label: 'Weekends' },
  { id: 'specific', label: 'I’ll write a specific window below' },
] as const;

const JOB_DESCRIPTION =
  'Commission sales for the AiBhive family: sell AiBhive AI solutions, ManyDoors AI property-management software, or MacroREI house-flip acquisition. Choose the product you want to close. Multiple openings. High commission. Target $10,000–$20,000 per month at about 20 hours per week.';

export default function JobsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [products, setProducts] = useState<string[]>([]);
  const [aboutYou, setAboutYou] = useState('');
  const [callTime, setCallTime] = useState('');
  const [callTimeNote, setCallTimeNote] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleProduct = (id: string) => {
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

    const body = new FormData();
    body.set('name', name);
    body.set('email', email);
    body.set('phone', phone);
    body.set('products', products.join(','));
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

  const inputClass =
    'w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-bee-amber/50 transition-colors';
  const labelClass = 'block text-sm font-semibold text-slate-300 mb-2';

  return (
    <main className="relative pb-24">
      <SEO
        title="Sales Jobs — $10–20k/month Commission | AiBhive"
        description="Multiple commission sales openings across AiBhive, ManyDoors AI, and MacroREI. Pick the product you want to sell. High commissions. About 20 hours a week. Apply at aibhive.com/jobs."
        keywords="AiBhive jobs, commission sales, ManyDoors AI careers, MacroREI sales, property management sales jobs, real estate flip sales, AI sales jobs"
        image="/hiring/sales-hero.png"
        jsonLd={[
          {
            '@type': 'JobPosting',
            title: 'Commission Sales — AiBhive, ManyDoors AI, or MacroREI',
            description: JOB_DESCRIPTION,
            datePosted: '2026-09-11',
            employmentType: 'COMMISSION',
            hiringOrganization: { '@id': `${SITE_URL}/#organization` },
            jobLocation: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Eugene',
                addressRegion: 'OR',
                addressCountry: 'US',
              },
            },
            jobLocationType: 'TELECOMMUTE',
            applicantLocationRequirements: { '@type': 'Country', name: 'United States' },
            url: `${SITE_URL}/jobs`,
            directApply: true,
          },
        ]}
      />

      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <img
          src="/hiring/sales-hero.png"
          alt="AiBhive sales closer on a couch with cash, on the phone — high-commission recruiting ad"
          className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-bee-black/75 to-bee-black/25" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-32">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-bee-amber font-semibold text-sm uppercase tracking-widest mb-4"
          >
            Now hiring · Commission sales
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.08] max-w-4xl mb-6"
          >
            Pick your product.
            <br />
            <span className="text-gradient">Close like this.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-slate-200 max-w-2xl leading-relaxed mb-8"
          >
            Multiple openings across three businesses. All commission. Super-high commissions.
            Top closers make <strong className="text-white">$10–20k a month</strong> working about{' '}
            <strong className="text-white">20 hours a week</strong>. You choose what you sell.
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            href="#apply"
            className="inline-flex items-center gap-2 px-8 py-4 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors neon-glow"
          >
            Apply in two minutes
            <ArrowRight className="w-5 h-5" aria-hidden />
          </motion.a>
        </div>
      </section>

      <section className="border-y border-bee-amber/15 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: DollarSign, label: '$10–20k / month', sub: 'High commission' },
            { icon: Clock, label: '~20 hours / week', sub: 'Minimum, flexible' },
            { icon: Briefcase, label: 'Three desks', sub: 'You pick the product' },
            { icon: Phone, label: 'Phone-first', sub: 'Talk. Close. Repeat.' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <item.icon className="w-5 h-5 text-bee-amber mt-0.5 shrink-0" />
              <div>
                <p className="text-white font-semibold">{item.label}</p>
                <p className="text-sm text-slate-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Three products. Your pick.</h2>
        <p className="text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Same playbook, three different conversations. Sell the one you already know — or the one
          you want to learn. We have seats opening on all three.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <a
              key={product.id}
              href={product.href}
              target="_blank"
              rel="noreferrer"
              className="group glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-bee-amber/40 transition-colors flex flex-col"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={product.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bee-black/80 to-transparent" />
                {product.logo ? (
                  <img
                    src={product.logo}
                    alt=""
                    className="absolute bottom-3 left-3 h-8 drop-shadow"
                  />
                ) : (
                  <span className="absolute bottom-3 left-3 text-white font-black tracking-tight">
                    {product.id === 'aibhive' ? (
                      <>
                        Ai<span className="text-bee-amber">B</span>Hive
                      </>
                    ) : (
                      product.name
                    )}
                  </span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-white font-bold text-lg mb-2">{product.name}</p>
                <p className="text-sm text-slate-400 leading-relaxed flex-1">{product.pitch}</p>
                <p className="mt-4 text-sm text-bee-amber font-semibold inline-flex items-center gap-1">
                  Visit site <ArrowRight className="w-4 h-4" />
                </p>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-sm text-slate-400">
          <p className="flex gap-2">
            <Bot className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
            AiBhive: businesses that need AI now.
          </p>
          <p className="flex gap-2">
            <Building2 className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
            ManyDoors: portfolios + techs in the truck.
          </p>
          <p className="flex gap-2">
            <Home className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
            MacroREI: houses worth flipping.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <img
            src="/hiring/manydoors-field.png"
            alt="Field service team using ManyDoors and AiBhive Pros tools on site"
            className="w-full h-56 md:h-72 object-cover"
          />
        </div>
        <p className="text-xs text-slate-500 mt-3">
          ManyDoors AI + AiBhive Pros — the apps service people actually use.
        </p>
      </section>

      <section id="apply" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-10 text-center border border-green-500/20"
          >
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Application received</h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              We’ll review your resume and call you at the time you gave us. If anything’s urgent,
              email hello@aibhive.com.
            </p>
            <Link to="/" className="text-bee-amber font-semibold hover:text-bee-yellow">
              Back to AiBhive
            </Link>
          </motion.div>
        ) : (
          <>
            <header className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Apply</h2>
              <p className="text-slate-400 leading-relaxed">
                Short form. Resume, a few sentences, and when to call. That’s it.
              </p>
            </header>

            {status === 'error' && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 space-y-6">
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

              <fieldset>
                <legend className={`${labelClass} mb-3`}>What do you want to sell? *</legend>
                <div className="space-y-2">
                  {PRODUCTS.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:border-bee-amber/30 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-amber-500"
                        checked={products.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                      />
                      <span>
                        <span className="text-white font-semibold">{product.name}</span>
                        <span className="block text-sm text-slate-400">{product.sell}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

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
                Commission-only roles. Results vary. We’ll only use this to schedule your call.
              </p>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
