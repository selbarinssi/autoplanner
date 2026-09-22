import * as XLSX from 'xlsx';
import type { Order, OrderStatus } from '@/domain/types';

/** Normalise a header cell for matching */
function norm(h: unknown): string {
  return String(h ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Find column index by any of the candidate header names */
function col(headers: string[], ...candidates: string[]): number {
  const set = candidates.map(norm);
  return headers.findIndex((h) => set.includes(h));
}

function cell(row: unknown[], i: number): string {
  if (i < 0 || i >= row.length) return '';
  const v = row[i];
  if (v == null) return '';
  return String(v).trim();
}

function num(row: unknown[], i: number): number {
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
  sheetName: string;
  rowCount: number;
}

/**
 * Parse first sheet of an .xlsx / .xls / .csv ArrayBuffer into Order[].
 * Column matching is tolerant (FR + EN headers).
 */
export function parseOrdersFromExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0] ?? '';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { orders: [], errors: ['Empty workbook'], sheetName, rowCount: 0 };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  if (rows.length < 2) {
    return {
      orders: [],
      errors: ['No data rows found'],
      sheetName,
      rowCount: 0,
    };
  }

  const headerRow = (rows[0] ?? []).map((h) => norm(h));
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
  const iVolume = col(headerRow, 'volume', 'vol', 'm3', 'volume_m3');
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
    const rowNum = idx + 2; // 1-based + header
    if (!Array.isArray(row) || row.every((c) => cell([c], 0) === '')) return;

    const city = cell(row, iCity);
    const neighborhood = cell(row, iNeighborhood);
    if (!city && !neighborhood) {
      errors.push(`Row ${rowNum}: missing city and neighborhood — skipped`);
      return;
    }

    const services = parseServices(cell(row, iServices));
    const hasAssembly = detectAssembly(services, cell(row, iAssembly));

    const id =
      cell(row, iId) ||
      `imp-${crypto.randomUUID().slice(0, 8)}`;

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

  return {
    orders,
    errors,
    sheetName,
    rowCount: dataRows.length,
  };
}
