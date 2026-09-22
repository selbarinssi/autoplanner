/**
 * Rewards vehicles that still have enough residual volume.
 * Higher residual → higher score (encourages balanced packing).
 */
export function scoreVolumeFit(
  currentVolume: number,
  additionalVolume: number,
  capacity: number,
  weight: number
): number {
  const residual = capacity - (currentVolume + additionalVolume);
  if (residual < 0) return -Infinity; // hard reject
  // Normalize residual to 0–1 range then apply weight
  return (residual / capacity) * weight;
}
