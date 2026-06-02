import { GoogleGenAI } from '@google/genai';
import { AIBHIVE_ASSISTANT_SYSTEM_INSTRUCTION } from './assistantKnowledge.js';

const MAX_USER_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 8;
const MODEL = 'gemini-2.5-pro';

const TRANSCRIPTION_PRICING_REPLY =
  'When you visit our checkout cart you can drop your file in and get an exact price for your project instantly. Go to /get-started to upload and see your quote.';

const AGENTIC_PRICING_REPLY =
  'The scope and multitude of variables that go into a project of any size are complex and require a human in the loop. Call or text us, or click Book a call at /book-consultation. We usually get back to you within the hour. You can also reach us at hello@aibhive.com.';

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

function isTranscriptionPricingQuestion(lower) {
  const pricing = ['price', 'pricing', 'cost', 'how much', 'quote', 'rate'];
  const transcription = [
    'transcri',
    'translat',
    'voice clone',
    'voice cloning',
    'dub',
    'per minute',
    'per word',
    'upload',
    'mp3',
    'audio',
    'video file',
    'checkout',
    'get-started',
    'get started',
    'podcast',
    'youtube',
    'subtitle',
    'srt',
  ];
  return pricing.some((p) => lower.includes(p)) && transcription.some((t) => lower.includes(t));
}

function isAgenticPricingQuestion(lower) {
  const pricing = ['price', 'pricing', 'cost', 'how much', 'quote', 'budget'];
  const agentic = [
    'agent',
    'automat',
    'real estate',
    'phone',
    'sms',
    'missed call',
    'lead gen',
    'erp',
    'workflow',
    'enterprise',
    'custom',
    'solution',
    'b2b',
    'rag',
    'crm',
    'integration',
    'consult',
    'wholesal',
    'broker',
  ];
  return pricing.some((p) => lower.includes(p)) && agentic.some((a) => lower.includes(a));
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
        temperature: 0.4,
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

  if (isTranscriptionPricingQuestion(lower)) {
    return TRANSCRIPTION_PRICING_REPLY;
  }
  if (isAgenticPricingQuestion(lower)) {
    return AGENTIC_PRICING_REPLY;
  }

  const rules = [
    {
      keys: ['real estate', 'wholesal', 'investor', 'realtor', 'broker', 'seller', 'fub', 'gohighlevel', 'ghl'],
      reply:
        'AiBHive Real Estate AI covers distress monitoring, CRM sync (Follow Up Boss, GoHighLevel), missed-call text-back with RAG-trained SMS, and automatic appointment booking. See /solutions/real-estate-ai-automation or book at /book-consultation.',
    },
    {
      keys: ['phone', 'sms', 'text back', 'missed call', 'twilio', 'ringcentral', 'openphone', 'voicemail'],
      reply:
        'Phone Systems integration: missed call → webhook → RAG-trained SMS → booked appointment. Twilio, RingCentral, OpenPhone supported. /solutions/phone-systems-ai-integration',
    },
    {
      keys: ['lead gen', 'lead generation', 'nurturing', 'pipeline'],
      reply: 'Lead Generation agents qualify and book calls 24/7. /solutions/ai-lead-generation-automation',
    },
    {
      keys: ['customer ops', 'ticket', 'refund', 'ecommerce'],
      reply: 'Customer Operations agents resolve tickets with CRM and order data. /solutions/ai-customer-operations-automation',
    },
    {
      keys: ['erp', 'invoice', 'document', 'quickbooks', 'netsuite'],
      reply: 'Document & ERP Sync automates PDF and invoice data entry. /solutions/intelligent-document-processing-erp',
    },
    {
      keys: ['workflow', 'orchestrat', 'onboarding'],
      reply: 'Workflow Orchestration connects legacy SaaS across the client lifecycle. /solutions/enterprise-workflow-orchestration',
    },
    {
      keys: ['agentic', 'automation', 'autonomous', 'ai agent', 'digital employee'],
      reply:
        'AiBHive builds custom agentic AI for lead gen, customer ops, documents, workflows, real estate, and phone/SMS. Explore Solutions in the menu or /book-consultation.',
    },
    {
      keys: ['medical', 'legal', 'compliance', 'hipaa', 'court'],
      reply:
        'Medical & Legal multi-agent hive: /solutions/medical-legal-multi-agent-compliance. Self-serve transcription: /transcription',
    },
    {
      keys: ['book', 'consult', 'demo', 'audit', 'strategy'],
      reply: 'Book a live call at /book-consultation. We usually respond within the hour.',
    },
    {
      keys: ['clone', 'voice'],
      reply:
        'Voice Clone Lab: /voice-clone. For exact pricing, visit /get-started and drop your file in the checkout cart.',
    },
    {
      keys: ['translat', 'language', 'dub', 'transcri'],
      reply:
        'Transcription and translation: /transcription and /grow. Exact pricing at /get-started — drop your file in for an instant quote.',
    },
    {
      keys: ['price', 'cost', 'pricing', 'how much'],
      reply: `${AGENTIC_PRICING_REPLY}\n\nFor transcription/translation files only: ${TRANSCRIPTION_PRICING_REPLY}`,
    },
    {
      keys: ['contact', 'email', 'support', 'hello', 'text us', 'call us'],
      reply: 'hello@aibhive.com or /book-consultation. We usually get back within the hour.',
    },
    {
      keys: ['hi', 'hello', 'hey'],
      reply: "Hi, I'm Cody, your AI assistant. How can I help?",
    },
  ];

  for (const rule of rules) {
    if (rule.keys.some((k) => lower.includes(k))) {
      return rule.reply;
    }
  }

  return (
    'AiBHive offers agentic B2B automation (see Solutions in the menu) and self-serve transcription at /get-started. Book a call: /book-consultation or hello@aibhive.com.'
  );
}
