import type { Vehicle } from '@/domain/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export function getVehicles(): Vehicle[] {
  return loadFromStorage<Vehicle[]>(STORAGE_KEYS.vehicles, []);
}

export function saveVehicles(list: Vehicle[]): void {
  saveToStorage(STORAGE_KEYS.vehicles, list);
}

export function upsertVehicle(vehicle: Vehicle): Vehicle[] {
  const list = getVehicles();
  const idx = list.findIndex((v) => v.id === vehicle.id);
  if (idx >= 0) {
    list[idx] = vehicle;
  } else {
    list.push(vehicle);
  }
  saveVehicles(list);
  return list;
}

export function deleteVehicle(id: string): Vehicle[] {
  const list = getVehicles().filter((v) => v.id !== id);
  saveVehicles(list);
  return list;
}
