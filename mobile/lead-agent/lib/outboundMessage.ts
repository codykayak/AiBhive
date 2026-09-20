import type { Business, Lead } from './types';

const MACROREI_TEMPLATE =
  "my name is Cody, I'm a real estate investor in Eugene. I'm wondering if you still own the property at {address} and if you may be interested in selling it?";

export function ownerNamePrefix(name?: string): string {
  const raw = name?.trim();
  if (!raw) return '';
  const parts = raw
    .split(/\s*(?:&| and )\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const firsts = parts.map((p) => p.split(/\s+/)[0]).filter(Boolean);
  if (!firsts.length) return '';
  if (firsts.length === 1) return ` ${firsts[0]},`;
  if (firsts.length === 2) return ` ${firsts[0]} and ${firsts[1]},`;
  return ` ${firsts.slice(0, -1).join(', ')} and ${firsts[firsts.length - 1]},`;
}

export function resolvePropertyAddress(lead: Lead): string {
  return (lead.propertyAddress || lead.notes || '').trim();
}

export function personalizeOutbound(business: Business, lead: Lead): string {
  const address = resolvePropertyAddress(lead);
  const prefix = ownerNamePrefix(lead.name);
  const useMacrorei =
    business.id === 'macrorei' || (business.outboundTemplate || '').includes('{address}');

  if (useMacrorei) {
    const tpl = business.outboundTemplate || MACROREI_TEMPLATE;
    const addr = address || 'your property';
    const body = `Hi${prefix} ${tpl.replace(/\{address\}/gi, addr)}`.replace(/\s+/g, ' ').trim();
    return body.slice(0, 480);
  }

  let body = business.greeting || 'Hi — following up.';
  const first = lead.name?.trim().split(/\s+/)[0];
  if (first && !body.toLowerCase().includes(first.toLowerCase())) {
    body = body.replace(/^Hi,?\s*/i, `Hi ${first}, `);
  }
  return body.slice(0, 480);
}
