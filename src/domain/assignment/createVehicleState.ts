import type { Vehicle } from '../types';

export interface VehicleState {
  vehicleId: string;
  currentVolume: number;
  currentPoints: number;
  lastCentroid: [number, number];
  assignedOrderIds: string[];
}

/**
 * Initializes runtime state for every active vehicle.
 */
export function createVehicleState(
  vehicles: Vehicle[],
  defaultOrigin: [number, number] = [33.5731, -7.5898] // Casablanca fallback
): Record<string, VehicleState> {
  const state: Record<string, VehicleState> = {};

  for (const v of vehicles) {
    if (v.isDown) continue;

    state[v.id] = {
      vehicleId: v.id,
      currentVolume: 0,
      currentPoints: 0,
      lastCentroid:
        v.startLat !== null && v.startLng !== null
          ? [v.startLat, v.startLng]
          : defaultOrigin,
      assignedOrderIds: [],
    };
  }

  return state;
}
