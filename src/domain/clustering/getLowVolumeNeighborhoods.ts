import type { NeighborhoodVolume } from './sortNeighborhoodsByVolume';

/**
 * Returns neighborhoods that did NOT qualify for a dedicated vehicle.
 */
export function getLowVolumeNeighborhoods(
  all: NeighborhoodVolume[],
  dedicated: NeighborhoodVolume[]
): NeighborhoodVolume[] {
  const dedicatedIds = new Set(
    dedicated.map((d) => `${d.city}||${d.neighborhoodId}`)
  );

  return all.filter(
    (n) => !dedicatedIds.has(`${n.city}||${n.neighborhoodId}`)
  );
}
