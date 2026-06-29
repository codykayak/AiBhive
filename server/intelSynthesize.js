/**
 * Grok/Gemini synthesis — filter raw OSINT noise, return inquiry-relevant findings only.
 */
import { runIntelResearchChat } from './intelResearchChat.js';

export const INTEL_SYNTHESIS_SYSTEM = `You are the AiBhive Intel Agent synthesizer.

You receive RAW output from automated OSINT tools (DNS, RDAP, dorks, web search, etc.).

Your job:
1. Read the user's inquiry and target carefully.
2. Sort through ALL raw tool output.
3. KEEP only findings that directly help answer the user's inquiry.
4. DISCARD boilerplate, unrelated DNS noise, duplicate data, and generic tech stack items unless they matter to the inquiry.
5. For discovery/list queries: extract entities with name, status evidence, dates, and source tool.
6. Never invent facts, emails, or people not supported by the source data.

Output format (markdown):
## Executive summary
2-4 sentences answering the inquiry directly.

## Key findings
Bullet points — each with confidence (high/medium/low) and source tool in parentheses.

## Gaps & limits
What we could not verify or what free tools cannot see.

## Recommended next steps
Concrete actions the researcher should take next.

Plain English. No raw JSON dumps unless a specific value is critical evidence.`;

function formatRawDump(toolResults) {
  if (!Array.isArray(toolResults) || !toolResults.length) {
    return '(no tool results)';
  }
  return toolResults
    .map((r) => {
      const header = `### ${r.toolId} [${r.status}]`;
      const body = [r.summary, r.error, r.data].filter(Boolean).join('\n');
      return `${header}\n${String(body || '(empty)').slice(0, 12000)}`;
    })
    .join('\n\n');
}

function buildSynthesisMessage(target, userIntent) {
  const intent = String(userIntent || target?.userIntent || target?.label || '').trim();
  const label = String(target?.label || '').trim();
  const type = String(target?.type || 'company');
  const domain = target?.domain ? `\nDomain: ${target.domain}` : '';
  const region = target?.region?.location
    ? `\nRegion: ${target.region.location} (${target.region.radiusMiles || 50} mi)`
    : '';

  if (type === 'discovery') {
    return [
      'Discovery/list inquiry — extract only entities and signals matching the query.',
      `Inquiry: ${intent}`,
      `Target label: ${label || intent.slice(0, 120)}${region}`,
    ].join('\n');
  }

  return [
    'Synthesize intelligence relevant to this inquiry only.',
    `Inquiry: ${intent}`,
    `Target: ${label} (${type})${domain}${region}`,
  ].join('\n');
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runIntelSynthesis(db, userId, opts) {
  const target = opts.target || {};
  const toolResults = opts.toolResults || [];
  const userIntent = String(opts.userIntent || target.userIntent || '').trim();
  const documentContext = String(opts.documentContext || '').slice(0, 16000);

  const rawDump = formatRawDump(toolResults);
  const message = buildSynthesisMessage(target, userIntent);

  const targetContext = [
    `USER INQUIRY: ${userIntent || target.label || 'General research'}`,
    `TARGET TYPE: ${target.type || 'company'}`,
    `TARGET LABEL: ${target.label || ''}`,
    target.domain ? `DOMAIN: ${target.domain}` : '',
    '',
    'RAW OSINT TOOL OUTPUT (filter aggressively — keep only inquiry-relevant items):',
    rawDump.slice(0, 48000),
  ]
    .filter(Boolean)
    .join('\n');

  return runIntelResearchChat(db, userId, {
    message,
    history: [],
    systemInstruction: INTEL_SYNTHESIS_SYSTEM,
    targetContext,
    documentContext,
  });
}
