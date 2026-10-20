import { normalizePhone } from './smsProvider.js';
import { resolvePropertyAddress } from './outboundMessage.js';
import { getSerpApiKey } from '../intelCloudKeys.js';

function extractPhones(text) {
  const raw = String(text || '');
  const matches = raw.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
  return matches.map((m) => normalizePhone(m)).filter((p) => p.replace(/\D/g, '').length >= 10);
}

async function serpQuery(apiKey, q) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const data = await res.json();
  const organic = data.organic_results || [];
  return organic.slice(0, 8).map((r) => `${r.title || ''} ${r.snippet || ''}`).join('\n');
}

async function parseContactsWithGrok(snippetBlob, lead) {
  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!key) return null;
  const address = resolvePropertyAddress(lead);
  const prompt = `From these web search snippets, list people who might be relatives or associates of the property owner at ${address} (owner: ${lead.name || 'unknown'}).
Return ONLY JSON array: [{"name":"...","phone":"+1...","relationship":"spouse|child|sibling|other"}]
Max 4 contacts. Only include entries with a plausible US phone. If none, return [].

Snippets:
${snippetBlob.slice(0, 6000)}`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    return (Array.isArray(arr) ? arr : [])
      .map((row) => ({
        name: String(row.name || '').slice(0, 80),
        phone: normalizePhone(row.phone || ''),
        relationship: String(row.relationship || 'associate').slice(0, 40),
        source: 'serp+grok',
      }))
      .filter((c) => c.phone.replace(/\D/g, '').length >= 10);
  } catch {
    return [];
  }
}

function fallbackPhonesFromSnippets(snippetBlob) {
  const phones = [...new Set(extractPhones(snippetBlob))];
  return phones.slice(0, 3).map((phone, i) => ({
    name: '',
    phone,
    relationship: 'associate',
    source: 'serp_phone_regex',
  }));
}

export async function runRelativeLookup(lead, business) {
  const address = resolvePropertyAddress(lead);
  if (!address) return { ok: false, error: 'missing_address', contacts: [] };

  const apiKey = getSerpApiKey();
  if (!apiKey) {
    return { ok: false, error: 'SERPAPI_KEY not configured on server', contacts: [] };
  }

  const name = String(lead.name || '').trim();
  const queries = [
    `"${address}" Eugene Oregon relative phone`,
    name ? `"${name}" "${address}" family contact` : `"${address}" owner family phone Oregon`,
    `"${address}" whitepages OR truepeoplesearch OR fastpeoplesearch`,
  ];

  let blob = '';
  try {
    for (const q of queries) {
      blob += `\n---\n${q}\n${await serpQuery(apiKey, q)}`;
    }
  } catch (e) {
    return { ok: false, error: e.message || 'serp_failed', contacts: [] };
  }

  let contacts = await parseContactsWithGrok(blob, lead);
  if (!contacts?.length) contacts = fallbackPhonesFromSnippets(blob);

  contacts = contacts.filter((c) => normalizePhone(c.phone) !== normalizePhone(lead.phone));

  if (!contacts.length) {
    return { ok: false, error: 'no_contacts_found', contacts: [], rawChars: blob.length };
  }

  return { ok: true, contacts, rawChars: blob.length };
}
