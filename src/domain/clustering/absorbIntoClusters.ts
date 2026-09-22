import type { ClusterCandidate } from './buildClusterCandidates';
import type { NeighborhoodVolume } from './sortNeighborhoodsByVolume';

/**
 * Decides which low-volume neighborhoods can actually be absorbed
 * into their cluster given remaining capacity of available vans.
 *
 * This is a pure decision helper — it does not mutate anything.
 * Returns the list of neighborhoods that fit + those that remain unassigned.
 */
export function absorbIntoClusters(
  candidates: ClusterCandidate[],
  remainingCapacityByCity: Record<string, number>
): {
  absorbed: NeighborhoodVolume[];
  stillUnassigned: NeighborhoodVolume[];
} {
  const absorbed: NeighborhoodVolume[] = [];
  const stillUnassigned: NeighborhoodVolume[] = [];

  // Work on a copy of remaining capacity
  const capacity = { ...remainingCapacityByCity };

  for (const candidate of candidates) {
    const available = capacity[candidate.city] ?? 0;

    if (candidate.totalVolume <= available) {
      // Whole cluster fits
      absorbed.push(...candidate.neighborhoods);
      capacity[candidate.city] = available - candidate.totalVolume;
    } else {
      // Try to fit individual neighborhoods (biggest first)
      const sorted = [...candidate.neighborhoods].sort(
        (a, b) => b.volume - a.volume
      );

      for (const n of sorted) {
        const cap = capacity[candidate.city] ?? 0;
        if (n.volume <= cap) {
          absorbed.push(n);
          capacity[candidate.city] = cap - n.volume;
        } else {
          stillUnassigned.push(n);
        }
      }
    }
  }

  return { absorbed, stillUnassigned };
}
