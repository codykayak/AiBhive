import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { FieldValue } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_PATH = path.join(__dirname, '..', 'content', 'rv-camping-world-demo.json');

const MATCH_MODEL = process.env.RV_MATCHER_MODEL || 'gemini-2.5-flash';

let inventoryCache;

function loadDemoInventory() {
  if (!inventoryCache) {
    const raw = readFileSync(DEMO_PATH, 'utf8');
    inventoryCache = JSON.parse(raw);
  }
  return inventoryCache;
}

function clip(value, max) {
  return String(value || '').trim().slice(0, max);
}

function numOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function ruleBasedMatch(units, filters) {
  const towing = filters.towingCapacityLbs;
  const budgetMax = filters.budgetMax;
  const budgetType = filters.budgetType === 'monthly' ? 'monthly' : 'total';
  const wantsMotorhome = filters.wantsMotorhome === true;
  const wantsTowable = filters.wantsTowable === true;

  const scored = units.map((unit) => {
    let score = 50;
    const reasons = [];

    if (budgetMax) {
      const price = budgetType === 'monthly' ? unit.estMonthlyUsd : unit.msrpUsd;
      if (price <= budgetMax) {
        score += 25;
        reasons.push('Within budget');
      } else if (price <= budgetMax * 1.12) {
        score += 8;
        reasons.push('Slightly above budget — financing may still work');
      } else {
        score -= 30;
      }
    }

    if (towing && unit.minTowCapacityLbs > 0) {
      if (towing >= unit.minTowCapacityLbs) {
        score += 22;
        reasons.push(`Your ${towing.toLocaleString()} lb tow rating covers this unit`);
      } else {
        score -= 40;
        reasons.push(
          `Needs ~${unit.minTowCapacityLbs.toLocaleString()} lb tow capacity (you said ${towing.toLocaleString()} lb)`,
        );
      }
    }

    if (unit.minTowCapacityLbs === 0 && towing) {
      score += 15;
      reasons.push('Motorhome — no tow vehicle required');
    }

    if (wantsMotorhome && unit.minTowCapacityLbs === 0) score += 12;
    if (wantsTowable && unit.minTowCapacityLbs > 0) score += 12;

    return { unit, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 20).slice(0, 4);
  const picks = top.length ? top : scored.slice(0, 3);

  return {
    reply: picks.length
      ? `Based on what you shared, here are ${picks.length} Camping World–style matches from our demo lot (not live inventory).`
      : 'Try adding your tow vehicle capacity or a monthly payment target so we can narrow the lot.',
    matches: picks.map((p) => ({
      id: p.unit.id,
      name: p.unit.name,
      fitScore: Math.min(99, Math.max(1, p.score)),
      reason: p.reasons.join(' · ') || 'General fit from demo catalog.',
      estMonthlyUsd: p.unit.estMonthlyUsd,
      msrpUsd: p.unit.msrpUsd,
      minTowCapacityLbs: p.unit.minTowCapacityLbs,
      category: p.unit.category,
      highlights: p.unit.highlights,
    })),
    source: 'rules',
  };
}

async function aiMatch(inventory, message, history, filters) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return ruleBasedMatch(inventory.units, filters);
  }

  const genai = new GoogleGenAI({ apiKey });
  const catalog = inventory.units.map((u) => ({
    id: u.id,
    name: u.name,
    category: u.category,
    sleeps: u.sleeps,
    dryWeightLbs: u.dryWeightLbs,
    minTowCapacityLbs: u.minTowCapacityLbs,
    msrpUsd: u.msrpUsd,
    estMonthlyUsd: u.estMonthlyUsd,
    highlights: u.highlights,
    idealFor: u.idealFor,
    tags: u.tags,
  }));

  const system = `You are an RV product specialist for a ${inventory.partnerName} demo storefront.
Only recommend units from the provided catalog JSON. Never invent SKUs.
Respect towing: if the shopper gives tow capacity in lbs, exclude towables that need more capacity.
Respect budget: shopper may use monthly payment (estMonthlyUsd) or total (msrpUsd).
Motorhomes (minTowCapacityLbs 0) do not need a tow vehicle.
Respond with JSON only (no markdown fences):
{
  "reply": "friendly 2-4 sentence summary",
  "matches": [
    { "id": "catalog-id", "fitScore": 1-99, "reason": "one line why it fits" }
  ],
  "clarifyingQuestions": ["optional short questions if info is missing"]
}
Include 1-4 matches. If nothing fits, explain why and suggest what to change (budget, tow vehicle, or type).`;

  const filterLine = [
    filters.towingCapacityLbs ? `Tow capacity (lbs): ${filters.towingCapacityLbs}` : null,
    filters.budgetMax
      ? `Budget max (${filters.budgetType || 'total'}): ${filters.budgetMax}`
      : null,
    filters.travelStyle ? `Travel style: ${filters.travelStyle}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const historyText = (history || [])
    .slice(-6)
    .map((m) => `${m.role}: ${m.text}`)
    .join('\n');

  const prompt = `${system}

CATALOG:
${JSON.stringify(catalog)}

STRUCTURED FILTERS:
${filterLine || '(none)'}

RECENT CHAT:
${historyText || '(start)'}

SHOPPER MESSAGE:
${message}`;

  try {
    const response = await genai.models.generateContent({
      model: MATCH_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = (response?.text || '').trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error('No JSON in model response');
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const byId = new Map(inventory.units.map((u) => [u.id, u]));
    const matches = (parsed.matches || [])
      .filter((m) => byId.has(m.id))
      .slice(0, 4)
      .map((m) => {
        const unit = byId.get(m.id);
        return {
          id: m.id,
          name: unit.name,
          fitScore: Math.min(99, Math.max(1, Number(m.fitScore) || 70)),
          reason: clip(m.reason, 400) || 'Recommended from your criteria.',
          estMonthlyUsd: unit.estMonthlyUsd,
          msrpUsd: unit.msrpUsd,
          minTowCapacityLbs: unit.minTowCapacityLbs,
          category: unit.category,
          highlights: unit.highlights,
        };
      });

    return {
      reply: clip(parsed.reply, 2000) || 'Here are some options from the demo lot.',
      matches,
      clarifyingQuestions: Array.isArray(parsed.clarifyingQuestions)
        ? parsed.clarifyingQuestions.slice(0, 3).map((q) => clip(q, 200))
        : [],
      source: 'gemini',
    };
  } catch (err) {
    console.error('[rv-match] AI failed, using rules:', err?.message || err);
    return ruleBasedMatch(inventory.units, filters);
  }
}

export function registerRvMatcherRoutes(app, db) {
  app.get('/api/rv/demo-inventory', (_req, res) => {
    try {
      const inventory = loadDemoInventory();
      return res.json(inventory);
    } catch (err) {
      console.error('[rv-inventory]', err);
      return res.status(500).json({ error: 'Could not load demo inventory.' });
    }
  });

  app.post('/api/rv/match', async (req, res) => {
    try {
      const body = req.body || {};
      const message = clip(body.message, 4000);
      if (!message) {
        return res.status(400).json({ error: 'Describe what you are looking for.' });
      }

      const history = Array.isArray(body.history)
        ? body.history
            .filter(
              (m) =>
                m &&
                typeof m.text === 'string' &&
                (m.role === 'user' || m.role === 'assistant'),
            )
            .slice(-8)
            .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }))
        : [];

      const filters = {
        towingCapacityLbs: numOrNull(body.towingCapacityLbs),
        budgetMax: numOrNull(body.budgetMax),
        budgetType: body.budgetType === 'monthly' ? 'monthly' : 'total',
        travelStyle: clip(body.travelStyle, 120),
        wantsMotorhome: body.rvType === 'motorhome',
        wantsTowable: body.rvType === 'towable',
      };

      const inventory = loadDemoInventory();
      const result = await aiMatch(inventory, message, history, filters);

      return res.json({
        ...result,
        partnerName: inventory.partnerName,
        disclaimer: inventory.disclaimer,
      });
    } catch (err) {
      console.error('[rv-match]', err);
      return res.status(500).json({ error: 'Matcher temporarily unavailable.' });
    }
  });

  app.post('/api/rv/enterprise-inquiry', async (req, res) => {
    try {
      const body = req.body || {};
      const company = clip(body.company, 200);
      const email = clip(body.email, 200).toLowerCase();
      const notes = clip(body.notes, 4000);
      const dms = clip(body.dms, 200);
      const rooftops = numOrNull(body.rooftops);

      if (!company) return res.status(400).json({ error: 'Company name is required.' });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid work email is required.' });
      }

      const doc = {
        company,
        email,
        dms,
        rooftops,
        notes,
        product: 'rv-enterprise',
        status: 'new',
        createdAt: FieldValue.serverTimestamp(),
      };

      if (db) {
        await db.collection('rvEnterpriseInquiries').add(doc);
      } else {
        console.log('[rv-enterprise-inquiry]', doc);
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('[rv-enterprise-inquiry]', err);
      return res.status(500).json({ error: 'Could not save inquiry.' });
    }
  });
}
