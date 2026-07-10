import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { SEO } from '../components/SEO';
import DirectAnswer from '../components/DirectAnswer';
import { faqs } from '../components/FAQData';
import { SITE_TAGLINE } from '../constants/site';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-bee-black pt-24 pb-20 relative overflow-hidden">
      <SEO
        title="Frequently Asked Questions | AiBhive"
        description="AiBhive FAQ: how Bhive Builder works, Hive Apps pricing, BYOK keys, Research Lab tools, real estate AI, multi-agent transcription, and enterprise automation."
        keywords="AiBhive FAQ, Bhive Builder, Hive Apps pricing, BYOK, Research Lab, real estate AI"
        faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))}
      />

      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-bee-amber/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-bee-amber/10 rounded-2xl mb-6">
            <MessageCircleQuestion className="w-10 h-10 text-bee-amber" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 font-display">
            Frequently Asked <span className="text-bee-amber">Questions</span>
          </h1>
          <DirectAnswer>{SITE_TAGLINE}</DirectAnswer>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Bhive Builder, Hive Apps, SWARM transcription, pricing, and enterprise automation—answers stay in
            this page for search engines and AI assistants.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <h2 className="text-lg font-bold text-white pr-8">{faq.question}</h2>
                <div
                  className={`p-2 rounded-full bg-bee-amber/10 text-bee-amber transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                >
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              {/* Always in DOM for crawlers; visually collapsed when closed */}
              <div
                className={`px-6 pb-5 text-slate-300 leading-relaxed border-t border-white/5 pt-4 ${openIndex === index ? 'block' : 'hidden'}`}
              >
                {faq.answer}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
