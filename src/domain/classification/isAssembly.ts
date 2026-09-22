import type { Order } from '../types';

/**
 * Returns true if the order requires assembly.
 * Keywords come from config.
 */
export function isAssembly(order: Order, assemblyKeywords: string[]): boolean {
  return order.services.some((s) =>
    assemblyKeywords.some((kw) => s.toLowerCase().includes(kw.toLowerCase()))
  );
}
