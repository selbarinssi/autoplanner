import type { CriterionConfig } from '../types';

/**
 * Sums individual criterion scores according to the ordered criteria list.
 * Criteria that returned -Infinity cause the whole score to be -Infinity (hard reject).
 */
export function computeTotalScore(
  criterionScores: Record<string, number>,
  criteria: CriterionConfig[]
): number {
  let total = 0;

  for (const criterion of criteria) {
    if (!criterion.enabled) continue;

    const score = criterionScores[criterion.key] ?? 0;

    if (score === -Infinity) return -Infinity;

    total += score;
  }

  return total;
}
