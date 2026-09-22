import type { Neighborhood } from '@/domain/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export function getNeighborhoods(): Neighborhood[] {
  return loadFromStorage<Neighborhood[]>(STORAGE_KEYS.neighborhoods, []);
}

export function saveNeighborhoods(list: Neighborhood[]): void {
  saveToStorage(STORAGE_KEYS.neighborhoods, list);
}

export function upsertNeighborhood(neighborhood: Neighborhood): Neighborhood[] {
  const list = getNeighborhoods();
  const idx = list.findIndex((n) => n.id === neighborhood.id);
  if (idx >= 0) {
    list[idx] = neighborhood;
  } else {
    list.push(neighborhood);
  }
  saveNeighborhoods(list);
  return list;
}

export function deleteNeighborhood(id: string): Neighborhood[] {
  const list = getNeighborhoods().filter((n) => n.id !== id);
  saveNeighborhoods(list);
  return list;
}
