import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Volume2,
  Globe,
  ArrowRight,
  Hexagon,
  Zap,
  Activity,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import backgroundLogo from '../aibhive_background.png';
import transcriptionServiceImg from '../transcription_service_legal_medical.png';
import aiTranslationImg from '../ai_translation_grow_podcast_youtube_audince.png';
import voiceCloneImg from '../1775556316513.png';
import translationHubImg from '../1775559497156.png';
import fastTranslationImg from '../mr_beast_translation_content_multiplyer.jpg';
import { SEO } from '../components/SEO';

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  link,
  buttonText,
  bgImage,
  reverse = false,
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4 }}
    className={`glass-card min-h-[460px] rounded-xl hover:border-bee-amber/60 transition-all duration-700 group relative overflow-hidden flex flex-col items-stretch ${
      reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
    }`}
  >
    <div className="lg:w-1/2 relative overflow-hidden min-h-[320px]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(245,158,11,0.35),transparent_70%)] blur-2xl opacity-80" />
      <motion.img
        initial={{ scale: 1.15 }}
        whileHover={{ scale: 1.04 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        src={bgImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-bee-black/30 to-transparent lg:hidden" />
      <div
        className={`absolute inset-0 hidden lg:block ${
          reverse
            ? 'bg-gradient-to-l from-bee-black/70 via-transparent to-transparent'
            : 'bg-gradient-to-r from-bee-black/70 via-transparent to-transparent'
        }`}
      />
    </div>

    <div className="lg:w-1/2 p-10 md:p-16 flex flex-col justify-center relative z-10">
      <div className="bg-bee-amber/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-bee-amber group-hover:text-bee-black transition-all duration-500 backdrop-blur-xl border border-white/10">
        <Icon className="w-8 h-8 text-bee-amber group-hover:text-inherit" />
      </div>
      <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-6 group-hover:text-bee-amber transition-colors tracking-tight">
        {title}
      </h3>
      <p className="text-slate-300 mb-10 leading-relaxed text-lg md:text-xl max-w-2xl">
        {description}
      </p>
      <div>
        <Link
          to={link}
          className="inline-flex items-center px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-bee-amber hover:text-bee-black transition-all group/btn backdrop-blur-md text-lg"
        >
          <span>{buttonText}</span>
          <ArrowRight className="ml-3 w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>
  </motion.div>
);

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <main className="relative">
      <SEO />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] flex items-center pt-20 pb-32 overflow-hidden aurora-bg"
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-bee-black/40 via-transparent to-bee-black z-10" />
          <motion.div
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.18 }}
            transition={{ duration: 2.2 }}
            className="w-full h-full"
          >
            <img src={backgroundLogo} alt="" className="w-full h-full object-cover" />
          </motion.div>
        </motion.div>

        {/* Glowing decorative blobs */}
        <div className="absolute -top-20 left-1/3 w-[40rem] h-[40rem] rounded-full bg-bee-amber/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-bee-yellow/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-white/5 border border-bee-amber/30 text-bee-amber text-sm font-bold mb-10 backdrop-blur-md">
                <Sparkles className="w-4 h-4 mr-2 float-fast" />
                THE FUTURE OF CONTENT IS GLOBAL
              </div>
              <h1 className="text-6xl md:text-8xl font-extrabold leading-[1.05] mb-8 tracking-tight">
                <span className="text-white">AI Translation</span>
                <br />
                <span className="text-shimmer">&amp; Voice Cloning</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-12 leading-relaxed font-medium">
                Better-Than-Human Transcription, Translation &amp; Voice Cloning. Powered by a
                collaborative hive of specialized AI agents.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link
                  to="/get-started"
                  className="px-10 py-5 bg-bee-amber text-bee-black font-extrabold rounded-full hover:bg-bee-yellow transition-all neon-glow w-full sm:w-auto text-center text-lg pulse-ring"
                >
                  Try For Free
                </Link>
                <Link
                  to="/grow"
                  className="px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all backdrop-blur-md w-full sm:w-auto text-center text-lg"
                >
                  View Growth Stats
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating hexagons */}
        <div className="absolute top-1/4 right-10 opacity-25 hidden lg:block float-slow">
          <Hexagon className="w-36 h-36 text-bee-amber" />
        </div>
        <div className="absolute bottom-1/4 left-10 opacity-15 hidden lg:block float-medium">
          <Hexagon className="w-52 h-52 text-bee-amber" />
        </div>
        <div className="absolute top-1/2 right-1/4 opacity-10 hidden lg:block float-fast">
          <Hexagon className="w-24 h-24 text-bee-yellow" />
        </div>
      </section>

      {/* Lightning Fast Turnaround */}
      <section className="py-24 bg-bee-amber/5 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center justify-center p-3 bg-bee-amber/10 rounded-2xl mb-6 pulse-ring">
                <Zap className="w-10 h-10 text-bee-amber" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 font-display">
                Lightning-Fast <span className="text-gradient">Turnaround</span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed mb-6 font-medium">
                Upload 60 minutes of audio and get it back in under 15 minutes.
              </p>
              <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                Most jobs are completed in 30 minutes — not hours, not days.
              </p>
              <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                Our SWARM processes your file across multiple GPUs in parallel, so even large files
                move insanely fast.
              </p>
              <p className="text-lg text-slate-400 font-semibold italic border-l-4 border-bee-amber pl-4">
                No more waiting around. Get your translation and voice clone back while you're
                still on your coffee break.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative img-frame-sharp"
            >
              <img
                src={fastTranslationImg}
                alt="Fast AI Translation Processing"
                className="w-full h-auto object-cover scale-105 hover:scale-100 transition-transform duration-700"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Reality */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.9 }}
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-10 leading-tight">
                Make Your Content <br />
                <span className="text-gradient">Available to the World</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                The <span className="text-white font-bold">"Global Reality"</span>: Over 60-70% of
                YouTube views come from outside your home country. You're leaving valuable
                consumership on the table without localization.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <article className="flex items-start space-x-5">
                  <div className="bg-bee-amber/10 p-4 rounded-2xl">
                    <Globe className="w-6 h-6 text-bee-amber" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Global Reach</h3>
                    <p className="text-slate-400">Unlock markets you never thought possible.</p>
                  </div>
                </article>
                <article className="flex items-start space-x-5">
                  <div className="bg-bee-amber/10 p-4 rounded-2xl">
                    <Activity className="w-6 h-6 text-bee-amber" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">2-5x Growth</h3>
                    <p className="text-slate-400">Multiply your views with localized dubs.</p>
                  </div>
                </article>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1 }}
              className="relative img-frame-sharp aspect-square flex items-center justify-center group"
            >
              <div className="absolute inset-0">
                <img
                  src={aiTranslationImg}
                  alt="AI Translation Visualization"
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-95 transition-opacity duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-bee-black/20 to-transparent" />
              </div>

              <div className="absolute bottom-8 left-8 right-8 z-20">
                <Link
                  to="/grow"
                  className="glass-card p-6 rounded-lg flex items-center justify-between border-white/20 hover:border-bee-amber/50 transition-all cursor-pointer block w-full"
                >
                  <div>
                    <div className="text-bee-amber font-bold text-2xl">80M+</div>
                    <div className="text-slate-400 text-sm">Extra Views from Localization</div>
                  </div>
                  <div className="bg-bee-amber text-bee-black p-3 rounded-full shadow-[0_0_24px_rgba(251,191,36,0.5)]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundLogo}
            alt=""
            className="w-full h-full object-cover opacity-10 grayscale"
          />
          <div className="absolute inset-0 bg-bee-black/90" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Hive Services</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Specialized AI agents working together to deliver unparalleled accuracy and speed.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-16">
            <FeatureCard
              icon={Mic}
              title="Transcription Studio"
              description="High-accuracy transcription using multi-agent AI passes for superior accuracy in General, Legal, and Medical fields."
              link="/transcription"
              buttonText="Explore Studio"
              bgImage={transcriptionServiceImg}
            />
            <FeatureCard
              icon={Volume2}
              title="Voice Clone Lab"
              description="Translate your cloned voice into top languages. Turn text into your voice and unlock global markets."
              link="/voice-clone"
              buttonText="Enter Lab"
              bgImage={voiceCloneImg}
              reverse
            />
            <FeatureCard
              icon={Globe}
              title="Translation"
              description="Multi-agent passes ensure accuracy for legal/medical jargon. Better-than-human translations for global reach."
              link="/transcription"
              buttonText="View Growth"
              bgImage={translationHubImg}
            />
          </div>
        </div>
      </section>

      {/* Use-cases call-out — drives the new SEO pages */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <div className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6">
              Built for your workflow
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              See how the Hive fits in
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Tailored playbooks for the people who use AiBhive every day.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'For Podcasters',
                desc: 'Turn one episode into a multilingual show network.',
                href: '/use-cases/podcasters',
              },
              {
                title: 'For YouTubers',
                desc: 'Voice-clone dubs that 2-5x your watch time.',
                href: '/use-cases/youtubers',
              },
              {
                title: 'Legal Transcription',
                desc: 'Court-grade accuracy with citation awareness.',
                href: '/use-cases/legal-transcription',
              },
              {
                title: 'Medical Transcription',
                desc: 'HIPAA-aware clinical notes with verified terms.',
                href: '/use-cases/medical-transcription',
              },
            ].map((card, i) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <Link
                  to={card.href}
                  className="block glass-card rounded-lg p-8 hover:border-bee-amber/50 hover:bg-white/10 transition-all duration-500 group h-full"
                >
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-bee-amber transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">{card.desc}</p>
                  <span className="inline-flex items-center text-bee-amber font-bold">
                    Read more <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="glass-card p-16 rounded-xl text-center relative overflow-hidden glow-halo"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-bee-amber to-transparent" />
            <div className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-8">
              Beta Feature
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Braille Transcription Support
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              We are refining Braille support for top languages. Other languages are currently in
              refinement stages as we expand our accessibility hive.
            </p>
            <button className="px-10 py-4 border border-bee-amber/30 text-white font-bold rounded-full hover:bg-bee-amber hover:text-bee-black transition-all">
              Join Beta Waitlist
            </button>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
