/**
 * Reads property screenshots from realestate/public/screenshots,
 * extracts structured rows via Gemini vision, dedupes by normalized primary address,
 * and writes realestate/public/listings.csv for map ingestion.
 *
 * Requires: GEMINI_API_KEY in environment (.env at repo root supported via dotenv).
 *
 * Usage: node realestate/scripts/extract-screenshots-to-csv.mjs
 */

import 'dotenv/config';
import { GoogleGenAI, createPartFromBase64 } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RE_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(RE_ROOT, 'public/screenshots');
const OUT_CSV = path.join(RE_ROOT, 'public/listings.csv');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const CSV_COLUMNS = [
  'id',
  'primary_address',
  'city',
  'state',
  'zip',
  'country',
  'latitude',
  'longitude',
  'title',
  'price',
  'beds',
  'baths',
  'sqft',
  'property_type',
  'status',
  'mls_id',
  'list_date',
  'agent',
  'broker',
  'remarks',
  'source_screenshot',
];

function mimeForExt(ext) {
  const e = ext.toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function listScreenshotFiles() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.error('Missing folder:', SCREENSHOTS_DIR);
    process.exit(1);
  }
  return fs
    .readdirSync(SCREENSHOTS_DIR)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort();
}

function normalizeAddressKey(row) {
  const parts = [
    row.primary_address ?? '',
    row.city ?? '',
    row.state ?? '',
    row.zip ?? '',
  ]
    .join(' ')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return parts;
}

function stableIdFromKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 12);
}

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map((c) => escapeCsvCell(row[c])).join(','));
  }
  return lines.join('\n') + '\n';
}

const EXTRACTION_PROMPT = `You are extracting real estate listing rows from a screenshot for a map application.

Rules:
- The image may be a spreadsheet/table (with column headers), a web page capture, or a document. Read ALL visible listing rows.
- If column headers exist, map them to the JSON fields below. Omit header text from row data.
- Use empty string "" for any field you cannot read.
- primary_address: street number and street name only (no city/state/zip).
- country: ISO-like short name, default "US" if clearly United States.
- latitude / longitude: decimal degrees as strings if visible; otherwise "".
- price: include currency symbol if shown (e.g. "$450,000"), else numeric string.
- beds, baths, sqft: strings; use decimals for half-baths if shown (e.g. "2.5").
- property_type: e.g. Single Family, Condo, Land, Commercial.
- status: e.g. Active, Pending, Sold, if shown.
- remarks: short notes from description column if present.

Return ONLY valid JSON (no markdown fences) in this exact shape:
{"listings":[{"primary_address":"","city":"","state":"","zip":"","country":"","latitude":"","longitude":"","title":"","price":"","beds":"","baths":"","sqft":"","property_type":"","status":"","mls_id":"","list_date":"","agent":"","broker":"","remarks":""}]}

If there are zero listings, return {"listings":[]}.`;

async function extractFromImage(ai, filePath, basename) {
  const ext = path.extname(filePath);
  const mime = mimeForExt(ext);
  const b64 = fs.readFileSync(filePath).toString('base64');
  const imagePart = createPartFromBase64(b64, mime);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [imagePart, { text: EXTRACTION_PROMPT }],
    config: {
      responseMimeType: 'application/json',
    },
  });

  let text = response.text?.trim() ?? '';
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  const parsed = JSON.parse(text);
  const listings = Array.isArray(parsed.listings) ? parsed.listings : [];
  return listings.map((L) => ({
    ...L,
    source_screenshot: basename,
  }));
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.error(
      'Set a valid GEMINI_API_KEY in the environment (or .env at repo root).',
    );
    process.exit(1);
  }

  const files = listScreenshotFiles();
  if (files.length === 0) {
    console.error(
      'No images found in',
      SCREENSHOTS_DIR,
      '- add .png, .jpg, .jpeg, or .webp files.',
    );
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const merged = [];

  for (const name of files) {
    const fp = path.join(SCREENSHOTS_DIR, name);
    process.stdout.write(`Extracting: ${name} ... `);
    try {
      const chunk = await extractFromImage(ai, fp, name);
      merged.push(...chunk);
      console.log(`${chunk.length} row(s)`);
    } catch (e) {
      console.log('FAILED');
      console.error(e.message || e);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const byKey = new Map();
  for (const raw of merged) {
    const key = normalizeAddressKey(raw);
    if (!key) continue;
    if (!byKey.has(key)) {
      const title =
        raw.title ||
        [raw.primary_address, raw.city, raw.state].filter(Boolean).join(', ');
      byKey.set(key, {
        id: stableIdFromKey(key),
        primary_address: raw.primary_address ?? '',
        city: raw.city ?? '',
        state: raw.state ?? '',
        zip: raw.zip ?? '',
        country: raw.country ?? '',
        latitude: raw.latitude ?? '',
        longitude: raw.longitude ?? '',
        title,
        price: raw.price ?? '',
        beds: raw.beds ?? '',
        baths: raw.baths ?? '',
        sqft: raw.sqft ?? '',
        property_type: raw.property_type ?? '',
        status: raw.status ?? '',
        mls_id: raw.mls_id ?? '',
        list_date: raw.list_date ?? '',
        agent: raw.agent ?? '',
        broker: raw.broker ?? '',
        remarks: raw.remarks ?? '',
        source_screenshot: raw.source_screenshot ?? '',
      });
    }
  }

  const rows = [...byKey.values()].sort((a, b) =>
    a.primary_address.localeCompare(b.primary_address),
  );

  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(OUT_CSV, rowsToCsv(rows), 'utf8');
  console.log(
    `\nWrote ${rows.length} unique listing(s) (deduped by address) to:\n${OUT_CSV}`,
  );
}

main();
