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

function parseCsv(text: string): string[][] {
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
  return rows.filter((r) => r.some((c) => c.trim()));
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function mapHeader(header: string): 'name' | 'phone' | 'address' | 'skip' | null {
  const h = normalizeHeader(header);
  if (!h) return null;
  if (/^(phone|mobile|cell|tel|telephone|sms|contact phone)/.test(h) || h.endsWith(' phone')) return 'phone';
  if (/^(address|property|street|site address|property address|mailing|location|full address)/.test(h)) {
    return 'address';
  }
  if (/(^owner|^homeowner|^name|owner name|homeowner name|contact name|first name)/.test(h)) return 'name';
  if (h.includes('owner') && !h.includes('address')) return 'name';
  if (h.includes('address') || h.includes('property')) return 'address';
  return 'skip';
}

export function parseLeadCsv(text: string): CsvImportResult {
  const errors: string[] = [];
  const grid = parseCsv(text);
  if (!grid.length) return { rows: [], skipped: 0, errors: ['Empty file'] };

  const headerRow = grid[0];
  const colMap: { index: number; field: 'name' | 'phone' | 'address' }[] = [];
  headerRow.forEach((h, index) => {
    const field = mapHeader(h);
    if (field && field !== 'skip') colMap.push({ index, field });
  });

  let dataRows = grid.slice(1);
  if (!colMap.some((c) => c.field === 'phone')) {
    colMap.length = 0;
    if (grid[0].length >= 2) {
      colMap.push({ index: 0, field: 'name' }, { index: 1, field: 'address' }, { index: 2, field: 'phone' });
      dataRows = grid;
    } else {
      errors.push('Could not find phone column — use headers like Name, Property Address, Phone.');
    }
  }

  const rows: ParsedLeadRow[] = [];
  let skipped = 0;
  for (const line of dataRows) {
    const raw: Record<string, string> = {};
    headerRow.forEach((h, i) => {
      raw[h || `col${i}`] = line[i] || '';
    });
    const acc: ParsedLeadRow = { name: '', phone: '', propertyAddress: '', raw };
    for (const { index, field } of colMap) {
      const val = (line[index] || '').trim();
      if (field === 'name') acc.name = acc.name ? `${acc.name} & ${val}` : val;
      else if (field === 'phone' && val) acc.phone = val;
      else if (field === 'address') acc.propertyAddress = acc.propertyAddress ? `${acc.propertyAddress}, ${val}` : val;
    }
    const phone = normalizePhone(acc.phone);
    if (phone.replace(/\D/g, '').length < 10) {
      skipped++;
      continue;
    }
    rows.push({ ...acc, phone });
  }

  return { rows, skipped, errors };
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
