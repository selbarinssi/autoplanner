import type { Order, OrderStatus } from '@/domain/types';

function norm(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Minimal CSV parser: handles quoted fields and ; or , separators */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  // Detect separator from first line
  const firstLine = text.split(/\r?\n/)[0] ?? '';
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const sep = semiCount > commaCount ? ';' : ',';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
      if (ch === '\r') i++;
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  // last cell
  row.push(cell.trim());
  if (row.some((c) => c !== '')) rows.push(row);

  return rows;
}

function col(headers: string[], ...candidates: string[]): number {
  const set = candidates.map(norm);
  return headers.findIndex((h) => set.includes(h));
}

function cell(row: string[], i: number): string {
  if (i < 0 || i >= row.length) return '';
  return (row[i] ?? '').trim();
}

function num(row: string[], i: number): number {
  const s = cell(row, i).replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseServices(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseStatus(raw: string): OrderStatus {
  const s = raw.toLowerCase();
  if (s.includes('unreach') || s.includes('injoign')) return 'unreachable';
  if (s.includes('postpon') || s.includes('report')) return 'postponed';
  if (s.includes('cancel') || s.includes('annul')) return 'cancelled';
  return 'confirmed';
}

function detectAssembly(services: string[], hasAssemblyRaw: string): boolean {
  if (hasAssemblyRaw) {
    const v = hasAssemblyRaw.toLowerCase();
    if (['1', 'true', 'yes', 'oui', 'y', 'x'].includes(v)) return true;
    if (['0', 'false', 'no', 'non', 'n'].includes(v)) return false;
  }
  return services.some((s) =>
    /assembl|montage|da\b|installation/i.test(s)
  );
}

export interface ParseResult {
  orders: Order[];
  errors: string[];
  rowCount: number;
}

export function parseOrdersFromCsv(text: string): ParseResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { orders: [], errors: ['No data rows found'], rowCount: 0 };
  }

  const headerRow = rows[0].map(norm);
  const dataRows = rows.slice(1);

  const iId = col(headerRow, 'id', 'orderid', 'ncommande', 'commande', 'ref', 'reference');
  const iCity = col(headerRow, 'city', 'ville');
  const iNeighborhood = col(
    headerRow,
    'neighborhood',
    'quartier',
    'area',
    'zone',
    'secteur'
  );
  const iVolume = col(headerRow, 'volume', 'vol', 'm3', 'volumem3');
  const iValue = col(headerRow, 'value', 'valeur', 'montant', 'amount', 'total');
  const iServices = col(
    headerRow,
    'services',
    'service',
    'prestations',
    'prestation'
  );
  const iAssembly = col(
    headerRow,
    'hasassembly',
    'assembly',
    'montage',
    'assemblage'
  );
  const iTimeSlot = col(
    headerRow,
    'timeslot',
    'creneau',
    'slot',
    'horaire',
    'heure',
    'deliverytime'
  );
  const iName = col(
    headerRow,
    'custname',
    'customer',
    'client',
    'nom',
    'name',
    'customername'
  );
  const iPhone = col(
    headerRow,
    'custphone',
    'phone',
    'telephone',
    'tel',
    'mobile'
  );
  const iStatus = col(headerRow, 'status', 'statut', 'etat');

  const orders: Order[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (row.every((c) => !c.trim())) return;

    const city = cell(row, iCity);
    const neighborhood = cell(row, iNeighborhood);
    if (!city && !neighborhood) {
      errors.push(`Row ${rowNum}: missing city and neighborhood — skipped`);
      return;
    }

    const services = parseServices(cell(row, iServices));
    const hasAssembly = detectAssembly(services, cell(row, iAssembly));
    const id = cell(row, iId) || `imp-${crypto.randomUUID().slice(0, 8)}`;

    orders.push({
      id,
      city: city || 'Casablanca',
      neighborhood: neighborhood || '',
      volume: num(row, iVolume),
      value: num(row, iValue),
      services,
      hasAssembly,
      timeSlot: cell(row, iTimeSlot),
      custName: cell(row, iName),
      custPhone: cell(row, iPhone),
      status: parseStatus(cell(row, iStatus)),
      assignedTo: null,
    });
  });

  return { orders, errors, rowCount: dataRows.length };
}
