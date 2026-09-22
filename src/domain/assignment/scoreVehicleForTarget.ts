import type { Vehicle, DispatchConfig, CriterionConfig } from '../types';
import type { VehicleState } from './createVehicleState';
import { scorePrimaryNeighborhood } from '../scoring/scorePrimaryNeighborhood';
import { scoreAdjacentNeighborhood } from '../scoring/scoreAdjacentNeighborhood';
import { scoreSameCity } from '../scoring/scoreSameCity';
import { scoreVolumeFit } from '../scoring/scoreVolumeFit';
import { scoreProductivityTightness } from '../scoring/scoreProductivityTightness';
import { scoreGeographicContinuity } from '../scoring/scoreGeographicContinuity';
import { scoreTrsPriority } from '../scoring/scoreTrsPriority';
import { scoreExpressPreference } from '../scoring/scoreExpressPreference';
import { computeTotalScore } from '../scoring/computeTotalScore';
import { coordsForNeighborhood } from '../geo/coordsForNeighborhood';
import type { Neighborhood } from '../types';

export interface Target {
  city: string;
  neighborhoodId: string;
  volume: number;
  points: number;
  isTrs: boolean;
  isParcel: boolean;
  centroid: [number, number];
}

/**
 * Scores one vehicle against one target (neighborhood or cluster).
 * Returns -Infinity if the vehicle cannot accept the target.
 */
export function scoreVehicleForTarget(
  vehicle: Vehicle,
  state: VehicleState,
  target: Target,
  config: DispatchConfig,
  neighborhoods: Neighborhood[]
): number {
  const criteria = config.criteria;
  const getWeight = (key: string) =>
    criteria.find((c) => c.key === key)?.weight ?? 0;

  const vehicleCoords =
    vehicle.primaryNeighborhood
      ? coordsForNeighborhood(vehicle.primaryNeighborhood, neighborhoods)
      : state.lastCentroid;

  const criterionScores: Record<string, number> = {
    trs_priority: scoreTrsPriority(
      target.isTrs,
      vehicle.city.toUpperCase().includes('TRS') || vehicle.id.toUpperCase().includes('TRS'),
      getWeight('trs_priority')
    ),
    primary_neighborhood: scorePrimaryNeighborhood(
      vehicle.primaryNeighborhood,
      target.neighborhoodId,
      getWeight('primary_neighborhood')
    ),
    adjacent_neighborhood: scoreAdjacentNeighborhood(
      vehicleCoords,
      target.centroid,
      config.adjacencyKm,
      getWeight('adjacent_neighborhood')
    ),
    same_city: scoreSameCity(
      vehicle.city,
      target.city,
      getWeight('same_city')
    ),
    volume_packing: scoreVolumeFit(
      state.currentVolume,
      target.volume,
      vehicle.capacity,
      getWeight('volume_packing')
    ),
    productivity_packing: scoreProductivityTightness(
      state.currentPoints,
      target.points,
      config.maxPoints,
      getWeight('productivity_packing')
    ),
    geographic_continuity: scoreGeographicContinuity(
      state.lastCentroid,
      target.centroid,
      getWeight('geographic_continuity')
    ),
    express_preference: scoreExpressPreference(
      target.isParcel,
      vehicle.type === 'EXPRESS',
      getWeight('express_preference')
    ),
  };

  return computeTotalScore(criterionScores, criteria);
}
