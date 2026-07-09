import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import {
  loadAssistantHistory,
  saveAssistantHistory,
  type WebAssistantMessage,
} from '../../../lib/homeAssistantHistory';
import {
  preloadHomeAssistantKnowledge,
  sendHomeAssistantTurn,
  runHomeAssistantWebSearch,
  type ChatTurn,
} from '../../../lib/homeAssistantWeb';
import styles from '../oldWorldResearch.module.css';

const WELCOME =
  "I'm Bhive Builder — your Research copilot. Ask me to customize maps, refine archive searches, chain Fable Scrape → OCR → RAG, or build custom research tools.";

const QUICK = [
  { label: 'Map star forts', text: 'Help me build a custom map of star forts in Europe with archive sources' },
  { label: 'Scrape plan', text: 'Plan a Fable Scrape workflow for world fair photographs and Sanborn maps' },
  { label: 'Customize app', text: 'Customize Old Tartar Research: anomaly rules, new archive sources, entity extraction' },
];

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function OwrBuilderPanel() {
  const sectionRef = useRef<HTMLElement>(null);
  const [messages, setMessages] = useState<WebAssistantMessage[]>(() => {
    const saved = loadAssistantHistory();
    return saved.length ? saved : [{ id: 'welcome', role: 'ai', content: WELCOME, at: new Date().toISOString() }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void preloadHomeAssistantKnowledge();
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ prefill?: string }>).detail;
      if (detail?.prefill) setInput(detail.prefill);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    window.addEventListener('bhive:open-assistant', onOpen);
    return () => window.removeEventListener('bhive:open-assistant', onOpen);
  }, []);

  useEffect(() => {
    if (messages.length > 1) saveAssistantHistory(messages);
  }, [messages]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const appendAi = useCallback((content: string) => {
    setMessages((prev) => [...prev, { id: newId(), role: 'ai', content, at: new Date().toISOString() }]);
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'user', content: trimmed, at: new Date().toISOString() },
      ]);
      setInput('');
      setLoading(true);

      try {
        const history: ChatTurn[] = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-12)
          .map((m) => ({ role: m.role === 'ai' ? 'ai' : 'user', content: m.content }));

        let result = await sendHomeAssistantTurn(history, trimmed);

        if (result.ok && result.action.needsWebSearch && result.action.webSearchQuery?.trim()) {
          const search = await runHomeAssistantWebSearch(result.action.webSearchQuery.trim());
          if (search.ok) {
            const enriched = `${trimmed}\n\n[WEB SEARCH]\n${search.summary}\n${search.data}`.slice(0, 12000);
            result = await sendHomeAssistantTurn(history, enriched);
          }
        }

        if (!result.ok) {
          appendAi(
            result.needPayment
              ? `This needs Hive credits (~$${(result.amountUsd ?? 0.02).toFixed(2)}). Visit settings to add credits.`
              : result.error || 'Bhive Builder is reconnecting — try again.'
          );
          return;
        }
        appendAi(result.action.reply);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, appendAi]
  );

  return (
    <section ref={sectionRef} className={styles.owrBuilder} aria-label="Bhive Builder">
      <div className={styles.owrBuilderHeader}>
        <Sparkles size={20} className="text-amber-400" />
        <div>
          <h3>Bhive Builder</h3>
          <p>Large research chat — maps, custom tools, archive workflows. Same assistant as everywhere on AiBhive.</p>
        </div>
      </div>

      <div ref={messagesRef} className={styles.owrBuilderMessages}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`${styles.owrBuilderBubble} ${m.role === 'user' ? styles.owrBuilderBubbleUser : ''}`}
          >
            {m.content.replace(/\*\*/g, '')}
          </div>
        ))}
        {loading && (
          <div className={styles.owrBuilderBubble}>
            <Loader2 className="animate-spin inline w-4 h-4 mr-2" />
            Thinking…
          </div>
        )}
      </div>

      <div className={styles.owrBuilderQuick}>
        {QUICK.map((q) => (
          <button key={q.label} type="button" onClick={() => void submit(q.text)}>
            {q.label}
          </button>
        ))}
      </div>

      <form
        className={styles.owrBuilderForm}
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Bhive Builder — research plans, custom maps, anomaly rules, scrape + OCR chains…"
          rows={4}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit(input);
            }
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
          <Send size={20} />
        </button>
      </form>
    </section>
  );
}
