import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import codyChatIcon from '../../cody/src/cody_m_sims.png';

type ChatMessage = { text: string; isUser: boolean };

const WELCOME = "Hi, I'm Cody, your AI assistant. How can I help?";

export default function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: WELCOME, isUser: false },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          text: "I'm having trouble connecting right now. Please try again, visit /book-consultation, or email hello@aibhive.com.",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="bg-bee-black border border-bee-amber/30 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] w-[min(100vw-2.5rem,24rem)] h-[28rem] flex flex-col overflow-hidden mb-3"
          >
            <div className="bg-bee-amber/10 p-4 border-b border-bee-amber/20 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={codyChatIcon}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border-2 border-bee-amber/60 shrink-0"
                />
                <span className="text-white font-bold truncate">Cody</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
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
                  placeholder="Type your question…"
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
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-full p-0.5 bg-gradient-to-br from-bee-amber to-bee-yellow shadow-[0_0_24px_rgba(245,158,11,0.45)] ring-2 ring-bee-amber/80 ring-offset-2 ring-offset-bee-black"
        aria-label={isOpen ? 'Close chat with Cody' : 'Chat with Cody'}
        aria-expanded={isOpen}
      >
        <img
          src={codyChatIcon}
          alt="Chat with Cody"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover block"
          width={64}
          height={64}
        />
      </motion.button>
    </div>,
    document.body
  );
}
