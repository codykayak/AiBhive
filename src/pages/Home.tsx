import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Mic, Volume2, Globe, ArrowRight, Hexagon, Zap, Activity, TrendingUp } from 'lucide-react';
import logo from '../logo.png';
import backgroundLogo from '../aibhive_background.png';
import transcriptionServiceImg from '../transcription_service_legal_medical.png';

const FeatureCard = ({ icon: Icon, title, description, link, buttonText, bgImage }: any) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    className="glass-card min-h-[450px] rounded-[3.5rem] hover:border-bee-amber/60 transition-all duration-700 group relative overflow-hidden flex flex-col lg:flex-row items-stretch"
  >
    {/* Image Side */}
    <div className="lg:w-2/5 relative overflow-hidden min-h-[300px]">
      <motion.img 
        initial={{ scale: 1.1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 1.5 }}
        src={bgImage} 
        alt={title} 
        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-transparent to-transparent lg:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-bee-black/40 via-transparent to-transparent hidden lg:block" />
    </div>

    {/* Content Side */}
    <div className="lg:w-3/5 p-10 md:p-16 flex flex-col justify-center relative z-10">
      <div className="bg-bee-amber/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-bee-amber group-hover:text-bee-black transition-all duration-500 backdrop-blur-xl border border-white/10">
        <Icon className="w-8 h-8 text-bee-amber group-hover:text-inherit" />
      </div>
      <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-6 group-hover:text-bee-amber transition-colors tracking-tight">{title}</h3>
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
  return (
    <main className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden">
        {/* Parallax-ish Background Effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-bee-black via-transparent to-bee-black z-10" />
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 2 }}
            className="w-full h-full bg-center bg-no-repeat bg-contain"
            style={{ backgroundImage: `url(${backgroundLogo})` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-white/5 border border-white/10 text-bee-amber text-sm font-bold mb-10 backdrop-blur-md">
                <Zap className="w-4 h-4 mr-2" />
                THE FUTURE OF CONTENT IS GLOBAL
              </div>
              <h1 className="text-6xl md:text-8xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight">
                AI Translation & Voice Cloning
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-12 leading-relaxed font-medium">
                Better-Than-Human Transcription, Translation & Voice Cloning. Powered by a collaborative hive of specialized AI agents.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link 
                  to="/get-started" 
                  className="px-10 py-5 bg-bee-amber text-bee-black font-extrabold rounded-full hover:bg-bee-yellow transition-all neon-glow w-full sm:w-auto text-center text-lg"
                >
                  Start Your Project
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
        
        {/* Floating Hexagons */}
        <div className="absolute top-1/4 right-10 opacity-20 animate-bounce duration-[5000ms] hidden lg:block">
          <Hexagon className="w-32 h-32 text-bee-amber" />
        </div>
        <div className="absolute bottom-1/4 left-10 opacity-10 animate-pulse duration-[3000ms] hidden lg:block">
          <Hexagon className="w-48 h-48 text-bee-amber" />
        </div>
      </section>

      {/* Global Reality Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-10 leading-tight">
                Make Your Content <br /> <span className="text-gradient">Available to the World</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                The <span className="text-white font-bold">"Global Reality"</span>: Over 60-70% of YouTube views come from outside your home country. You're leaving valuable consumership on the table without localization.
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
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-bee-black/40 backdrop-blur-3xl aspect-square flex items-center justify-center group">
                <div className="absolute inset-0">
                  <img 
                    src="https://picsum.photos/seed/global-translation/1000/1000"
                    alt="AI Translation Visualization" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-bee-black/20 to-transparent" />
                </div>

                <div className="absolute bottom-10 left-10 right-10 z-20">
                  <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-white/20">
                    <div>
                      <div className="text-bee-amber font-bold text-2xl">80M+</div>
                      <div className="text-slate-400 text-sm">Extra Views from Localization</div>
                    </div>
                    <div className="bg-bee-amber text-bee-black p-3 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-bee-amber/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-bee-amber/20 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundLogo} 
            alt="Background" 
            className="w-full h-full object-cover opacity-10 grayscale"
          />
          <div className="absolute inset-0 bg-bee-black/90" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Hive Services</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Specialized AI agents working together to deliver unparalleled accuracy and speed.
            </p>
          </div>
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
              bgImage="https://picsum.photos/seed/voice-hive/800/1200"
            />
            <FeatureCard 
              icon={Globe}
              title="Translation Hub"
              description="Multi-agent passes ensure accuracy for legal/medical jargon. Better-than-human translations for global reach."
              link="/grow"
              buttonText="View Growth"
              bgImage="https://picsum.photos/seed/global-hive-2/800/1200"
            />
          </div>
        </div>
      </section>

      {/* Beta Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-16 rounded-[3rem] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-bee-amber to-transparent" />
            <div className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-8">
              Beta Feature
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Braille Transcription Support</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              We are refining Braille support for top languages. Other languages are currently in refinement stages as we expand our accessibility hive.
            </p>
            <button className="px-10 py-4 border border-bee-amber/30 text-white font-bold rounded-full hover:bg-bee-amber hover:text-bee-black transition-all">
              Join Beta Waitlist
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

