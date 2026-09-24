import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { normalizePhone } from './api';
import type { Lead } from './types';

export type ParsedLeadRow = {
  name: string;
  phone: string;
  propertyAddress: string;
  raw: Record<string, string>;
};

export type CsvImportResult = {
  rows: ParsedLeadRow[];
  skipped: number;
  errors: string[];
};

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const pushCell = () => {
    row.push(cell.trim());
    cell = '';
  };
  const pushRow = () => {
    if (row.some((c) => c.length) || cell.trim()) {
      pushCell();
      rows.push(row);
    }
    row = [];
  };
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') {
      if (inQuotes && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === ',') {
      pushCell();
      continue;
    }
    if (!inQuotes && ch === '\n') {
      pushRow();
      continue;
    }
    cell += ch;
  }
  if (cell.length || row.length) pushRow();
  return rows.filter((r) => r.some((c) => String(c).trim()));
}

function cellToString(c: string | number | null | undefined): string {
  if (c == null || c === '') return '';
  if (typeof c === 'number') {
    if (Number.isFinite(c) && Math.abs(c) >= 1e9 && Math.abs(c) < 1e11) {
      return String(Math.round(c));
    }
    return String(c);
  }
  const s = String(c).trim();
  if (/^\d+\.?\d*e\+\d+$/i.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && Math.abs(n) >= 1e9) return String(Math.round(n));
  }
  return s;
}

function gridFromWorkbook(base64: string): string[][] {
  const wb = XLSX.read(base64, { type: 'base64' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });
  return raw.map((row) => row.map((c) => cellToString(c)));
}

function isExcelBase64(b64: string): boolean {
  const head = b64.slice(0, 8);
  return head.startsWith('UEs') || head.startsWith('0M8R4KGx');
}

export async function readLeadSpreadsheetGrid(
  uri: string,
  fileName: string,
  mimeType?: string | null,
): Promise<string[][]> {
  const lower = fileName.toLowerCase();
  const mime = String(mimeType || '').toLowerCase();
  const looksExcel =
    /\.(xlsx|xls|xlsm)$/i.test(lower) ||
    mime.includes('spreadsheet') ||
    mime.includes('ms-excel') ||
    mime.includes('officedocument');

  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (looksExcel || isExcelBase64(b64)) {
    return gridFromWorkbook(b64);
  }

  const text = await FileSystem.readAsStringAsync(uri);
  if (text.charCodeAt(0) === 0xfeff) return parseCsvText(text.slice(1));
  return parseCsvText(text);
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function mapHeader(header: string): 'name' | 'phone' | 'address' | 'skip' | null {
  const h = normalizeHeader(header);
  if (!h) return null;
  if (
    /^(phone|mobile|cell|tel|telephone|sms|contact phone|wireless|day phone|evening phone|primary phone)/.test(h) ||
    h.endsWith(' phone') ||
    h.includes('phone number')
  ) {
    return 'phone';
  }
  if (
    /^(address|property|street|site address|property address|mailing|location|full address|situs|parcel|situs address|property location|subject property)/.test(h) ||
    h.includes('mailing address') ||
    h.includes('site addr')
  ) {
    return 'address';
  }
  if (
    /(^owner|^homeowner|^name|owner name|homeowner name|contact name|first name|last name|grantor|owner 1|owner1)/.test(h)
  ) {
    return 'name';
  }
  if (h.includes('owner') && !h.includes('address')) return 'name';
  if (h.includes('address') || h.includes('property') || h.includes('street') || h.includes('situs')) return 'address';
  return 'skip';
}

function buildColMap(headerRow: string[]) {
  const colMap: { index: number; field: 'name' | 'phone' | 'address' }[] = [];
  headerRow.forEach((h, index) => {
    const field = mapHeader(h);
    if (field && field !== 'skip') colMap.push({ index, field });
  });
  return colMap;
}

function findHeaderRowIndex(grid: string[][]): number {
  for (let i = 0; i < Math.min(15, grid.length); i++) {
    const map = buildColMap(grid[i].map((c) => String(c || '')));
    if (map.some((c) => c.field === 'phone')) return i;
  }
  return 0;
}

export function parseLeadGrid(grid: string[][]): CsvImportResult {
  const errors: string[] = [];
  if (!grid.length) return { rows: [], skipped: 0, errors: ['Empty file'] };

  const headerIndex = findHeaderRowIndex(grid);
  const headerRow = grid[headerIndex].map((c) => String(c || ''));
  let colMap = buildColMap(headerRow);

  let dataRows = grid.slice(headerIndex + 1).map((r) => r.map((c) => String(c ?? '')));
  if (!colMap.some((c) => c.field === 'phone')) {
    colMap = [];
    const first = grid[headerIndex];
    if (first.length >= 3) {
      colMap.push({ index: 0, field: 'name' }, { index: 1, field: 'address' }, { index: 2, field: 'phone' });
      dataRows = grid.slice(headerIndex).map((r) => r.map((c) => String(c ?? '')));
      if (mapHeader(String(grid[headerIndex][0] || ''))) {
        dataRows = dataRows.slice(1);
      }
    } else {
      errors.push('Need columns for owner name, property address, and phone (or a header row we can detect).');
    }
  }

  const rows: ParsedLeadRow[] = [];
  let skipped = 0;
  for (const line of dataRows) {
    if (!line.some((c) => c.trim())) continue;
    const raw: Record<string, string> = {};
    headerRow.forEach((h, i) => {
      raw[h || `col${i}`] = line[i] || '';
    });
    const acc: ParsedLeadRow = { name: '', phone: '', propertyAddress: '', raw };
    for (const { index, field } of colMap) {
      const val = (line[index] || '').trim();
      if (!val) continue;
      if (field === 'name') acc.name = acc.name ? `${acc.name} & ${val}` : val;
      else if (field === 'phone') acc.phone = val;
      else if (field === 'address') acc.propertyAddress = acc.propertyAddress ? `${acc.propertyAddress}, ${val}` : val;
    }
    const phone = normalizePhone(acc.phone);
    if (phone.replace(/\D/g, '').length < 10) {
      skipped++;
      continue;
    }
    if (!acc.propertyAddress.trim()) {
      skipped++;
      continue;
    }
    rows.push({ ...acc, phone });
  }

  if (!rows.length && !errors.length) {
    errors.push('No valid rows — each lead needs phone (10+ digits) and a property address.');
  }

  return { rows, skipped, errors };
}

export function parseLeadCsv(text: string): CsvImportResult {
  return parseLeadGrid(parseCsvText(text));
}

export async function importLeadsFromFileUri(
  uri: string,
  fileName: string,
  mimeType?: string | null,
): Promise<CsvImportResult> {
  const grid = await readLeadSpreadsheetGrid(uri, fileName, mimeType);
  return parseLeadGrid(grid);
}

/** Leads eligible for automation / dialer queue (phone + property address, status new). */
export function countAutomationReadyLeads(leads: { phone?: string; propertyAddress?: string; status?: string; optedOut?: boolean; agentPaused?: boolean }[]) {
  return leads.filter(
    (l) =>
      l.phone &&
      l.propertyAddress?.trim() &&
      !l.optedOut &&
      !l.agentPaused &&
      l.status !== 'dead' &&
      (!l.status || l.status === 'new'),
  ).length;
}

export function parsedRowsToLeads(rows: ParsedLeadRow[]): Lead[] {
  const now = Date.now();
  return rows.map((r, i) => ({
    id: `import-${now}-${i}`,
    name: r.name,
    phone: r.phone,
    propertyAddress: r.propertyAddress,
    notes: r.propertyAddress,
    status: 'new' as const,
    talkedTo: false,
    agentPaused: false,
  }));
}

/** Paste-friendly sample for the import modal */
export const LEAD_IMPORT_SAMPLE = `Owner Name,Property Address,Phone
John Smith,123 Oak St Eugene OR,5415551234
Jane & Bob Doe,456 Pine Ave Springfield OR,541-555-9876`;
