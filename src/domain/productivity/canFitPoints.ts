/**
 * Returns true if adding `additionalPoints` would not exceed maxPoints.
 */
export function canFitPoints(
  currentPoints: number,
  additionalPoints: number,
  maxPoints: number
): boolean {
  return currentPoints + additionalPoints <= maxPoints;
}
