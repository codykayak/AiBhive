const MAX_KNOWLEDGE_CHARS = 40000;

export const MACROREI_DEFAULT_GREETING =
  "Hello, you've reached Macro Real Estate Investing — we buy Oregon houses as-is for cash. Are you the property owner, and have you ever thought about selling?";

export const MACROREI_VOICE_SESSION_DEFAULTS = {
  model: 'grok-voice-latest',
  voice: 'aurora',
  sampleRate: 24000,
};

export const MACROREI_VOICE_TOOLS = [
  {
    type: 'function',
    name: 'log_seller_interest',
    description:
      'Record that the caller may want to sell or meet the investor. Use when they express interest, ask for an offer, or agree to an appointment.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Caller name if given' },
        address: { type: 'string', description: 'Property address or city if given' },
        summary: { type: 'string', description: 'One-line summary of situation' },
        callbackTime: { type: 'string', description: 'Best time to call back' },
      },
      required: ['summary'],
    },
  },
  {
    type: 'web_search',
    location: { country: 'US', timezone: 'America/Los_Angeles' },
  },
];

const MACROREI_KNOWLEDGE = `MacroREI (Macro Real Estate Investing) buys houses fast for cash in Eugene, Springfield, Corvallis, Roseburg, Bend, Florence, Albany, and western Oregon.
Specialties: inherited properties, probate, distressed/as-is homes — no repairs required, no commissions to seller.
Investor has completed 100+ deals. This is appointment setting for distressed-owner outreach — NOT a product sales pitch.
Areas: Lane, Benton, Douglas, Deschutes, Linn counties.
Probate: Oregon small estate affidavits or heirship affidavits may apply — we help families understand options.
Closing often 14–45 days depending on probate status.
Email: cody@macrorei.com. Website: macrorei.com.
If they are not interested, thank them politely and end the call. Never pressure.`;

function clip(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[Knowledge truncated.]`;
}

export function buildMacroreiVoiceInstructions({ phoneDisplay = '(541) 321-2630' } = {}) {
  const knowledge = clip(MACROREI_KNOWLEDGE, MAX_KNOWLEDGE_CHARS);

  return `You are Grok, the live MacroREI voice agent answering phone calls for Macro Real Estate Investing in Oregon. Sound like a calm, professional local investor rep — not a call center script.

PRIMARY JOB
- Answer inbound calls from homeowners (often distressed, inherited, or as-is situations).
- Ask if they own the property and whether they would consider selling.
- If interested: collect name, property location, situation, and best callback time — then confirm our investor will follow up.
- This is NOT telemarketing a product. You are qualifying seller interest and booking investor callbacks.

VOICE STYLE
- Short sentences. One question at a time. Warm Oregon-local tone.
- Say "Macro R E I" or "Macro Real Estate Investing" — not "Macrorey".
- Do not list more than three things unless asked.
- Callers reached you at ${phoneDisplay}.

ESCALATION (transfer to human / urgent callback)
- They say they want to sell now, want an offer, or agree to meet → use log_seller_interest and tell them Cody or the investor will call back within the hour when possible.
- Angry, legal threat, or asks for licensed attorney → stay polite, do not give legal advice, offer callback.
- Wrong number → apologize briefly and end call.

SAFETY
- Not 911. Life safety emergencies → tell them to call 911 first.

TOOLS
- log_seller_interest when they qualify as a potential seller lead.
- web_search only for general Oregon RE process questions — then return to MacroREI offer path.

COMPANY KNOWLEDGE:
${knowledge}`;
}

export function buildMacroreiSessionConfig({ phoneDisplay } = {}) {
  return {
    voice: MACROREI_VOICE_SESSION_DEFAULTS.voice,
    instructions: buildMacroreiVoiceInstructions({ phoneDisplay }),
    turn_detection: { type: 'server_vad' },
    tools: MACROREI_VOICE_TOOLS,
    replace: {
      MacroREI: 'Macro R E I',
      macrorei: 'Macro R E I',
    },
    audio: {
      input: {
        format: { type: 'audio/pcm', rate: MACROREI_VOICE_SESSION_DEFAULTS.sampleRate },
        transcription: {
          model: 'grok-transcribe',
          language_hint: 'en',
          keyterms: ['MacroREI', 'probate', 'Eugene', 'Springfield', 'Oregon', 'inherited', 'cash offer'],
        },
      },
      output: {
        format: { type: 'audio/pcm', rate: MACROREI_VOICE_SESSION_DEFAULTS.sampleRate },
      },
    },
  };
}

export function resolveMacroreiGrokApiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || process.env.grok || '';
}

export function resolveMacroreiAgentId() {
  return (
    process.env.MACROREI_GROK_AGENT_ID ||
    process.env.VITE_MACROREI_GROK_AGENT_ID ||
    ''
  );
}

/** Public marketing line on macrorei.com */
export function resolveMacroreiMarketingPhone() {
  return {
    display: process.env.MACROREI_MARKETING_PHONE_DISPLAY || '(541) 321-2630',
    e164: process.env.MACROREI_MARKETING_PHONE_E164 || '+15413212630',
  };
}

/** Grok Voice Agent Builder line — forward your cell here while at work */
export function resolveMacroreiGrokVoicePhone() {
  const marketing = resolveMacroreiMarketingPhone();
  return {
    display:
      process.env.MACROREI_GROK_VOICE_PHONE_DISPLAY ||
      process.env.MACROREI_VOICE_PHONE_DISPLAY ||
      marketing.display,
    e164:
      process.env.MACROREI_GROK_VOICE_PHONE_E164 ||
      process.env.MACROREI_VOICE_PHONE_E164 ||
      marketing.e164,
  };
}

export function buildWorkModeGuide() {
  const marketing = resolveMacroreiMarketingPhone();
  const grok = resolveMacroreiGrokVoicePhone();
  const forwardDigits = grok.e164.replace(/\D/g, '');
  return {
    businessId: 'macrorei',
    title: 'Work Mode — Grok answers before voicemail',
    marketingLine: marketing,
    grokVoiceLine: grok,
    agentId: resolveMacroreiAgentId() || null,
    steps: [
      'In xAI Voice Agent Builder, attach your MacroREI agent to the Grok voice line (or use the number shown below).',
      'On your cell: Settings → Call forwarding → Forward when unanswered (or forward all while at work).',
      'Set forward target to the Grok voice line — NOT your personal voicemail.',
      'Optional: dial *73 when you get home to cancel forwarding.',
      'Test: call your cell from another phone; Grok should answer after your forward delay.',
    ],
    carrierCodes: {
      forwardAll: `*72${forwardDigits}#`,
      forwardAllNote: 'Forward ALL calls to Grok line (while at work). Cancel with *73.',
      cancelForward: '*73#',
      cancelNote: 'Turn off call forwarding.',
    },
    tips: [
      'Disable or shorten carrier voicemail so Grok wins the race — voicemail that picks up first blocks the AI.',
      'Start with forward-if-no-answer (15–20 sec) before forward-all if you want to catch calls yourself when free.',
      'Grok uses the same MacroREI training as SMS in Lead Agent.',
    ],
  };
}
