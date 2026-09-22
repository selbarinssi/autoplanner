import type { Order, OrderType } from '../types';
import { isTRS } from './isTRS';
import { isAssembly } from './isAssembly';

export function getOrderType(
  order: Order,
  trsServiceNames: string[],
  assemblyKeywords: string[]
): OrderType {
  if (isTRS(order, trsServiceNames)) return 'TRS';
  if (isAssembly(order, assemblyKeywords)) return 'DA';
  return 'HD';
}
