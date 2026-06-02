import { GoogleGenAI } from '@google/genai';
import { AIBHIVE_ASSISTANT_SYSTEM_INSTRUCTION } from './assistantKnowledge.js';

const MAX_USER_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 8;
const MODEL = 'gemini-2.5-pro';

let aiClient;

function getGemini() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * @param {{ role: 'user' | 'model', text: string }[]} history
 * @param {string} message
 * @returns {Promise<{ reply: string, source: 'gemini' | 'fallback' }>}
 */
export async function getAssistantReply(history, message) {
  const trimmed = String(message || '').trim().slice(0, MAX_USER_MESSAGE_LENGTH);
  if (!trimmed) {
    return { reply: 'Please type a question and I can help.', source: 'fallback' };
  }

  const ai = getGemini();
  if (!ai) {
    return { reply: getFallbackReply(trimmed), source: 'fallback' };
  }

  const recentHistory = (history || [])
    .filter((m) => m?.text?.trim() && (m.role === 'user' || m.role === 'model'))
    .slice(-MAX_HISTORY_TURNS);

  const contents = [];
  for (const turn of recentHistory) {
    contents.push({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.text.trim() }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: trimmed }] });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: AIBHIVE_ASSISTANT_SYSTEM_INSTRUCTION,
        temperature: 0.45,
        maxOutputTokens: 900,
      },
    });

    const reply = response.text?.trim();
    if (reply) {
      return { reply, source: 'gemini' };
    }
  } catch (err) {
    console.error('[assistant-chat] Gemini error:', err.message || err);
  }

  return { reply: getFallbackReply(trimmed), source: 'fallback' };
}

/** Keyword fallback when Gemini is unavailable */
function getFallbackReply(input) {
  const lower = input.toLowerCase();

  const rules = [
    {
      keys: ['real estate', 'wholesal', 'investor', 'realtor', 'broker', 'seller', 'fub', 'gohighlevel', 'ghl'],
      reply:
        'AiBHive Real Estate AI covers distress monitoring, CRM sync (Follow Up Boss, GoHighLevel), missed-call text-back with RAG-trained SMS, and automatic appointment booking. Details: /solutions/real-estate-ai-automation — book a call at /book-consultation.',
    },
    {
      keys: ['phone', 'sms', 'text back', 'missed call', 'twilio', 'ringcentral', 'openphone', 'voicemail'],
      reply:
        'Our Phone Systems integration connects to Twilio, RingCentral, OpenPhone, and more. Missed calls trigger a webhook; within ~60 seconds a RAG-trained agent texts using your scripts and FAQs, qualifies the lead, and books appointments. See /solutions/phone-systems-ai-integration or /book-consultation.',
    },
    {
      keys: ['lead gen', 'lead generation', 'nurturing', 'pipeline', 'outreach'],
      reply:
        'Lead Generation agents monitor intent signals, qualify leads, and book calls 24/7. Learn more: /solutions/ai-lead-generation-automation',
    },
    {
      keys: ['customer ops', 'support', 'ticket', 'refund', 'ecommerce'],
      reply:
        'Customer Operations agents go beyond FAQ bots—they access orders and CRM data to resolve issues across SMS and chat. /solutions/ai-customer-operations-automation',
    },
    {
      keys: ['erp', 'invoice', 'document', 'pdf', 'quickbooks', 'netsuite'],
      reply:
        'Document & ERP Sync extracts data from PDFs and invoices into your accounting stack. /solutions/intelligent-document-processing-erp',
    },
    {
      keys: ['workflow', 'orchestrat', 'onboarding', 'agency'],
      reply:
        'Workflow Orchestration connects legacy SaaS and automates full client lifecycles. /solutions/enterprise-workflow-orchestration',
    },
    {
      keys: ['medical', 'legal', 'compliance', 'hipaa', 'court', 'transcrib'],
      reply:
        'Medical & Legal uses a multi-agent hive with cross-checking and audit trails—or use self-serve transcription at /transcription. B2B: /solutions/medical-legal-multi-agent-compliance',
    },
    {
      keys: ['book', 'consult', 'demo', 'audit', 'call', 'meeting', 'enterprise', 'custom agent'],
      reply:
        'Schedule an automation audit on our detailed intake form: /book-consultation. We will follow up by email to book a live strategy call.',
    },
    {
      keys: ['price', 'cost', 'pricing', 'how much'],
      reply:
        'Self-serve pricing: Audio/Video — Transcribe+Translate $2.49/min, Legal/Medical $3.29/min, Voice Clone $1.99/min. Text — $0.025–$0.035/word depending on service. Calculator: /get-started#pricing. Custom B2B agents are quoted via /book-consultation.',
    },
    {
      keys: ['clone', 'voice'],
      reply:
        'Voice Clone Lab needs a 30s–2min sample and preserves your tone across languages. /voice-clone — pricing on /get-started.',
    },
    {
      keys: ['translat', 'language', 'dub'],
      reply:
        'We support 90+ languages with multi-agent accuracy. Start at /transcription or /grow. Upload and price at /get-started.',
    },
    {
      keys: ['contact', 'email', 'support', 'hello'],
      reply: 'Email hello@aibhive.com or visit /about. For B2B projects use /book-consultation.',
    },
    {
      keys: ['hi', 'hello', 'hey'],
      reply:
        "Hello! I'm the AiBHive assistant. Ask about agentic automation (real estate, phone/SMS, lead gen), transcription pricing, or booking a consultation.",
    },
  ];

  for (const rule of rules) {
    if (rule.keys.some((k) => lower.includes(k))) {
      return rule.reply;
    }
  }

  return (
    "I'm not sure about that specific detail. Browse our solution pages under Solutions in the menu, or book a strategy call at /book-consultation. You can also email hello@aibhive.com."
  );
}
