import type { Order } from '../types';
import { getSlotBucket } from '../classification/getSlotBucket';

/**
 * Sorts orders by time-slot priority (AM first, then PM, then ANY).
 * amPmCutoffHour comes from config.
 */
export function sortByTimeSlot(
  orders: Order[],
  amPmCutoffHour: number = 13
): Order[] {
  const priority = (slot: string) => {
    const bucket = getSlotBucket(slot, amPmCutoffHour);
    if (bucket === 'AM') return 0;
    if (bucket === 'PM') return 1;
    return 2;
  };

  return [...orders].sort(
    (a, b) => priority(a.timeSlot) - priority(b.timeSlot)
  );
}
