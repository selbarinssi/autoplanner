import type { Order } from '../types';

/**
 * Calculates productivity points for a list of orders.
 * deliveryPointCost and assemblyPointCost come from config.
 */
export function calculatePoints(
  orders: Order[],
  deliveryPointCost: number,
  assemblyPointCost: number
): number {
  return orders.reduce((sum, o) => {
    return sum + (o.hasAssembly ? assemblyPointCost : deliveryPointCost);
  }, 0);
}
