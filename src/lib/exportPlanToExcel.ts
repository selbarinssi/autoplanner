import * as XLSX from 'xlsx';
import type { Order, Vehicle, Neighborhood } from '@/domain/types';
import { buildRoutesForAssignment } from '@/domain/routing/buildRoutesForAssignment';
import { isTRS } from '@/domain/classification/isTRS';
import { TRS_SERVICE_NAMES } from '@/config/trsServices';

export function exportPlanToExcel(
  orders: Order[],
  vehicles: Vehicle[],
  neighborhoods: Neighborhood[]
): void {
  const routes = buildRoutesForAssignment(orders, vehicles, neighborhoods);
  const stopIndex = new Map<string, number>();
  for (const r of routes) {
    r.orderedOrders.forEach((o, i) => stopIndex.set(o.id, i + 1));
  }

  const rows = orders.map((o) => {
    const type = isTRS(o, TRS_SERVICE_NAMES)
      ? 'TRS'
      : o.hasAssembly
        ? 'D&A'
        : 'HD';
    return {
      'Order ID': o.id,
      Status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
      Type: type,
      'Customer Name': o.custName,
      'Customer Phone': o.custPhone,
      Vehicle: o.assignedTo || 'UNASSIGNED',
      'Route Stop #':
        o.assignedTo && stopIndex.has(o.id) ? stopIndex.get(o.id)! : '',
      City: o.city,
      Area: o.neighborhood,
      'Time Slot': o.timeSlot,
      'Volume (CBM)': o.volume,
      'Value (MAD)': o.value,
      Services: o.services.join(', '),
    };
  });

  const active = vehicles.filter((v) => !v.isDown);
  const summary = active.map((v) => {
    const my = orders.filter((o) => o.assignedTo === v.id);
    const vol = my.reduce((s, o) => s + o.volume, 0);
    return {
      Vehicle: v.id,
      Type: v.type,
      City: v.city,
      'Primary Area': v.primaryNeighborhood,
      'Start Lat': v.startLat ?? '',
      'Start Lng': v.startLng ?? '',
      Orders: my.length,
      'Total Volume': vol.toFixed(2),
      Capacity: v.capacity,
      'Vol %':
        v.capacity > 0 ? Math.round((vol / v.capacity) * 100) + '%' : 'N/A',
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'All Orders');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(summary),
    'Vehicle Summary'
  );
  XLSX.writeFile(
    wb,
    `Planning_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
