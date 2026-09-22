import type {
  Order,
  Vehicle,
  Neighborhood,
  Cluster,
  DispatchConfig,
} from '../types';
import { sortNeighborhoodsByVolume } from '../clustering/sortNeighborhoodsByVolume';
import { getDedicatedNeighborhoods } from '../clustering/getDedicatedNeighborhoods';
import { getLowVolumeNeighborhoods } from '../clustering/getLowVolumeNeighborhoods';
import { buildClusterCandidates } from '../clustering/buildClusterCandidates';
import { absorbIntoClusters } from '../clustering/absorbIntoClusters';
import { createVehicleState } from './createVehicleState';
import { findBestVehicle } from './findBestVehicle';
import { assignTargetToVehicle } from './assignTargetToVehicle';
import { calculatePoints } from '../productivity/calculatePoints';
import { coordsForNeighborhood } from '../geo/coordsForNeighborhood';
import { isTRS } from '../classification/isTRS';
import type { Target } from './scoreVehicleForTarget';

export interface AssignmentResult {
  orders: Order[];                       // with assignedTo filled
  vehicleStates: ReturnType<typeof createVehicleState>;
  unassignedNeighborhoodIds: string[];
}

/**
 * Main auto-dispatch entry point.
 *
 * Logic:
 * 1. Sort neighborhoods by volume
 * 2. High-volume ones → try to give them a dedicated vehicle
 * 3. Low-volume ones → try to absorb into pre-defined clusters
 * 4. Anything left stays unassigned
 */
export function autoAssign(
  orders: Order[],
  vehicles: Vehicle[],
  neighborhoods: Neighborhood[],
  clusters: Cluster[],
  config: DispatchConfig,
  trsServiceNames: string[]
): AssignmentResult {
  // Work on a shallow copy so we don't mutate the original array references
  const workingOrders = orders.map((o) => ({ ...o, assignedTo: null as string | null }));

  const activeVehicles = vehicles.filter((v) => !v.isDown);
  const states = createVehicleState(activeVehicles);

  // Average capacity used for the dedicated threshold calculation
  const avgCapacity =
    activeVehicles.reduce((s, v) => s + v.capacity, 0) /
    Math.max(activeVehicles.length, 1);

  // ── 1. Volume ranking ───────────────────────────────────────────
  const ranked = sortNeighborhoodsByVolume(workingOrders);

  // ── 2. Dedicated high-volume neighborhoods ──────────────────────
  const dedicated = getDedicatedNeighborhoods(
    ranked,
    avgCapacity,
    config.dedicatedVolumeThreshold
  );

  const unassignedAfterDedicated: string[] = [];

  for (const n of dedicated) {
    const ordersInN = workingOrders.filter((o) =>
      n.orderIds.includes(o.id)
    );
    const points = calculatePoints(
      ordersInN,
      config.deliveryPointCost,
      config.assemblyPointCost
    );
    const centroid = coordsForNeighborhood(n.neighborhoodId, neighborhoods);

    const target: Target = {
      city: n.city,
      neighborhoodId: n.neighborhoodId,
      volume: n.volume,
      points,
      isTrs: ordersInN.some((o) => isTRS(o, trsServiceNames)),
      isParcel: ordersInN.every((o) =>
        o.services.some((s) => s.toLowerCase().includes('parcel'))
      ),
      centroid,
    };

    const best = findBestVehicle(
      activeVehicles,
      states,
      target,
      config,
      neighborhoods
    );

    if (best) {
      assignTargetToVehicle(states[best.vehicle.id], target, n.orderIds);
      for (const o of ordersInN) {
        o.assignedTo = best.vehicle.id;
      }
    } else {
      unassignedAfterDedicated.push(n.neighborhoodId);
    }
  }

  // ── 3. Low-volume → clusters ────────────────────────────────────
  const lowVolume = getLowVolumeNeighborhoods(ranked, dedicated);

  // Remaining capacity per city
  const remainingCapacityByCity: Record<string, number> = {};
  for (const v of activeVehicles) {
    const used = states[v.id]?.currentVolume ?? 0;
    remainingCapacityByCity[v.city] =
      (remainingCapacityByCity[v.city] ?? 0) + (v.capacity - used);
  }

  const candidates = buildClusterCandidates(
    lowVolume,
    clusters,
    neighborhoods
  );

  const { absorbed, stillUnassigned } = absorbIntoClusters(
    candidates,
    remainingCapacityByCity
  );

  // Assign the absorbed neighborhoods
  for (const n of absorbed) {
    const ordersInN = workingOrders.filter((o) =>
      n.orderIds.includes(o.id)
    );
    const points = calculatePoints(
      ordersInN,
      config.deliveryPointCost,
      config.assemblyPointCost
    );
    const centroid = coordsForNeighborhood(n.neighborhoodId, neighborhoods);

    const target: Target = {
      city: n.city,
      neighborhoodId: n.neighborhoodId,
      volume: n.volume,
      points,
      isTrs: ordersInN.some((o) => isTRS(o, trsServiceNames)),
      isParcel: ordersInN.every((o) =>
        o.services.some((s) => s.toLowerCase().includes('parcel'))
      ),
      centroid,
    };

    const best = findBestVehicle(
      activeVehicles,
      states,
      target,
      config,
      neighborhoods
    );

    if (best) {
      assignTargetToVehicle(states[best.vehicle.id], target, n.orderIds);
      for (const o of ordersInN) {
        o.assignedTo = best.vehicle.id;
      }
    } else {
      stillUnassigned.push(n);
    }
  }

  const unassignedNeighborhoodIds = [
    ...unassignedAfterDedicated,
    ...stillUnassigned.map((n) => n.neighborhoodId),
  ];

  return {
    orders: workingOrders,
    vehicleStates: states,
    unassignedNeighborhoodIds,
  };
}
