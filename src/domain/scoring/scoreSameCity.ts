/**
 * Returns weight if vehicle and target are in the same city, otherwise 0.
 * Can be used as a hard filter (very high weight) or soft preference.
 */
export function scoreSameCity(
  vehicleCity: string,
  targetCity: string,
  weight: number
): number {
  return vehicleCity.toLowerCase() === targetCity.toLowerCase() ? weight : 0;
}
