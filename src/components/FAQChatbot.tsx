import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

type ChatMessage = { text: string; isUser: boolean };

const WELCOME =
  "Hi there! I'm the AiBHive assistant powered by Gemini. Ask about agentic automation (real estate, phone/SMS, lead gen), transcription pricing, or booking a consultation.";

export default function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: WELCOME, isUser: false },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setInputValue('');
    setIsLoading(true);

    const history = messages
      .filter((m) => m.text !== WELCOME)
      .map((m) => ({
        role: m.isUser ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

    try {
      const res = await fetch('/api/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setMessages((prev) => [...prev, { text: data.reply, isUser: false }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          text: "I'm having trouble connecting right now. Please try again in a moment, visit /book-consultation for B2B automation, or email hello@aibhive.com.",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-bee-black border border-bee-amber/30 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)] w-80 sm:w-96 h-[28rem] flex flex-col overflow-hidden"
          >
            <div className="bg-bee-amber/10 p-4 border-b border-bee-amber/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Bot className="w-5 h-5 text-bee-amber" />
                <span>AiBHive Assistant</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-sm whitespace-pre-wrap ${
                      msg.isUser
                        ? 'bg-bee-amber text-bee-black font-medium'
                        : 'bg-white/10 text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-xl p-3 text-slate-400 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-bee-amber" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-bee-amber/20 bg-black/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex items-center bg-white/5 rounded-lg border border-white/10 overflow-hidden focus-within:border-bee-amber transition-colors"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about solutions, pricing…"
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2 text-bee-amber hover:bg-white/5 transition-colors disabled:opacity-40"
                  aria-label="Send message"
                >
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
            aria-label="Open AiBHive assistant"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute right-full mr-4 bg-bee-black text-white text-sm py-1 px-3 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Need Help?
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
