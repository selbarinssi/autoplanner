import type { Order, Neighborhood } from '../types';
import { groupOrdersByNeighborhood } from './groupOrdersByNeighborhood';
import { nearestNeighborOnCentroids } from './nearestNeighborOnCentroids';
import { sortByTimeSlot } from './sortByTimeSlot';

/**
 * Builds an optimized stop sequence for one vehicle:
 * 1. Group orders by neighborhood
 * 2. Order the groups by nearest-neighbor from vehicle origin
 * 3. Inside each group, sort by time slot
 */
export function optimizeOrderSequence(
  orders: Order[],
  origin: [number, number],
  neighborhoods: Neighborhood[],
  amPmCutoffHour: number = 13
): Order[] {
  if (orders.length <= 1) return [...orders];

  const groups = groupOrdersByNeighborhood(orders, neighborhoods);
  const orderedGroups = nearestNeighborOnCentroids(groups, origin);

  const result: Order[] = [];
  for (const group of orderedGroups) {
    result.push(...sortByTimeSlot(group.items, amPmCutoffHour));
  }

  return result;
}
