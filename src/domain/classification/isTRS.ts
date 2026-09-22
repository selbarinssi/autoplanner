import type { Order } from '../types';

/**
 * Returns true if the order is a TRS (Click & Collect / store pickup).
 * The list of TRS service names comes from config.
 */
export function isTRS(order: Order, trsServiceNames: string[]): boolean {
  return order.services.some((s) => trsServiceNames.includes(s));
}
