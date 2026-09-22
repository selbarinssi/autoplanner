import type { Order } from '@/domain/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export function getOrders(): Order[] {
  return loadFromStorage<Order[]>(STORAGE_KEYS.orders, []);
}

export function saveOrders(list: Order[]): void {
  saveToStorage(STORAGE_KEYS.orders, list);
}

export function replaceOrders(list: Order[]): Order[] {
  saveOrders(list);
  return list;
}

export function upsertOrder(order: Order): Order[] {
  const list = getOrders();
  const idx = list.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    list[idx] = order;
  } else {
    list.push(order);
  }
  saveOrders(list);
  return list;
}

export function deleteOrder(id: string): Order[] {
  const list = getOrders().filter((o) => o.id !== id);
  saveOrders(list);
  return list;
}

export function clearOrders(): Order[] {
  saveOrders([]);
  return [];
}
