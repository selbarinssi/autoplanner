import { haversine } from '../geo/haversine';

export interface GroupWithCentroid<T> {
  items: T[];
  centroid: [number, number];
}

/**
 * Orders groups by nearest-neighbor starting from `origin`.
 * Returns the groups in visit order.
 */
export function nearestNeighborOnCentroids<T>(
  groups: GroupWithCentroid<T>[],
  origin: [number, number]
): GroupWithCentroid<T>[] {
  if (groups.length <= 1) return [...groups];

  const unvisited = [...groups];
  const ordered: GroupWithCentroid<T>[] = [];
  let current = origin;

  while (unvisited.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversine(current, unvisited[i].centroid);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const chosen = unvisited.splice(bestIdx, 1)[0];
    ordered.push(chosen);
    current = chosen.centroid;
  }

  return ordered;
}
