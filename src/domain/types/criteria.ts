export type CriterionKey =
  | 'trs_priority'
  | 'primary_neighborhood'
  | 'adjacent_neighborhood'
  | 'same_city'
  | 'volume_packing'
  | 'productivity_packing'
  | 'geographic_continuity'
  | 'express_preference'
  | 'cluster_size'
  | 'time_slot_conflict'
  | 'overflow';

export interface CriterionConfig {
  key: CriterionKey;
  enabled: boolean;
  weight: number;
  // extra parameters per criterion
  params?: Record<string, number | string | boolean>;
}

export interface DispatchConfig {
  maxPoints: number;             // default 20
  deliveryPointCost: number;     // default 1
  assemblyPointCost: number;     // default 2.5
  adjacencyKm: number;           // default 5
  dedicatedVolumeThreshold: number; // % of capacity to force dedicated vehicle (e.g. 0.6)
  criteria: CriterionConfig[];   // ordered by priority (index 0 = highest)
}
