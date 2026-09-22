import type { DispatchConfig } from '@/domain/types';

export const defaultDispatchConfig: DispatchConfig = {
  maxPoints: 20,
  deliveryPointCost: 1,
  assemblyPointCost: 2.5,
  adjacencyKm: 5,
  dedicatedVolumeThreshold: 0.6, // 60% of capacity → dedicated vehicle

  criteria: [
    { key: 'trs_priority', enabled: true, weight: 5000 },
    { key: 'same_city', enabled: true, weight: 2000 },
    { key: 'primary_neighborhood', enabled: true, weight: 1000 },
    { key: 'adjacent_neighborhood', enabled: true, weight: 200 },
    { key: 'volume_packing', enabled: true, weight: 150 },
    { key: 'productivity_packing', enabled: true, weight: 120 },
    { key: 'geographic_continuity', enabled: true, weight: 80 },
    { key: 'express_preference', enabled: true, weight: 50 },
    { key: 'cluster_size', enabled: true, weight: 30 },
    { key: 'time_slot_conflict', enabled: true, weight: 20 },
    { key: 'overflow', enabled: true, weight: 10 },
  ],
};
