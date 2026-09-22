import type { Cluster } from '@/domain/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export function getClusters(): Cluster[] {
  return loadFromStorage<Cluster[]>(STORAGE_KEYS.clusters, []);
}

export function saveClusters(list: Cluster[]): void {
  saveToStorage(STORAGE_KEYS.clusters, list);
}

export function upsertCluster(cluster: Cluster): Cluster[] {
  const list = getClusters();
  const idx = list.findIndex((c) => c.id === cluster.id);
  if (idx >= 0) {
    list[idx] = cluster;
  } else {
    list.push(cluster);
  }
  saveClusters(list);
  return list;
}

export function deleteCluster(id: string): Cluster[] {
  const list = getClusters().filter((c) => c.id !== id);
  saveClusters(list);
  return list;
}
