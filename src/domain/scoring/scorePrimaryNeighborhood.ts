/**
 * Highest affinity when the vehicle's primary neighborhood matches the target.
 */
export function scorePrimaryNeighborhood(
  vehiclePrimaryNeighborhood: string,
  targetNeighborhood: string,
  weight: number
): number {
  if (!vehiclePrimaryNeighborhood) return 0;
  return vehiclePrimaryNeighborhood === targetNeighborhood ? weight : 0;
}
