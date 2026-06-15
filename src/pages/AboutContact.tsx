import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Mail,
  MessageSquare,
  HelpCircle,
  Hexagon,
  Shield,
  Users,
  Globe,
  Zap,
  Cpu,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { BOOK_CONSULTATION_PATH } from '../constants/navigation';

const faqs = [
  { q: "What makes AiBhive different from standard AI?", a: "We use a multi-agent 'Hive' approach. Instead of one AI pass, multiple specialized agents (General, Legal, Medical) cross-verify the output to ensure human-level accuracy." },
  { q: "How long does voice cloning take?", a: "Initial cloning takes about 24 hours for the highest quality. Once cloned, generation is near-instant." },
  { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and specialized agents that don't store your sensitive PII." },
  { q: "Can I use AiBhive for medical or legal documents?", a: "Yes. Our Hive includes agents specifically trained in medical and legal terminology to ensure high-stakes accuracy." },
  { q: "What languages do you support?", a: "We currently support over 10 major global languages for voice cloning and over 50 for transcription and translation." },
];

export default function AboutContact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api/contact-message`
          : '/api/contact-message',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not send message.');
      }
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <main className="py-24">
      <SEO 
        title="About AiBhive - The Science of Multi-Agent AI | Contact Us"
        description="Learn about AiBhive's mission to revolutionize transcription and voice cloning through our unique Hive architecture. Contact our team for enterprise AI solutions."
        keywords="about AiBhive, multi-agent AI, AI transcription company, voice cloning technology, AI contact, AiBhive mission"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32 items-center">
          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <header>
              <div className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-8">
                Our Story
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight">
                What is <span className="text-gradient">AiBhive?</span>
              </h1>
            </header>
            <div className="space-y-8 text-slate-400 text-xl leading-relaxed">
              <p>
                AiBhive is a multi-agent AI hub built for creators, professionals, and accuracy freaks. 
                We believe that in a world of generic AI, precision is the ultimate differentiator.
              </p>
              <p>
                Our "Hive" architecture mimics a biological beehive, where specialized agents work in 
                unison to solve complex transcription and translation tasks. Whether it's high-stakes 
                legal jargon or nuanced medical terminology, the Hive ensures nothing is lost in translation.
              </p>
              <div className="flex items-center p-6 glass-card rounded-[2rem] border-bee-amber/20 bg-bee-amber/5">
                <div className="bg-bee-amber/20 p-4 rounded-2xl mr-6">
                  <Users className="w-8 h-8 text-bee-amber" />
                </div>
                <span className="text-lg text-slate-300">
                  <span className="text-white font-extrabold block text-xl mb-1">The Team</span> Powered by Gemini + specialized open-source agents.
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-card rounded-[3rem] p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Hexagon className="w-64 h-64 text-bee-amber" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-10 flex items-center">
              <MessageSquare className="w-8 h-8 mr-4 text-bee-amber" />
              Get in Touch
            </h2>
            <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
              {status === 'success' && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p>Message sent. We will get back to you soon.</p>
                </div>
              )}
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="name" className="block text-slate-300 font-bold text-sm mb-3 uppercase tracking-wider">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-bee-amber outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-slate-300 font-bold text-sm mb-3 uppercase tracking-wider">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-bee-amber outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-slate-300 font-bold text-sm mb-3 uppercase tracking-wider">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  minLength={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-bee-amber outline-none transition-all"
                  placeholder="How can the Hive help you?"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-5 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                Send Message
              </button>
              <p className="text-center text-sm text-slate-500">
                Need a full B2B scoping call?{' '}
                <Link to={BOOK_CONSULTATION_PATH} className="text-bee-amber hover:underline">
                  Book a consultation
                </Link>
              </p>
            </form>
          </motion.section>
        </div>

        {/* Detailed About Content */}
        <article className="prose prose-invert max-w-none mb-32">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">The Philosophy of the Hive</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-slate-400 leading-relaxed text-lg">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Why Multi-Agent?</h3>
              <p className="mb-6">
                Single-model AI often suffers from "hallucinations" or over-generalization. When you ask a general-purpose model to transcribe a complex medical lecture, it might miss subtle phonetic differences between drug names.
              </p>
              <p>
                AiBhive solves this by deploying a <span className="text-white font-bold">Collaborative Intelligence</span> model. One agent handles the initial transcription, while a second agent—specialized in the specific domain—reviews the output for technical accuracy. A third agent then ensures the linguistic flow and tone are preserved. This "checks and balances" system is what allows us to achieve 99.9% accuracy.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Our Mission</h3>
              <p className="mb-6">
                Our mission is to democratize high-end content localization. We want to give every creator the tools that were previously only available to major Hollywood studios or multi-billion dollar corporations.
              </p>
              <p>
                By combining the power of Google's Gemini with our proprietary agent orchestration layer, we've built a platform that is faster, more accurate, and more secure than anything else on the market. We are not just building a tool; we are building the <span className="text-bee-amber font-bold">infrastructure for a borderless digital world</span>.
              </p>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Globe className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Global First</h4>
              <p className="text-slate-400 text-sm">Designed from the ground up to handle the world's most complex linguistic challenges.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Zap className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Speed of Light</h4>
              <p className="text-slate-400 text-sm">Our distributed agent network ensures that even the largest projects are completed in record time.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Cpu className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Tech Excellence</h4>
              <p className="text-slate-400 text-sm">Leveraging the latest breakthroughs in neural networks and agentic workflows.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Lock className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Privacy Centric</h4>
              <p className="text-slate-400 text-sm">Your data is yours. We implement strict zero-retention policies for sensitive enterprise data.</p>
            </div>
          </div>
        </article>

        <section className="mb-32">
          <header className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 flex items-center justify-center">
              <HelpCircle className="w-10 h-10 mr-4 text-bee-amber" />
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Everything you need to know about the Hive's intelligence.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {faqs.map((faq, i) => (
              <article key={i} className="glass-card p-10 rounded-[2.5rem] hover:border-white/20 transition-all duration-500">
                <h3 className="text-2xl font-bold text-white mb-6">{faq.q}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="text-center py-16 border-t border-white/5">
          <nav className="flex justify-center space-x-12 text-slate-500 font-bold text-sm uppercase tracking-widest">
            <a href="#" className="hover:text-bee-amber transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-bee-amber transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-bee-amber transition-colors">Socials</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}

