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
