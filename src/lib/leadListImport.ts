/** Same column rules as the Lead Agent dialer (CSV and Excel). */

export type ParsedLeadRow = {
  name: string;
  phone: string;
  propertyAddress: string;
};

export type LeadImportParse = {
  rows: ParsedLeadRow[];
  skipped: number;
  errors: string[];
};

function normalizePhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(phone || '').startsWith('+') && digits.length >= 10) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

function detectDelimiter(text: string): string {
  const line = text.replace(/^\uFEFF/, '').split(/\r?\n/).find((l) => l.trim()) || '';
  const tabs = (line.match(/\t/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  if (tabs > commas && tabs > 0) return '\t';
  if (semis > commas && semis > 0) return ';';
  return ',';
}

function parseDelimitedText(text: string, delimiter: string): string[][] {
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
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"') {
      if (inQuotes && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) {
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

function parseCsvText(text: string): string[][] {
  return parseDelimitedText(text, detectDelimiter(text));
}

function cellToString(c: unknown): string {
  if (c == null || c === '') return '';
  if (typeof c === 'number') {
    if (Number.isFinite(c) && Math.abs(c) >= 1e9 && Math.abs(c) < 1e11) return String(Math.round(c));
    return String(c);
  }
  const s = String(c).trim();
  if (/^\d+\.?\d*e\+\d+$/i.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && Math.abs(n) >= 1e9) return String(Math.round(n));
  }
  return s;
}

function normalizeHeader(h: string) {
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

function findHeaderRowIndex(grid: string[][]) {
  for (let i = 0; i < Math.min(15, grid.length); i += 1) {
    if (buildColMap(grid[i].map((c) => String(c || ''))).some((c) => c.field === 'phone')) return i;
  }
  return 0;
}

export function parseLeadGrid(grid: string[][]): LeadImportParse {
  const errors: string[] = [];
  if (!grid.length) return { rows: [], skipped: 0, errors: ['Empty file'] };
  const headerIndex = findHeaderRowIndex(grid);
  const headerRow = grid[headerIndex].map((c) => String(c || ''));
  let colMap = buildColMap(headerRow);
  let dataRows = grid.slice(headerIndex + 1).map((r) => r.map((c) => String(c ?? '')));
  if (!colMap.some((c) => c.field === 'phone')) {
    const first = grid[headerIndex];
    if ((first || []).length >= 3) {
      colMap = [
        { index: 0, field: 'name' },
        { index: 1, field: 'address' },
        { index: 2, field: 'phone' },
      ];
      dataRows = grid.slice(headerIndex).map((r) => r.map((c) => String(c ?? '')));
      if (mapHeader(String(grid[headerIndex][0] || ''))) dataRows = dataRows.slice(1);
    } else {
      errors.push('Need columns for owner name, property address, and phone (or a header row we can detect).');
    }
  }
  const rows: ParsedLeadRow[] = [];
  let skipped = 0;
  for (const line of dataRows) {
    if (!line.some((c) => c.trim())) continue;
    const acc: ParsedLeadRow = { name: '', phone: '', propertyAddress: '' };
    for (const { index, field } of colMap) {
      const val = (line[index] || '').trim();
      if (!val) continue;
      if (field === 'name') acc.name = acc.name ? `${acc.name} & ${val}` : val;
      else if (field === 'phone') acc.phone = val;
      else acc.propertyAddress = acc.propertyAddress ? `${acc.propertyAddress}, ${val}` : val;
    }
    const phone = normalizePhone(acc.phone);
    if (phone.replace(/\D/g, '').length < 10 || !acc.propertyAddress.trim()) {
      skipped += 1;
      continue;
    }
    rows.push({ ...acc, phone });
  }
  if (!rows.length && !errors.length) {
    errors.push('No valid rows — each lead needs phone (10+ digits) and a property address.');
  }
  return { rows, skipped, errors };
}

export function parseLeadCsv(text: string): LeadImportParse {
  return parseLeadGrid(parseCsvText(text));
}

export async function parseLeadFile(file: File): Promise<LeadImportParse> {
  const lower = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();
  const looksExcel =
    /\.(xlsx|xls|xlsm)$/i.test(lower) ||
    mime.includes('spreadsheet') ||
    mime.includes('ms-excel') ||
    mime.includes('officedocument');

  if (looksExcel) {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0] || ''];
      if (!sheet) return { rows: [], skipped: 0, errors: ['Workbook has no sheets'] };
      const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, defval: '', raw: true });
      return parseLeadGrid(raw.map((row) => (row || []).map((c) => cellToString(c))));
    } catch (e) {
      return {
        rows: [],
        skipped: 0,
        errors: [e instanceof Error ? e.message : 'Could not read Excel — try CSV or re-save as .xlsx'],
      };
    }
  }
  return parseLeadGrid(parseCsvText(await file.text()));
}

export const LEAD_IMPORT_SAMPLE = `Owner Name,Property Address,Phone
John Smith,123 Oak St Eugene OR,5415551234
Jane & Bob Doe,456 Pine Ave Springfield OR,541-555-9876`;
