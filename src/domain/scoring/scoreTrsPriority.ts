/**
 * Gives a large boost when the order/cluster is TRS and the vehicle is a TRS-capable van.
 */
export function scoreTrsPriority(
  isTrsCluster: boolean,
  isTrsVehicle: boolean,
  weight: number
): number {
  if (!isTrsCluster) return 0;
  return isTrsVehicle ? weight : -Infinity; // TRS orders must go to TRS vehicles
}
