import type { VehicleState } from './createVehicleState';
import type { Target } from './scoreVehicleForTarget';

/**
 * Mutates the vehicle state to record the assignment.
 * Returns the list of order IDs that were assigned (caller already knows them).
 */
export function assignTargetToVehicle(
  state: VehicleState,
  target: Target,
  orderIds: string[]
): void {
  state.currentVolume += target.volume;
  state.currentPoints += target.points;
  state.lastCentroid = target.centroid;
  state.assignedOrderIds.push(...orderIds);
}
