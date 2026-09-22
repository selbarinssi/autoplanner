/**
 * Returns true if adding `additionalVolume` would not exceed capacity.
 */
export function canFitVolume(
  currentVolume: number,
  additionalVolume: number,
  capacity: number
): boolean {
  return currentVolume + additionalVolume <= capacity;
}
