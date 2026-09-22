/**
 * Rewards packing that leaves less wasted productivity points.
 * Smaller remaining gap after adding → higher score.
 */
export function scoreProductivityTightness(
  currentPoints: number,
  additionalPoints: number,
  maxPoints: number,
  weight: number
): number {
  const after = currentPoints + additionalPoints;
  if (after > maxPoints) return -Infinity; // hard reject
  const tightness = maxPoints - after; // smaller = better packing
  // Invert so tighter packing scores higher
  return ((maxPoints - tightness) / maxPoints) * weight;
}
