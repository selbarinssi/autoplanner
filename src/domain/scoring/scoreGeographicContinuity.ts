import { haversine } from '../geo/haversine';

/**
 * Penalizes jumping far from the vehicle's last assigned centroid.
 * Lower distance → higher score.
 */
export function scoreGeographicContinuity(
  lastCentroid: [number, number],
  targetCentroid: [number, number],
  weight: number
): number {
  const distanceKm = haversine(lastCentroid, targetCentroid);
  // Soft penalty: farther = lower score
  // We invert distance so closer locations score higher
  const maxReasonableDistance = 50; // km, beyond this score approaches 0
  const normalized = Math.max(0, 1 - distanceKm / maxReasonableDistance);
  return normalized * weight;
}
