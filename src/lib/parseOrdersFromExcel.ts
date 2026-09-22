import * as XLSX from 'xlsx';
import type { Order } from '@/domain/types';
import { ASSEMBLY_KEYWORDS } from '@/config/trsServices';

export type PostalMapping = Record<string, { city: string; area: string }>;

export interface ParseResult {
  orders: Order[];
  errors: string[];
  sheetName: string;
  rowCount: number;
}

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function num(v: unknown): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * IKEA export parser — same logic as O'Planner:
 * - Header row starts at Excel row 6 (range index 5)
 * - Columns: Document No., Service Name, Sell-to Postcode, volume, value
 * - Fixed indices: time slot H, customer name AK, phone AP, assembly col 47
 * - Group lines by Document No.
 * - City/area from postal-codes.json
 */
export function parseOrdersFromExcel(
  buffer: ArrayBuffer,
  postal: PostalMapping = {}
): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0] ?? '';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { orders: [], errors: ['Empty workbook'], sheetName, rowCount: 0 };
  }

  // O'Planner: skip first 5 rows so header is the IKEA column titles
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    range: 5,
  }) as unknown[][];

  if (rows.length < 2) {
    return {
      orders: [],
      errors: [
        'No data rows. Expected IKEA export (header around row 6 with "Document No.").',
      ],
      sheetName,
      rowCount: 0,
    };
  }

  const h = (rows[0] ?? []).map((x) => str(x));
  const docIdx = h.indexOf('Document No.');
  const nameIdx = h.indexOf('Service Name');
  const pcIdx = h.indexOf('Sell-to Postcode');
  const volIdx = h.indexOf('Capacity Value Volume');
  const valIdx = h.indexOf('Service Goods Value');

  // Same fixed columns as O'Planner
  const timeSlotIdx = 7;
  const custNameIdx = 36;
  const custPhoneIdx = 41;
  const assemblyIdx = 47;

  if (docIdx < 0) {
    return {
      orders: [],
      errors: [
        'Not an IKEA planning export: column "Document No." not found after row 6. Use the same Excel file as O\'Planner.',
      ],
      sheetName,
      rowCount: rows.length - 1,
    };
  }

  if (Object.keys(postal).length === 0) {
    // Still import; city/area may be Unknown / postcode
  }

  type Acc = Order & { assemblyMin: number };
  const grouped = new Map<string, Acc>();
  const errors: string[] = [];
  let dataRows = 0;

  for (const row of rows.slice(1)) {
    if (!Array.isArray(row)) continue;
    const id = str(row[docIdx]);
    if (!id || id === 'undefined') continue;
    dataRows++;

    const rawPc = str(row[pcIdx]).split('.')[0].trim();
    const map = postal[rawPc] || { city: 'Unknown', area: rawPc };

    let g = grouped.get(id);
    if (!g) {
      g = {
        id,
        city: map.city,
        neighborhood: map.area,
        volume: 0,
        value: 0,
        services: [],
        hasAssembly: false,
        timeSlot: str(row[timeSlotIdx]),
        custName: str(row[custNameIdx]),
        custPhone: str(row[custPhoneIdx]),
        status: 'confirmed',
        assignedTo: null,
        assemblyMin: 0,
      };
      grouped.set(id, g);
    }

    if (!g.custName && str(row[custNameIdx])) g.custName = str(row[custNameIdx]);
    if (!g.custPhone && str(row[custPhoneIdx]))
      g.custPhone = str(row[custPhoneIdx]);
    if (!g.timeSlot && str(row[timeSlotIdx])) g.timeSlot = str(row[timeSlotIdx]);

    g.volume = Math.max(g.volume, num(row[volIdx]));
    g.value = Math.max(g.value, num(row[valIdx]));
    g.assemblyMin = Math.max(g.assemblyMin, num(row[assemblyIdx]));

    const sn = str(row[nameIdx]);
    if (sn && !g.services.includes(sn)) g.services.push(sn);
    if (ASSEMBLY_KEYWORDS.some((kw) => sn.includes(kw))) g.hasAssembly = true;
    if (g.assemblyMin > 0) g.hasAssembly = true;
  }

  const orders: Order[] = [...grouped.values()].map(
    ({ assemblyMin: _a, ...o }) => o
  );

  if (orders.length === 0) {
    errors.push(
      'No orders grouped. Check the file is the standard IKEA service lines export.'
    );
  } else if (Object.keys(postal).length === 0) {
    errors.push(
      'Warning: postal-codes.json not loaded — cities may show as Unknown. Ensure public/postal-codes.json is deployed.'
    );
  }

  return {
    orders,
    errors,
    sheetName,
    rowCount: dataRows,
  };
}
