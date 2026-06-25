import type { IntelCase } from './types';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
  if (target.region?.restrictToRegion && target.region.location) {
    out += `  Region: ${target.region.location} (${target.region.radiusMiles ?? 50} mi)\n`;
  }
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

export function buildPdfHtml(intelCase: IntelCase): string {
  const brief = escapeHtml(intelCase.aiBrief ?? '');
  const dump = escapeHtml(buildRawDump(intelCase).slice(0, 40000));
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
  h1 { color: #d97706; font-size: 22px; }
  h2 { color: #b45309; font-size: 16px; margin-top: 20px; }
  pre { white-space: pre-wrap; font-size: 10px; background: #f1f5f9; padding: 12px; border-radius: 8px; }
  .meta { color: #64748b; font-size: 12px; }
</style></head><body>
  <h1>AiBhive Intel Report</h1>
  <p class="meta">Target: ${escapeHtml(intelCase.target.label)} · ${escapeHtml(intelCase.updatedAt)}</p>
  <h2>AI Intelligence Brief</h2>
  <pre>${brief}</pre>
  <h2>Full Data Dump</h2>
  <pre>${dump}</pre>
</body></html>`;
}
