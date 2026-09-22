import type { Order } from '../types';

export interface NeighborhoodVolume {
  neighborhoodId: string;
  city: string;
  volume: number;
  orderIds: string[];
}

/**
 * Groups orders by neighborhood and returns them sorted by volume descending.
 */
export function sortNeighborhoodsByVolume(
  orders: Order[]
): NeighborhoodVolume[] {
  const map = new Map<string, NeighborhoodVolume>();

  for (const order of orders) {
    const key = `${order.city}||${order.neighborhood}`;
    const existing = map.get(key);

    if (existing) {
      existing.volume += order.volume;
      existing.orderIds.push(order.id);
    } else {
      map.set(key, {
        neighborhoodId: order.neighborhood,
        city: order.city,
        volume: order.volume,
        orderIds: [order.id],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.volume - a.volume);
}
