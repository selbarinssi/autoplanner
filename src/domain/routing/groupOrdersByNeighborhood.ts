import type { Order } from '../types';
import { coordsForNeighborhood } from '../geo/coordsForNeighborhood';
import type { Neighborhood } from '../types';
import type { GroupWithCentroid } from './nearestNeighborOnCentroids';

/**
 * Groups orders by neighborhood and computes each group's centroid.
 */
export function groupOrdersByNeighborhood(
  orders: Order[],
  neighborhoods: Neighborhood[]
): GroupWithCentroid<Order>[] {
  const map = new Map<string, Order[]>();

  for (const order of orders) {
    const key = `${order.city}||${order.neighborhood}`;
    const list = map.get(key) ?? [];
    list.push(order);
    map.set(key, list);
  }

  const groups: GroupWithCentroid<Order>[] = [];

  for (const [, items] of map) {
    const first = items[0];
    const centroid = coordsForNeighborhood(
      first.neighborhood,
      neighborhoods
    );
    groups.push({ items, centroid });
  }

  return groups;
}
