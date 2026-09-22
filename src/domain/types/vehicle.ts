export type VehicleType = 'VAN' | 'EXPRESS' | 'TRUCK';

export interface Vehicle {
  id: string;
  type: VehicleType;
  capacity: number;              // m³
  city: string;
  primaryNeighborhood: string;   // was "primaryArea"
  startLat: number | null;
  startLng: number | null;
  satellites: string[];          // ids of satellite vehicles (same city)
  isDown: boolean;
}
