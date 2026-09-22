import { haversine } from './haversine';

/**
 * Returns true if two points are within the given adjacency threshold (km).
 */
export function isAdjacent(
  a: [number, number],
  b: [number, number],
  adjacencyKm: number
): boolean {
  return haversine(a, b) <= adjacencyKm;
}
