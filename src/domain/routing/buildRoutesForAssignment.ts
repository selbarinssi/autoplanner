import type { Order, Vehicle, Neighborhood } from '../types';
import { optimizeOrderSequence } from './optimizeOrderSequence';

export interface VehicleRoute {
  vehicleId: string;
  orderedOrders: Order[];
  totalKm: number;
}

/**
 * Builds an optimized route for every vehicle that received orders.
 */
export function buildRoutesForAssignment(
  orders: Order[],
  vehicles: Vehicle[],
  neighborhoods: Neighborhood[],
  amPmCutoffHour: number = 13
): VehicleRoute[] {
  const routes: VehicleRoute[] = [];
  const assignedVehicleIds = [
    ...new Set(
      orders.filter((o) => o.assignedTo).map((o) => o.assignedTo as string)
    ),
  ];

  for (const vehicleId of assignedVehicleIds) {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) continue;

    const myOrders = orders.filter((o) => o.assignedTo === vehicleId);
    const origin: [number, number] =
      vehicle.startLat !== null && vehicle.startLng !== null
        ? [vehicle.startLat, vehicle.startLng]
        : [33.5731, -7.5898];

    const ordered = optimizeOrderSequence(
      myOrders,
      origin,
      neighborhoods,
      amPmCutoffHour
    );

    // Simple km estimate (caller can replace with real OSRM later)
    let totalKm = 0;
    // (we leave detailed km calculation for a later geo helper if needed)

    routes.push({
      vehicleId,
      orderedOrders: ordered,
      totalKm,
    });
  }

  return routes;
}
