import * as XLSX from 'xlsx';
import type { Order, Vehicle, Neighborhood } from '@/domain/types';
import { buildRoutesForAssignment } from '@/domain/routing/buildRoutesForAssignment';

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

  const rows = orders.map((o) => ({
    'Order ID': o.id,
    Status: o.status,
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
    Assembly: o.hasAssembly ? 'Yes' : 'No',
  }));

  const summary = vehicles
    .filter((v) => !v.isDown)
    .map((v) => {
      const my = orders.filter((o) => o.assignedTo === v.id);
      const vol = my.reduce((s, o) => s + o.volume, 0);
      return {
        Vehicle: v.id,
        Type: v.type,
        City: v.city,
        'Primary Area': v.primaryNeighborhood,
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
