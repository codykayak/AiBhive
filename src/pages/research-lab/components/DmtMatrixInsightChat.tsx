import type { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, Sparkles } from 'lucide-react';
import { sendIntelChatAsUser } from '../../../lib/intelWebApi';
import {
  DMT_INSIGHT_STARTERS,
  DMT_INSIGHT_TARGET_CONTEXT,
  DMT_SEARCH_STARTERS,
} from '../../../lib/dmtMatrixInsight';
import styles from '../dmtMatrixDecoder.module.css';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

type Props = {
  focusTitle: string;
  contextText: string;
  sessionKey: string;
  user: User | null;
  onSignIn: () => void;
  mode?: 'entry' | 'search';
  collapsed?: boolean;
};

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadSession(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSession(key: string, messages: ChatMessage[]) {
  localStorage.setItem(key, JSON.stringify(messages.slice(-30)));
}

export default function DmtMatrixInsightChat({
  focusTitle,
  contextText,
  sessionKey,
  user,
  onSignIn,
  mode = 'entry',
  collapsed: initialCollapsed = false,
}: Props) {
  const [open, setOpen] = useState(!initialCollapsed);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadSession(sessionKey));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const starters = mode === 'search' ? DMT_SEARCH_STARTERS : DMT_INSIGHT_STARTERS;

  useEffect(() => {
    setMessages(loadSession(sessionKey));
  }, [sessionKey]);

  useEffect(() => {
    saveSession(sessionKey, messages);
  }, [sessionKey, messages]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy, open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      if (!user) {
        onSignIn();
        return;
      }
      if (!contextText.trim()) {
        setError('No library data loaded yet — try again in a moment.');
        return;
      }

      const userMsg: ChatMessage = { id: newId(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setBusy(true);
      setError('');
      setOpen(true);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('ai' as const),
          content: m.content,
        }));
        const res = await sendIntelChatAsUser(user, {
          message: trimmed,
          history,
          documentContext: contextText,
          targetContext: DMT_INSIGHT_TARGET_CONTEXT,
          llmProvider: 'grok',
        });
        setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: res.text }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Insight chat failed';
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(trimmed);
      } finally {
        setBusy(false);
      }
    },
    [busy, user, onSignIn, messages, contextText],
  );

  return (
    <section className={styles.insightChat} aria-label="AI insight chat">
      <button
        type="button"
        className={styles.insightChatToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <MessageCircle size={18} aria-hidden />
        <div className={styles.insightChatToggleText}>
          <strong>Ask what this means</strong>
          <span>AI explains the decode data in plain English · Hive credits per message</span>
        </div>
        <Sparkles size={16} className={styles.insightChatIcon} aria-hidden />
      </button>

      {open && (
        <div className={styles.insightChatBody}>
          <p className={styles.insightChatFocus}>{focusTitle}</p>

          {!user && (
            <p className={styles.signInBanner}>
              <button type="button" className={styles.linkBtn} onClick={onSignIn}>
                Sign in
              </button>{' '}
              to ask the AI what this research actually means.
            </p>
          )}

          <div className={styles.insightStarters}>
            {starters.map((s) => (
              <button
                key={s}
                type="button"
                className={styles.insightStarterChip}
                disabled={busy}
                onClick={() => void send(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className={styles.insightMessages}>
            {messages.length === 0 ? (
              <p className={styles.insightEmpty}>
                Confused by entropy scores, script matches, or classifications? Ask anything — the AI
                reads the library entry and explains it without jargon.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === 'user' ? styles.insightMsgUser : styles.insightMsgAi}
                >
                  {m.content}
                </div>
              ))
            )}
            {busy && (
              <p className={styles.insightThinking}>
                <Loader2 size={14} className={styles.spin} aria-hidden />
                Translating research into insight…
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <form
            className={styles.insightForm}
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              className={styles.insightInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What does any of this actually mean?"
              disabled={busy}
              aria-label="Ask about this finding"
            />
            <button
              type="submit"
              className={styles.insightSend}
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
