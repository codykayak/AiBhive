import type { IntelCase } from './types';

function section(title: string, body: string): string {
  if (!body.trim()) return '';
  return `\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}\n\n${body.trim()}\n`;
}

export function buildRawDump(intelCase: IntelCase): string {
  const { target, plan, toolResults, aiBrief, createdAt, updatedAt } = intelCase;
  const domain = target.domain ?? target.label;

  let out = '';
  out += 'AiBhive Intel Agent — Research Export\n';
  out += `Generated: ${new Date().toISOString()}\n`;
  out += `Case ID: ${intelCase.id}\n`;
  out += `Created: ${createdAt}\n`;
  out += `Updated: ${updatedAt}\n`;
  out += `\nTARGET\n`;
  out += `  Type: ${target.type}\n`;
  out += `  Label: ${target.label}\n`;
  out += `  Domain: ${domain}\n`;
  if (target.userIntent) out += `  User intent: ${target.userIntent}\n`;
  if (intelCase.agentProvider) {
    out += `  AI agent: ${intelCase.agentProvider} (${intelCase.agentModel ?? 'default'})\n`;
  }

  if (plan) {
    out += section(
      'AGENT PLAN',
      [
        `Focus: ${plan.focusAreas.join(', ')}`,
        plan.notes ?? '',
        '',
        ...plan.steps.map((s, i) => `${i + 1}. ${s.toolId} — ${s.reason}`),
      ].join('\n')
    );
  }

  if (aiBrief) {
    out += section('AI INTELLIGENCE BRIEF', aiBrief);
  }

  for (const result of toolResults) {
    if (result.status === 'skipped') continue;
    const header = `[${result.toolId.toUpperCase()}] ${result.status}${result.summary ? ` — ${result.summary}` : ''}`;
    const body = result.error ? `ERROR: ${result.error}` : result.data ?? '(no data)';
    out += section(header, body);
  }

  out += `\n--- End of AiBhive Intel Export ---\n`;
  return out;
}

export function buildJsonExport(intelCase: IntelCase): string {
  return JSON.stringify(intelCase, null, 2);
}

export function buildShareSummary(intelCase: IntelCase): string {
  const lines: string[] = [
    `AiBhive Intel: ${intelCase.target.label}`,
    intelCase.aiBrief ? `\n${intelCase.aiBrief.slice(0, 1200)}${intelCase.aiBrief.length > 1200 ? '…' : ''}` : '',
    `\nTools run: ${intelCase.toolResults.filter((r) => r.status === 'done').length}`,
    `Full export available in app.`,
  ];
  return lines.filter(Boolean).join('\n');
}
