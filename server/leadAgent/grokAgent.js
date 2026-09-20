import { grokChatMessages } from '../socialPosts/grokProvider.js';
import { isOptOutMessage } from './smsProvider.js';
import { getWebsiteRagContext } from './ragKnowledge.js';
import { personalizeOutbound } from './outboundMessage.js';

function getXaiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

async function buildSystemPrompt(business, lead) {
  const rag = await getWebsiteRagContext(business.id).catch(() => '');
  return [
    `You are the SMS agent for ${business.name}.`,
    business.tagline || '',
    '',
    'RULES:',
    '- Reply in ONE short SMS (under 320 characters). Plain text only.',
    '- Sound human, not robotic. One question max per message.',
    '- Never argue. If they say STOP/UNSUBSCRIBE, reply once: "Understood — removed. Reply START to opt back in."',
    '- If they want an appointment or to talk to a human, use the escalation message.',
    '- Use WEBSITE RAG below for facts; do not invent offers or prices not in RAG.',
    '',
    `GREETING (first outbound): ${business.greeting || ''}`,
    `ESCALATION MESSAGE: ${business.escalationMessage || 'Someone from our team will call you shortly.'}`,
    `ESCALATION TRIGGERS: ${(business.escalationKeywords || []).join(', ')}`,
    '',
    'COMPANY KNOWLEDGE (static):',
    business.knowledge || '',
    '',
    rag ? `WEBSITE RAG:\n${rag}` : '',
    '',
    lead?.notes ? `LEAD NOTES: ${lead.notes}` : '',
    lead?.propertyAddress ? `PROPERTY: ${lead.propertyAddress}` : '',
    lead?.name ? `LEAD NAME: ${lead.name}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function shouldEscalate(inbound, business) {
  const lower = String(inbound || '').toLowerCase();
  return (business.escalationKeywords || []).some((kw) => lower.includes(String(kw).toLowerCase()));
}

export async function generateSmsReply({ business, lead, history, inbound }) {
  if (isOptOutMessage(inbound)) {
    return {
      reply: 'Understood — removed. Reply START to opt back in.',
      escalated: false,
      optedOut: true,
    };
  }

  if (shouldEscalate(inbound, business)) {
    return {
      reply: business.escalationMessage || 'Thanks — our team will reach out shortly.',
      escalated: true,
      optedOut: false,
    };
  }

  if (business.agentEnabled === false) {
    return { reply: null, escalated: false, optedOut: false, paused: true };
  }

  const apiKey = getXaiKey();
  if (!apiKey) {
    return {
      reply: 'Thanks for your message — our team will get back to you soon.',
      escalated: false,
      optedOut: false,
      fallback: true,
    };
  }

  const system = await buildSystemPrompt(business, lead);
  const messages = [
    { role: 'system', content: system },
    ...(history || []).slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    })),
    { role: 'user', content: inbound },
  ];

  const { text } = await grokChatMessages(apiKey, messages, { temperature: 0.4, maxTokens: 180 });
  const reply = String(text || '').trim().slice(0, 480);
  return { reply: reply || business.greeting, escalated: false, optedOut: false };
}

export async function generateFirstOutbound({ business, lead }) {
  return personalizeOutbound(business, lead);
}
