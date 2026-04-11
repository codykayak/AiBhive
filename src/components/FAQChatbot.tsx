import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const faqs = [
  {
    keywords: ['hi', 'hello', 'hey', 'start'],
    answer: "Hello! I'm the AiBhive assistant. How can I help you today? You can ask me about our pricing, services, or how to get started."
  },
  {
    keywords: ['price', 'cost', 'pricing', 'how much'],
    answer: "Our pricing depends on the file type! For Audio/Video: Transcribe + Translate is $2.49/min, Legal/Medical is $3.29/min, and Voice Cloning is $1.99/min. For Text/Documents: Translation is $0.025/word, Legal/Medical is $0.035/word, and Voice Cloning is $0.035/word."
  },
  {
    keywords: ['accuracy', 'accurate', 'quality'],
    answer: "We use a multi-agent AI hive that cross-references terms against specialized databases to deliver up to 99.9% accuracy, exceeding human standards, especially for technical jargon."
  },
  {
    keywords: ['languages', 'translate', 'translation'],
    answer: "We support over 90+ languages globally! Our most popular are English, Spanish, Hindi, Portuguese, Russian, and Indonesian."
  },
  {
    keywords: ['clone', 'voice', 'cloning'],
    answer: "Our Neural Voice Cloning preserves your unique vocal identity, emotion, and tone across different languages. You just need to upload a 30s-2min voice sample!"
  },
  {
    keywords: ['legal', 'medical', 'jargon', 'specialized'],
    answer: "Our Domain Specialist agents cross-reference technical jargon against industry-specific databases to ensure 99.9% accuracy for legal proceedings and clinical notes."
  },
  {
    keywords: ['how long', 'time', 'fast'],
    answer: "Our AI agents work in parallel. For example, 60 minutes of audio can be processed and completed in just 10 minutes!"
  },
  {
    keywords: ['contact', 'support', 'help'],
    answer: "You can reach out to us directly through the 'About & Contact' page or email us at support@aibeehive.com."
  }
];

export default function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Hi there! 👋 I'm the AiBhive assistant. Have any questions about our services or pricing?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputValue('');

    // Simple keyword matching for FAQ
    const lowerInput = userMessage.toLowerCase();
    let foundAnswer = "I'm not quite sure about that yet, but our human team would love to help! Please check out our About & Contact page.";

    for (const faq of faqs) {
      if (faq.keywords.some(keyword => lowerInput.includes(keyword))) {
        foundAnswer = faq.answer;
        break;
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { text: foundAnswer, isUser: false }]);
    }, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden md:block">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-bee-black border border-bee-amber/30 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)] w-80 h-96 flex flex-col overflow-hidden"
          >
            <div className="bg-bee-amber/10 p-4 border-b border-bee-amber/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Bot className="w-5 h-5 text-bee-amber" />
                <span>AiBhive Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.isUser ? 'bg-bee-amber text-bee-black font-medium' : 'bg-white/10 text-slate-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-bee-amber/20 bg-black/20">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center bg-white/5 rounded-lg border border-white/10 overflow-hidden focus-within:border-bee-amber transition-colors"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none"
                />
                <button type="submit" className="p-2 text-bee-amber hover:bg-white/5 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="bg-bee-amber text-bee-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-bee-yellow transition-colors flex items-center justify-center group"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute right-full mr-4 bg-bee-black text-white text-sm py-1 px-3 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Need Help?
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}