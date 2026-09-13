import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Clock, DollarSign, MapPin, Phone } from 'lucide-react';
import { SEO } from '../components/SEO';
import { JobApplicationForm } from '../components/jobs/JobApplicationForm';
import { JobCommissionCalculator } from '../components/jobs/JobCommissionCalculator';
import {
  JOB_DATE_POSTED,
  JOB_VALID_THROUGH,
  jobBySlug,
  jobPostingJsonLd,
  jobUrl,
} from '../content/jobListings';

export default function JobListingPage() {
  const { slug } = useParams<{ slug: string }>();
  const job = jobBySlug(slug);

  if (!job) {
    return <Navigate to="/jobs" replace />;
  }

  const pageTitle = `${job.title} — Remote Commission Sales`;
  const pageDescription = `${job.summary} 25% commission. 100% remote (US). ~20 hours/week. Target $10,000/month. Apply at ${jobUrl(job.slug)}.`;

  return (
    <main className="relative pb-24">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${job.orgName} jobs, remote sales, commission sales, ${job.title}, work from home`}
        image={job.image}
        standaloneJsonLd={jobPostingJsonLd(job)}
      />

      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <img
          src={job.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-bee-black/80 to-bee-black/30" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 pt-28">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-bee-amber mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            All openings
          </Link>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-bee-amber font-semibold text-sm uppercase tracking-widest mb-3"
          >
            {job.orgName} · Remote · Commission
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4"
          >
            {job.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-200 leading-relaxed max-w-2xl mb-8"
          >
            {job.summary}
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            href="#apply"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors"
          >
            Apply now
            <ArrowRight className="w-5 h-5" aria-hidden />
          </motion.a>
        </div>
      </section>

      <section className="border-y border-bee-amber/15 bg-black/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid sm:grid-cols-3 gap-6">
          {[
            { icon: MapPin, label: '100% remote', sub: 'United States' },
            { icon: DollarSign, label: '25% commission', sub: 'Target $10k/mo' },
            { icon: Clock, label: '~20 hrs / week', sub: 'Part-time, flexible' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <item.icon className="w-5 h-5 text-bee-amber mt-0.5 shrink-0" aria-hidden />
              <div>
                <p className="text-white font-semibold">{item.label}</p>
                <p className="text-sm text-slate-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">The role</h2>
          <ul className="space-y-3 text-slate-300 leading-relaxed list-disc pl-5">
            {job.role.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <JobCommissionCalculator job={job} />

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Pay</h2>
          <ul className="space-y-3 text-slate-300 leading-relaxed list-disc pl-5">
            {job.pay.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">How the work is done</h2>
          <ul className="space-y-3 text-slate-300 leading-relaxed list-disc pl-5">
            {job.how.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-500 flex items-center gap-2">
            <Phone className="w-4 h-4" aria-hidden />
            Phone-first. You work from home.
          </p>
        </section>

        <p className="text-xs text-slate-600">
          Posted {JOB_DATE_POSTED}. Open through{' '}
          {new Date(JOB_VALID_THROUGH).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          . Learn more at{' '}
          <a href={job.siteUrl} className="text-bee-amber hover:underline" target="_blank" rel="noreferrer">
            {job.siteUrl.replace(/^https?:\/\//, '')}
          </a>
          .
        </p>
      </div>

      <section id="apply" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <JobApplicationForm
          lockedProduct={job.slug}
          heading={`Apply — ${job.title}`}
          subheading={`Resume, a few sentences, and when to call. This application is for ${job.orgName}.`}
        />
      </section>
    </main>
  );
}
