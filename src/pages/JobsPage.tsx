import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Briefcase, Building2, Clock, DollarSign, Home, Phone } from 'lucide-react';
import { SEO } from '../components/SEO';
import { JobApplicationForm } from '../components/jobs/JobApplicationForm';
import { JOB_LISTINGS } from '../content/jobListings';
import { SITE_URL } from '../constants/site';

export default function JobsPage() {
  return (
    <main className="relative pb-24">
      <SEO
        title="Sales Jobs — $10–20k/month Commission | AiBhive"
        description="Three remote commission sales openings: AiBhive AI solutions, ManyDoors AI property management, MacroREI appointment setting. 25% commission. ~20 hours/week. Target $10k/month."
        keywords="AiBhive jobs, remote sales jobs, commission sales, ManyDoors AI careers, MacroREI sales, property management sales jobs, AI sales jobs"
        image="/hiring/sales-hero.png"
        jsonLd={[
          {
            '@type': 'ItemList',
            name: 'AiBhive commission sales openings',
            itemListElement: JOB_LISTINGS.map((job, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${SITE_URL}/jobs/${job.slug}`,
              name: `${job.title} — ${job.orgName}`,
            })),
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
          {JOB_LISTINGS.map((job) => (
            <article
              key={job.slug}
              className="group glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-bee-amber/40 transition-colors flex flex-col"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={job.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bee-black/80 to-transparent" />
                {job.brandLogo ? (
                  <img
                    src={job.brandLogo}
                    alt=""
                    className="absolute bottom-3 left-3 h-8 drop-shadow"
                  />
                ) : (
                  <span className="absolute bottom-3 left-3 text-white font-black tracking-tight">
                    {job.slug === 'aibhive' ? (
                      <>
                        Ai<span className="text-bee-amber">B</span>Hive
                      </>
                    ) : (
                      job.orgName
                    )}
                  </span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-bee-amber text-xs font-semibold uppercase tracking-wide mb-1">
                  Remote · 25% commission
                </p>
                <p className="text-white font-bold text-lg mb-1">{job.title}</p>
                <p className="text-sm text-slate-500 mb-2">{job.orgName}</p>
                <p className="text-sm text-slate-400 leading-relaxed flex-1">{job.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to={`/jobs/${job.slug}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-bee-amber text-bee-black text-sm font-bold rounded-lg hover:bg-bee-yellow transition-colors"
                  >
                    Apply
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                  <a
                    href={job.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 border border-white/15 text-sm text-slate-300 rounded-lg hover:border-bee-amber/40 hover:text-white transition-colors"
                  >
                    Visit site
                  </a>
                </div>
              </div>
            </article>
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
        <JobApplicationForm />
      </section>
    </main>
  );
}
