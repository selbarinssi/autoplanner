import type { Cluster, Neighborhood } from '../types';
import type { NeighborhoodVolume } from './sortNeighborhoodsByVolume';

export interface ClusterCandidate {
  clusterId: string;
  clusterName: string;
  city: string;
  neighborhoods: NeighborhoodVolume[];
  totalVolume: number;
}

/**
 * Groups low-volume neighborhoods into the pre-defined clusters
 * that the planner configured in the Config tab.
 * Only neighborhoods that belong to a cluster are returned.
 */
export function buildClusterCandidates(
  lowVolumeNeighborhoods: NeighborhoodVolume[],
  clusters: Cluster[],
  allNeighborhoods: Neighborhood[]
): ClusterCandidate[] {
  const result: ClusterCandidate[] = [];

  for (const cluster of clusters) {
    const members = lowVolumeNeighborhoods.filter((lv) => {
      const neighborhood = allNeighborhoods.find(
        (n) => n.id === lv.neighborhoodId && n.city === lv.city
      );
      return neighborhood?.clusterId === cluster.id;
    });

    if (members.length === 0) continue;

    result.push({
      clusterId: cluster.id,
      clusterName: cluster.name,
      city: cluster.city,
      neighborhoods: members,
      totalVolume: members.reduce((sum, m) => sum + m.volume, 0),
    });
  }

  // Sort clusters by total volume descending so bigger ones are considered first
  return result.sort((a, b) => b.totalVolume - a.totalVolume);
}
