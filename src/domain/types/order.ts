export type OrderStatus = 'confirmed' | 'unreachable' | 'postponed' | 'cancelled';

export type OrderType = 'TRS' | 'HD' | 'DA';

export interface Order {
  id: string;
  city: string;
  neighborhood: string;          // was "area"
  volume: number;
  value: number;
  services: string[];
  hasAssembly: boolean;
  timeSlot: string;
  custName: string;
  custPhone: string;
  status: OrderStatus;
  assignedTo: string | null;     // vehicle id
  isOverflow?: boolean;
}
