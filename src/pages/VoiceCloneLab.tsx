import { motion } from 'motion/react';
import { Volume2, Globe, TrendingUp, Play, CheckCircle2, Languages, Mic2, ArrowRight, Zap, Shield, Cpu, Music } from 'lucide-react';
import { SEO } from '../components/SEO';

const stats = [
  { label: 'View Growth', value: '2-5x', icon: TrendingUp },
  { label: 'Global Reach', value: '10+ Langs', icon: Globe },
  { label: 'Accuracy', value: '99.9%', icon: CheckCircle2 },
];

export default function VoiceCloneLab() {
  return (
    <main className="py-24">
      <SEO 
        title="Ai Voice Clone Lab | 60 Mins Audio Done in 10 mins"
        description="AiBhive's Voice Clone Lab allows you to replicate your unique vocal identity in over 10 languages. Maintain your tone, emotion, and personality across the globe with our advanced AI."
        keywords="AI voice cloning, voice synthesis, multilingual AI voice, neural voice cloning, AiBhive, voice translation"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6"
          >
            Vocal Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-8"
          >
            Ai Voice Clone <span className="text-gradient">Lab</span>
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Clone your voice and speak to the world. Translate your unique vocal identity into the globe's top ten languages instantly.
          </p>
        </header>

        {/* Hero Image Section */}
        <section className="mb-24 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative group">
            <img
              src="/ai_voice_translation_clone_lab.png"
              alt="Ai Voice Clone Lab"
              className="w-full object-cover max-h-[500px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-transparent to-transparent opacity-80" />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24">
          {stats.map((stat) => (
            <article key={stat.label} className="glass-card p-10 rounded-[2rem] text-center group hover:border-bee-amber/40 transition-all duration-500">
              <div className="bg-bee-amber/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-bee-amber group-hover:text-bee-black transition-all duration-500">
                <stat.icon className="w-8 h-8 text-bee-amber group-hover:text-inherit" />
              </div>
              <div className="text-4xl font-extrabold text-white mb-2">{stat.value}</div>
              <h3 className="text-slate-500 text-sm uppercase tracking-widest font-bold">{stat.label}</h3>
            </article>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <section className="glass-card rounded-[2.5rem] p-12">
            <h2 className="text-3xl font-bold text-white mb-10 flex items-center">
              <Mic2 className="w-8 h-8 mr-4 text-bee-amber" />
              Start Your Clone
            </h2>
            
            <div className="space-y-10">
              <div>
                <label className="block text-slate-300 text-lg font-bold mb-5">1. Upload Voice Sample (30s - 2min)</label>
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-bee-amber/40 transition-all duration-500 cursor-pointer bg-white/5 group">
                  <Volume2 className="w-12 h-12 text-bee-amber mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-white font-bold">Click to upload sample</p>
                  <p className="text-slate-500 text-sm mt-2">High quality audio recommended</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-lg font-bold mb-5">2. Choose Target Languages</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {['Hindi', 'Spanish', 'Portuguese', 'Indonesian', 'French', 'German'].map((lang) => (
                    <div key={lang} className="flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                      <input type="checkbox" className="w-5 h-5 accent-bee-amber mr-3 cursor-pointer" />
                      <span className="text-slate-300 font-medium">{lang}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => window.location.href = '/get-started'}
                className="w-full py-5 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow flex items-center justify-center text-lg"
              >
                Clone Your Voice <ArrowRight className="ml-3 w-6 h-6" />
              </button>
            </div>
          </section>

          <aside className="space-y-12">
            <section className="glass-card rounded-[2.5rem] p-12 border-bee-amber/20 bg-bee-amber/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Languages className="w-32 h-32 text-bee-amber" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Creator Success</h3>
              <blockquote className="text-xl text-slate-300 mb-10 leading-relaxed italic">
                "Adding a Hindi dub to my podcast increased my reach by 40% in just one month. The Hive's voice cloning is so natural, my audience in India thought I was fluent!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-2xl bg-bee-amber/20 mr-4 border border-bee-amber/30" />
                <div>
                  <div className="text-white font-extrabold text-lg">Alex Rivera</div>
                  <div className="text-bee-amber font-bold text-sm">Tech Podcast Creator</div>
                </div>
              </div>
            </section>

            <section className="glass-card rounded-[2.5rem] p-12">
              <h3 className="text-2xl font-bold text-white mb-6">60 Mins Audio Done in 10 mins</h3>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                We swap process your audio using multiple agents and high powered GPU's...
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Paste link or upload" 
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-bee-amber transition-all"
                />
                <button className="px-8 py-4 bg-bee-amber/10 border border-bee-amber/30 text-bee-amber font-bold rounded-xl hover:bg-bee-amber hover:text-bee-black transition-all">
                  Try Now
                </button>
              </div>
            </section>
          </aside>
        </div>

        {/* Detailed Content Section */}
        <article className="mt-32 prose prose-invert max-w-none">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Neural Voice Synthesis: Preserving Your Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-slate-400 leading-relaxed text-lg">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Beyond Text-to-Speech</h3>
              <p className="mb-6">
                Most voice synthesis technologies create "robotic" or "generic" voices that lack the emotional resonance of the original speaker. AiBhive's <span className="text-white font-bold">Neural Identity Cloning</span> technology is different. We don't just replicate your pitch; we capture your unique prosody, cadence, and emotional nuances.
              </p>
              <p>
                Our Hive of agents analyzes over 200 distinct vocal markers in your sample. This includes the subtle way you emphasize certain syllables, the rhythm of your breathing, and the specific timbre that makes your voice recognizable to your audience.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Cross-Lingual Consistency</h3>
              <p className="mb-6">
                The biggest challenge in global content is maintaining a consistent brand voice across different languages. If you sound authoritative in English but high-pitched in Spanish, your brand identity is diluted.
              </p>
              <p>
                AiBhive ensures that your "Vocal DNA" remains intact regardless of the language. When we translate your voice into Hindi or German, our agents map your specific vocal characteristics onto the phonemes of the target language, ensuring you sound like <span className="text-bee-amber font-bold">you</span>, no matter where your audience is listening.
              </p>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Cpu className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Neural Mapping</h4>
              <p className="text-slate-400 text-sm">Advanced deep learning models that map vocal identity across linguistic boundaries.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Music className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Prosody Preservation</h4>
              <p className="text-slate-400 text-sm">We maintain the musicality and rhythm of your speech, avoiding the "uncanny valley" effect.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Shield className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Voice Security</h4>
              <p className="text-slate-400 text-sm">Your voice data is protected with biometric-grade security. We never use your voice without permission.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-bee-amber/10">
              <Zap className="w-10 h-10 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-xl mb-4">Instant Synthesis</h4>
              <p className="text-slate-400 text-sm">Once your model is trained, generating multilingual content takes seconds, not days.</p>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
