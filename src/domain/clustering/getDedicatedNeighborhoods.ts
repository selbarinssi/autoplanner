import type { NeighborhoodVolume } from './sortNeighborhoodsByVolume';

/**
 * Returns neighborhoods whose volume is high enough to deserve a dedicated vehicle.
 * thresholdRatio is a fraction of vehicle capacity (e.g. 0.6 = 60%).
 */
export function getDedicatedNeighborhoods(
  neighborhoods: NeighborhoodVolume[],
  vehicleCapacity: number,
  thresholdRatio: number
): NeighborhoodVolume[] {
  const threshold = vehicleCapacity * thresholdRatio;
  return neighborhoods.filter((n) => n.volume >= threshold);
}
