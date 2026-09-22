/**
 * Small boost when a pure-parcel cluster is offered to an EXPRESS vehicle.
 */
export function scoreExpressPreference(
  isParcelCluster: boolean,
  isExpressVehicle: boolean,
  weight: number
): number {
  if (!isParcelCluster) return 0;
  return isExpressVehicle ? weight : 0;
}
