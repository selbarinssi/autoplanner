import type { Vehicle, DispatchConfig, Neighborhood } from '../types';
import type { VehicleState } from './createVehicleState';
import type { Target } from './scoreVehicleForTarget';
import { scoreVehicleForTarget } from './scoreVehicleForTarget';

/**
 * Returns the best vehicle for a target, or null if none can accept it.
 */
export function findBestVehicle(
  vehicles: Vehicle[],
  states: Record<string, VehicleState>,
  target: Target,
  config: DispatchConfig,
  neighborhoods: Neighborhood[]
): { vehicle: Vehicle; score: number } | null {
  let best: { vehicle: Vehicle; score: number } | null = null;

  for (const vehicle of vehicles) {
    if (vehicle.isDown) continue;
    const state = states[vehicle.id];
    if (!state) continue;

    const score = scoreVehicleForTarget(
      vehicle,
      state,
      target,
      config,
      neighborhoods
    );

    if (score === -Infinity) continue;

    if (!best || score > best.score) {
      best = { vehicle, score };
    }
  }

  return best;
}
