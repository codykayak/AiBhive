/**
 * Builds realestate/public/listings.csv from everything in realestate/public/screenshots:
 * - .csv / .xlsx / .xls  → parsed locally (no row cap; every row is kept)
 * - images (.png, .jpg, .jpeg, .webp) → Gemini vision; maxOutputTokens 8192, plus
 *   row-window passes when the first pass returns 85+ rows (typical JSON truncation)
 *
 * Requires GEMINI_API_KEY only when there is at least one image to process.
 *
 * Usage: node realestate/scripts/extract-screenshots-to-csv.mjs
 *    or: npm run realestate:extract-csv
 */

import 'dotenv/config';
import { GoogleGenAI, createPartFromBase64 } from '@google/genai';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RE_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(RE_ROOT, 'public/screenshots');
const OUT_CSV = path.join(RE_ROOT, 'public/listings.csv');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const CSV_EXT = new Set(['.csv']);
const XLSX_EXT = new Set(['.xlsx', '.xls']);

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

const CANON_FIELDS = CSV_COLUMNS.filter((c) => c !== 'id');

/** Map a spreadsheet column header to our canonical field (first match wins per file). */
function detectFieldForHeader(header) {
  if (header == null || header === '') return null;
  const h = String(header).trim().toLowerCase().replace(/\s+/g, ' ');

  if (/^lat(itude)?$/.test(h) || h === 'lat') return 'latitude';
  if (/^l(ng|on|ongitude)$/.test(h) || h === 'longitude' || h === 'long') return 'longitude';
  if (/zip|postal|post code|postcode/.test(h)) return 'zip';
  if (/^state$|^st$|^province$/.test(h)) return 'state';
  if (/^city$|^town$/.test(h)) return 'city';
  if (/country|nation/.test(h)) return 'country';
  if (/mls|listing\s*#|listing\s*id|list\s*#|listingid/.test(h)) return 'mls_id';
  if (/list\s*date|listed|on\s*market/.test(h)) return 'list_date';
  if (/status/.test(h)) return 'status';
  if (/price|amount|list\s*price|sale\s*price/.test(h)) return 'price';
  if (/^bed/.test(h) || /\bbr\b/.test(h) || /# bed/.test(h)) return 'beds';
  if (/^bath/.test(h) || /\bba\b/.test(h) || /# bath/.test(h)) return 'baths';
  if (/sq\.?\s*ft|sqft|square\s*feet|glar?/.test(h)) return 'sqft';
  if (/type|property\s*class|class/.test(h) && !/agent/.test(h)) return 'property_type';
  if (/agent|realtor|rep/.test(h) && !/managing/.test(h)) return 'agent';
  if (/broker|office|firm|company/.test(h)) return 'broker';
  if (/remarks|notes|description|comments|details/.test(h)) return 'remarks';
  if (/^title$|^name$|property\s*name|subdivision/.test(h)) return 'title';
  if (
    /address|street|location|property\s*addr|situs|mailing\s*addr|site\s*addr/.test(h) &&
    !/email|e-mail/.test(h)
  ) {
    return 'primary_address';
  }
  return null;
}

function buildFieldToHeaderMap(headers) {
  const fieldToHeader = {};
  for (const h of headers) {
    const f = detectFieldForHeader(h);
    if (f && fieldToHeader[f] == null) fieldToHeader[f] = h;
  }
  return fieldToHeader;
}

function cellToString(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (Math.abs(v) > 1e12) return String(Math.round(v));
    return String(v);
  }
  return String(v).trim();
}

function rowFromMappedObject(obj, fieldToHeader, sourceBasename) {
  const row = {};
  for (const f of CANON_FIELDS) {
    if (f === 'source_screenshot') continue;
    const hdr = fieldToHeader[f];
    row[f] = hdr != null ? cellToString(obj[hdr]) : '';
  }
  row.source_screenshot = sourceBasename;
  return row;
}

function parseCsvFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
  });
  if (!records.length) return [];
  const headers = Object.keys(records[0]);
  const fieldToHeader = buildFieldToHeaderMap(headers);
  const base = path.basename(filePath);
  return records.map((obj) => rowFromMappedObject(obj, fieldToHeader, base));
}

function parseSpreadsheetFile(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true, raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (!records.length) return [];
  const headers = Object.keys(records[0]);
  const fieldToHeader = buildFieldToHeaderMap(headers);
  const base = path.basename(filePath);
  return records.map((obj) => rowFromMappedObject(obj, fieldToHeader, base));
}

function mimeForExt(ext) {
  const e = ext.toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function listDirFiles() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.error('Missing folder:', SCREENSHOTS_DIR);
    process.exit(1);
  }
  return fs.readdirSync(SCREENSHOTS_DIR).sort();
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

const LISTING_JSON_SHAPE = `{"listings":[{"primary_address":"","city":"","state":"","zip":"","country":"","latitude":"","longitude":"","title":"","price":"","beds":"","baths":"","sqft":"","property_type":"","status":"","mls_id":"","list_date":"","agent":"","broker":"","remarks":""}]}`;

const EXTRACTION_PROMPT_FULL = `You are extracting real estate listing rows from a screenshot for a map application.

Rules:
- The image may be a spreadsheet/table (with column headers), a web page capture, or a document. Read ALL visible listing rows in ONE response.
- If column headers exist, map them to the JSON fields below. Omit header text from row data.
- Use empty string "" for any field you cannot read.
- primary_address: street number and street name only (no city/state/zip).
- country: default "US" if clearly United States.
- latitude / longitude: decimal degrees as strings if visible; otherwise "".
- price: include currency symbol if shown (e.g. "$450,000"), else numeric string.
- beds, baths, sqft: strings.
- property_type, status, mls_id, list_date, agent, broker, remarks as visible.

Return ONLY valid JSON (no markdown fences) in this exact shape:
${LISTING_JSON_SHAPE}

If there are zero listings, return {"listings":[]}.`;

function chunkPrompt(startInclusive, endInclusive) {
  return `You are extracting real estate listings from a screenshot table for a map app.

Extract ONLY data rows whose 1-based position in the MAIN data table (excluding the header row, counting top-to-bottom in reading order) is from ${startInclusive} through ${endInclusive} inclusive.
If this range is past the end of the table, return {"listings":[]}.
Do not repeat rows you would include outside this range.

Field rules: same as a standard MLS export — primary_address is street line only; city, state, zip separate; lat/long as strings if shown; other fields as in the table.

Return ONLY valid JSON (no markdown) in this exact shape:
${LISTING_JSON_SHAPE}`;
}

async function extractFromImageOnce(ai, filePath, basename, prompt) {
  const ext = path.extname(filePath);
  const mime = mimeForExt(ext);
  const b64 = fs.readFileSync(filePath).toString('base64');
  const imagePart = createPartFromBase64(b64, mime);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [imagePart, { text: prompt }],
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: 8192,
      temperature: 0.1,
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

async function extractFromImageAllPasses(ai, filePath, basename) {
  const first = await extractFromImageOnce(
    ai,
    filePath,
    basename,
    EXTRACTION_PROMPT_FULL,
  );

  // One-shot is enough for small tables; ~100+ often means JSON was truncated.
  if (first.length < 85) {
    return first;
  }

  const ROWS = 45;
  const MAX_PASSES = 80;
  const merged = [];
  let emptyStreak = 0;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const start = pass * ROWS + 1;
    const end = (pass + 1) * ROWS;
    const chunk = await extractFromImageOnce(
      ai,
      filePath,
      basename,
      chunkPrompt(start, end),
    );
    if (!chunk.length) {
      emptyStreak += 1;
      if (emptyStreak >= 4) break;
    } else {
      emptyStreak = 0;
      merged.push(...chunk);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  if (merged.length === 0) return first;
  return merged;
}

function dedupeRows(merged) {
  const byKey = new Map();
  let synthetic = 0;

  for (const raw of merged) {
    let key = normalizeAddressKey(raw);
    if (!key) {
      const mid = (raw.mls_id ?? '').toString().trim().toLowerCase();
      if (mid) key = `mls:${mid}`;
      else {
        synthetic += 1;
        key = `_noloc_${raw.source_screenshot ?? 'unknown'}_${synthetic}`;
      }
    }

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

  return [...byKey.values()].sort((a, b) =>
    a.primary_address.localeCompare(b.primary_address),
  );
}

async function main() {
  const names = listDirFiles();
  const csvFiles = names.filter((n) => CSV_EXT.has(path.extname(n).toLowerCase()));
  const xlsFiles = names.filter((n) => XLSX_EXT.has(path.extname(n).toLowerCase()));
  const imgFiles = names.filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase()));

  const merged = [];

  for (const n of csvFiles) {
    const fp = path.join(SCREENSHOTS_DIR, n);
    const rows = parseCsvFile(fp);
    merged.push(...rows);
    console.log(`CSV ${n}: ${rows.length} row(s)`);
  }

  for (const n of xlsFiles) {
    const fp = path.join(SCREENSHOTS_DIR, n);
    try {
      const rows = parseSpreadsheetFile(fp);
      merged.push(...rows);
      console.log(`Spreadsheet ${n}: ${rows.length} row(s)`);
    } catch (e) {
      console.error(`Failed reading ${n}:`, e.message || e);
      process.exit(1);
    }
  }

  const needsGemini = imgFiles.length > 0;
  const apiKey = process.env.GEMINI_API_KEY;

  if (needsGemini) {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.error(
        'Images require a valid GEMINI_API_KEY (or remove images and use CSV/XLSX only).',
      );
      process.exit(1);
    }
    const ai = new GoogleGenAI({ apiKey });
    for (const n of imgFiles) {
      const fp = path.join(SCREENSHOTS_DIR, n);
      process.stdout.write(`Vision extract: ${n} ... `);
      try {
        const rows = await extractFromImageAllPasses(ai, fp, n);
        merged.push(...rows);
        console.log(`${rows.length} raw row(s) before dedupe`);
      } catch (e) {
        console.log('FAILED');
        console.error(e.message || e);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  if (merged.length === 0) {
    console.error(
      'No data: add .csv, .xlsx, .xls, and/or images under',
      SCREENSHOTS_DIR,
    );
    process.exit(1);
  }

  const rows = dedupeRows(merged);

  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(OUT_CSV, rowsToCsv(rows), 'utf8');
  console.log(
    `\nWrote ${rows.length} unique listing(s) to:\n${OUT_CSV}\n` +
      `(merged ${merged.length} raw row(s); deduped by address / MLS / synthetic key)`,
  );
}

main();
