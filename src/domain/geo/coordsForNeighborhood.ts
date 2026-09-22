import type { Neighborhood } from '../types';

/**
 * Returns [lat, lng] for a neighborhood.
 * Falls back to [0, 0] if not found (should never happen with clean data).
 */
export function coordsForNeighborhood(
  neighborhoodId: string,
  neighborhoods: Neighborhood[]
): [number, number] {
  const n = neighborhoods.find((x) => x.id === neighborhoodId);
  if (!n) return [0, 0];
  return [n.lat, n.lng];
}
