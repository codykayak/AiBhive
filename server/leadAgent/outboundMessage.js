/** First outbound SMS — MacroREI owner outreach with property address. */

export function ownerNamePrefix(name) {
  const raw = String(name || '').trim();
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

export function resolvePropertyAddress(lead) {
  return String(lead?.propertyAddress || lead?.notes || '').trim();
}

export function personalizeOutbound(business, lead) {
  const address = resolvePropertyAddress(lead);
  const prefix = ownerNamePrefix(lead?.name);
  const macroreiDefault =
    "my name is Cody, I'm a real estate investor in Eugene. I'm wondering if you still own the property at {address} and if you may be interested in selling it?";

  const useMacrorei =
    business?.id === 'macrorei' ||
    String(business?.outboundTemplate || '').includes('{address}');

  if (useMacrorei) {
    const tpl = business?.outboundTemplate || macroreiDefault;
    const addr = address || 'your property';
    let body = `Hi${prefix} ${tpl.replace(/\{address\}/gi, addr)}`.replace(/\s+/g, ' ').trim();
    return body.slice(0, 480);
  }

  let body = business?.greeting || business?.outboundTemplate || 'Hi — following up.';
  const first = lead?.name?.trim().split(/\s+/)[0];
  if (first && !body.toLowerCase().includes(first.toLowerCase())) {
    body = body.replace(/^Hi,?\s*/i, `Hi ${first}, `);
  }
  if (address && body.length < 280 && !body.includes(address)) {
    body = `${body} Re: ${address}`.slice(0, 480);
  }
  return body.slice(0, 480);
}

/** Second (and later) owner touch — shorter follow-up. */
export function personalizeFollowUpOutbound(business, lead, touchIndex = 2) {
  const address = resolvePropertyAddress(lead) || 'the property';
  const prefix = ownerNamePrefix(lead?.name);
  const custom = String(business?.followUpOutboundTemplate || '').trim();
  if (custom) {
    return `Hi${prefix} ${custom.replace(/\{address\}/gi, address)}`.replace(/\s+/g, ' ').trim().slice(0, 480);
  }
  const line =
    touchIndex <= 2
      ? `just circling back about ${address} — still happy to chat if you might sell or know who owns it. No pressure.`
      : `following up one more time on ${address}. Reply STOP to opt out.`;
  return `Hi${prefix} ${line}`.replace(/\s+/g, ' ').trim().slice(0, 480);
}

/** Text to a relative / associate when owner never replied after 2 touches. */
export function personalizeRelativeOutbound(business, ownerLead, relativeLead) {
  const address = resolvePropertyAddress(ownerLead) || 'a property in Eugene';
  const relName = String(relativeLead?.name || '').trim();
  const hi = relName ? `Hi ${relName.split(/\s+/)[0]},` : 'Hi,';
  const custom = String(business?.relativeOutboundTemplate || '').trim();
  if (custom) {
    return `${hi} ${custom.replace(/\{address\}/gi, address).replace(/\{owner\}/gi, ownerLead?.name || 'the owner')}`
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 480);
  }
  const owner = ownerLead?.name ? ` ${ownerLead.name}` : '';
  return (
    `${hi} Sorry to bother you — I saw your name associated with ${address}. ` +
    `I was trying to reach the owner${owner}. I'm a local investor in Eugene and interested in the property. ` +
    `If you can point me to the right person, I'd appreciate it. Reply STOP to opt out.`
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 480);
}
