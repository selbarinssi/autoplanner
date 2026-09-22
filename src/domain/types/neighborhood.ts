export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  clusterId: string | null;      // which cluster it belongs to (null = dedicated possible)
}
