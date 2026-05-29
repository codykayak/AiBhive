import { motion } from 'motion/react';
import { Upload, FileText, Shield, Stethoscope, Scale, ArrowRight, CheckCircle2, Zap, Brain, Database, Lock } from 'lucide-react';
import { useState } from 'react';
import { SEO } from '../components/SEO';
import translationGrowImg from '../ai_translation_grow_podcast_youtube_audince.png';
import transcriptionLegalMedicalImg from '../transcription_service_legal_medical.png';

const modes = [
  { id: 'general', name: 'General', icon: FileText, description: 'Everyday conversations, podcasts, and meetings.' },
  { id: 'legal', name: 'Legal', icon: Scale, description: 'Court proceedings, depositions, and legal documentation.' },
  { id: 'medical', name: 'Medical', icon: Stethoscope, description: 'Clinical notes, patient histories, and medical research.' },
];

export default function TranscriptionStudio() {
  const [selectedMode, setSelectedMode] = useState('general');

  return (
    <main className="py-24">
      <SEO 
        title="AI Transcription Studio - High Accuracy Multi-Agent AI | AiBhive"
        description="AiBhive's Transcription Studio uses a collaborative hive of AI agents to deliver 99.9% accurate transcriptions for legal, medical, and general fields. Better-than-human precision."
        keywords="AI transcription, medical transcription, legal transcription, multi-agent AI, accurate speech to text, AiBhive"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6"
          >
            Precision Studio
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-8"
          >
            Transcription <span className="text-gradient">Studio</span>
          </motion.h1>
          <h2 className="text-2xl md:text-3xl text-white font-medium mb-6">Highly accurate AI Transcriptions for Medical, Legal, Content Creators, and general use.</h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Experience the power of the Hive. Our multi-agent AI passes ensure accuracy that exceeds human standards, especially for technical jargon.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Upload Section */}
          <section className="lg:col-span-2">
            <div className="glass-card rounded-[2.5rem] p-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
                The Enterprise way to batch process audio to text translations.
              </h1>

              <div className="mt-12">
                <h3 className="text-xl font-bold text-white mb-6">Select Transcription Mode</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`p-6 rounded-2xl border transition-all duration-500 text-left group ${
                        selectedMode === mode.id 
                          ? 'border-bee-amber bg-bee-amber/10' 
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <mode.icon className={`w-8 h-8 mb-4 transition-colors duration-500 ${selectedMode === mode.id ? 'text-bee-amber' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <div className="font-bold text-white text-lg">{mode.name}</div>
                      <div className="text-sm text-slate-500 mt-2 leading-relaxed">{mode.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => window.location.href = '/get-started'}
                className="w-full mt-12 py-5 bg-bee-amber text-bee-black font-extrabold rounded-2xl hover:bg-bee-yellow transition-all neon-glow text-lg"
              >
                Transcribe For Free
              </button>
            </div>

            {/* Detailed Content Section */}
            <article className="mt-20 prose prose-invert max-w-none">
              <h2 className="text-4xl font-bold text-white mb-8">The Science of Multi-Agent AI Transcription</h2>
              <div className="text-slate-400 leading-relaxed text-lg">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="float-left mr-12 mb-8 w-full lg:w-1/2 img-frame-sharp"
                >
                  <img
                    src={transcriptionLegalMedicalImg}
                    alt="Transcription Service Legal Medical Visualization"
                    className="w-full h-auto"
                  />
                </motion.div>
                <p className="mb-6">
                  Traditional AI transcription relies on a single neural network model to interpret audio. While this works for casual conversations, it often fails in high-stakes environments like courtrooms or hospitals where specialized terminology is the norm.
                </p>
                <p className="mb-6">
                  AiBhive's <span className="text-white font-bold">Multi-Agent Hive Architecture</span> changes the game. Instead of one model, we deploy a swarm of specialized agents. One agent focuses on acoustic clarity, another on linguistic context, and a third—the "Domain Specialist"—cross-references technical jargon against industry-specific databases.
                </p>
                <p className="mb-6">
                  Our process involves multiple "consensus passes." If the Acoustic Agent and the Context Agent disagree on a word, the Hive initiates a "Reasoning Pass" where a Supervisor Agent evaluates the surrounding sentence structure and historical data to determine the most accurate interpretation.
                </p>
                <p>
                  This collaborative approach allows us to achieve <span className="text-bee-amber font-bold">99.9% accuracy</span>, effectively eliminating the need for manual human proofreading in most cases.
                </p>
              </div>

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="glass-card p-8 rounded-2xl">
                  <Brain className="w-10 h-10 text-bee-amber mb-6" />
                  <h4 className="text-white font-bold text-xl mb-4">Contextual Intelligence</h4>
                  <p className="text-slate-400 text-sm">Our agents understand the "why" behind the words, ensuring homophones are correctly identified based on the topic.</p>
                </div>
                <div className="glass-card p-8 rounded-2xl">
                  <Database className="w-10 h-10 text-bee-amber mb-6" />
                  <h4 className="text-white font-bold text-xl mb-4">Jargon Databases</h4>
                  <p className="text-slate-400 text-sm">Specialized libraries for legal, medical, and engineering fields are integrated into the Hive's memory.</p>
                </div>
                <div className="glass-card p-8 rounded-2xl">
                  <Lock className="w-10 h-10 text-bee-amber mb-6" />
                  <h4 className="text-white font-bold text-xl mb-4">Enterprise Security</h4>
                  <p className="text-slate-400 text-sm">Your data is encrypted at rest and in transit. We follow strict HIPAA and GDPR compliance protocols.</p>
                </div>
              </div>
            </article>

            {/* Examples Section */}
            <section className="mt-20">
              <h3 className="text-3xl font-bold text-white mb-8">The Hive Difference in Action</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card rounded-2xl p-8 border-red-500/10">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Standard AI / Human</div>
                  <p className="text-slate-400 italic text-lg leading-relaxed">"...the patient has a history of sub-acute myocardial infarction and was prescribed a statin..."</p>
                  <div className="mt-6 text-sm text-slate-500 flex items-center">
                    <Shield className="w-4 h-4 mr-2" /> Missed nuance: "sub-acute" vs "acute"
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-8 border-bee-amber/30 bg-bee-amber/5">
                  <div className="text-xs font-bold text-bee-amber uppercase tracking-widest mb-4">The Hive (Multi-Agent)</div>
                  <p className="text-white italic text-lg leading-relaxed">"...the patient has a history of subacute myocardial infarction and was prescribed atorvastatin..."</p>
                  <div className="mt-6 text-sm text-bee-amber font-bold flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Medical Agent Verified
                  </div>
                </div>
              </div>
            </section>
          </section>

          {/* Sidebar Section */}
          <aside className="space-y-10">
            <section className="glass-card rounded-[2rem] p-10 border-bee-amber/20 bg-bee-amber/5">
              <h3 className="text-2xl font-bold text-white mb-6">Test the Hive</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Send us a 2-minute clip and see the multi-agent accuracy for yourself. Free of charge.
              </p>
              <button
                onClick={() => window.location.href = '/get-started'}
                className="w-full py-4 bg-bee-amber/10 border border-bee-amber/30 text-bee-amber font-bold rounded-xl hover:bg-bee-amber hover:text-bee-black transition-all"
              >
                Get Free Sample
              </button>
            </section>

            <section className="glass-card rounded-[2rem] p-10">
              <h3 className="text-xl font-bold text-white mb-6">Why Accuracy Matters</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                In legal and medical fields, a single misheard word can change the entire meaning of a document. 
                Our Hive uses specialized agents that cross-reference terminology against massive databases of 
                professional jargon to ensure 99.9% accuracy.
              </p>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-start">
                  <Zap className="w-4 h-4 text-bee-amber mr-3 mt-1 shrink-0" />
                  <span>Eliminate costly manual editing cycles.</span>
                </li>
                <li className="flex items-start">
                  <Zap className="w-4 h-4 text-bee-amber mr-3 mt-1 shrink-0" />
                  <span>Ensure compliance with industry standards.</span>
                </li>
                <li className="flex items-start">
                  <Zap className="w-4 h-4 text-bee-amber mr-3 mt-1 shrink-0" />
                  <span>Speed up documentation workflows by 10x.</span>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

