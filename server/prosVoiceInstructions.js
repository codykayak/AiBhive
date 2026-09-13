import { buildProsKnowledgeText } from './prosPlaybook.js';

const MAX_KNOWLEDGE_CHARS = 40000;

export const PROS_DEFAULT_GREETING =
  "Hello, you've reached AiBhive Pros — field intelligence for HVAC, plumbing, electrical, pool, and property service teams. What can I help you with today?";

export const PROS_VOICE_SESSION_DEFAULTS = {
  model: 'grok-voice-latest',
  voice: 'aurora',
  sampleRate: 24000,
};

export const PROS_VOICE_TOOLS = [
  {
    type: 'function',
    name: 'lookup_pros_playbook',
    description:
      'Get AiBhive Pros / Diagnose field advice for a trade: first questions, safe self-help, and escalate rules.',
    parameters: {
      type: 'object',
      properties: {
        trade: {
          type: 'string',
          description: 'hvac, plumbing, electrical, pool, property, or fiber',
        },
        issue: {
          type: 'string',
          description: 'Optional short description of the equipment or symptom',
        },
      },
      required: ['trade'],
    },
  },
  {
    type: 'web_search',
    location: { country: 'US', timezone: 'America/Los_Angeles' },
  },
];

function clip(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[Knowledge truncated — stay conservative on facts not shown.]`;
}

export function buildProsVoiceInstructions({ phoneDisplay = '(217) 600-2129' } = {}) {
  const knowledge = clip(buildProsKnowledgeText(), MAX_KNOWLEDGE_CHARS);

  return `You are Grok, the live AiBhive Pros voice agent on aibhive.com/pros. This is a spoken call — sound like a sharp shop dispatcher and field coach, not a chatbot reading bullets.

PRIMARY JOB
- Help trade company owners, dispatchers, and techs with field service workflows: dispatch, Diagnose app, knowledge base, team GPS, and trade playbooks.
- Prefer TRADE PLAYBOOKS and product facts below before web search.
- You MAY search the open internet for equipment specs, code questions, or general facts. After outside answers, steer back to AiBhive Pros value and a next step.
- AiBhive Diagnose is the field app (aibhive.com/diagnose). Pros HQ is aibhive.com/pros/app.

VOICE STYLE
- Short sentences. One question at a time.
- Say "A I Bhive Pros" for the product. Pronounce HVAC as "H-V-A-C".
- Do not list more than three options unless asked.
- Callers can dial ${phoneDisplay} or use Talk on aibhive.com/pros for the same voice agent.

SAFETY
- Gas, carbon monoxide, fire, smoke, flood, sewage, sparks, lockouts, and no heat in freezing weather: escalate immediately.
- Electrical: one labeled breaker reset or GFCI reset only — never open a panel.
- This line is product coaching and dispatch guidance. It is not 911.

TOOLS
- lookup_pros_playbook for trade-specific first questions, self-help, and escalate rules.
- web_search when playbooks are not enough.

TRADE PLAYBOOKS:
${knowledge}`;
}

export function buildProsSessionConfig({ phoneDisplay } = {}) {
  return {
    voice: PROS_VOICE_SESSION_DEFAULTS.voice,
    instructions: buildProsVoiceInstructions({ phoneDisplay }),
    turn_detection: { type: 'server_vad' },
    tools: PROS_VOICE_TOOLS,
    replace: {
      AiBhive: 'A I Bhive',
      aibhive: 'A I Bhive',
      Grok: 'Grok',
    },
    audio: {
      input: {
        format: { type: 'audio/pcm', rate: PROS_VOICE_SESSION_DEFAULTS.sampleRate },
        transcription: {
          model: 'grok-transcribe',
          language_hint: 'en',
          keyterms: ['AiBhive', 'Grok', 'HVAC', 'GFCI', 'Diagnose', 'dispatch'],
        },
      },
      output: {
        format: { type: 'audio/pcm', rate: PROS_VOICE_SESSION_DEFAULTS.sampleRate },
      },
    },
  };
}

export function resolveProsGrokApiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || process.env.grok || '';
}

export function resolveProsAgentId() {
  return (
    process.env.PROS_GROK_AGENT_ID ||
    process.env.VITE_PROS_GROK_AGENT_ID ||
    'agent_r6VTh3L4etnZrsI4'
  );
}

export function resolveProsVoicePhone() {
  return {
    display: process.env.PROS_VOICE_PHONE_DISPLAY || '(217) 600-2129',
    e164: process.env.PROS_VOICE_PHONE_E164 || '+12176002129',
  };
}
