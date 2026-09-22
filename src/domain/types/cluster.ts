export interface Cluster {
  id: string;
  name: string;
  city: string;
  neighborhoodIds: string[];     // ordered list of neighborhoods in this cluster
}
