import { isAdjacent } from '../geo/isAdjacent';

/**
 * Medium affinity when the target is within adjacencyKm of the vehicle's primary neighborhood.
 */
export function scoreAdjacentNeighborhood(
  vehicleCoords: [number, number],
  targetCoords: [number, number],
  adjacencyKm: number,
  weight: number
): number {
  return isAdjacent(vehicleCoords, targetCoords, adjacencyKm) ? weight : 0;
}
