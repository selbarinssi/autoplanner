/**
 * Converts a free-text time slot into a bucket: 'AM' | 'PM' | 'ANY'
 * amPmCutoffHour comes from config (default 13).
 */
export function getSlotBucket(
  timeSlot: string,
  amPmCutoffHour: number = 13
): 'AM' | 'PM' | 'ANY' {
  if (!timeSlot || !timeSlot.trim()) return 'ANY';

  const s = timeSlot.toLowerCase().trim();

  // Try to extract hour (e.g. "14h30", "9:00", "14")
  const match = s.match(/(\d{1,2})[h:]/);
  if (match) {
    const hour = parseInt(match[1], 10);
    return hour < amPmCutoffHour ? 'AM' : 'PM';
  }

  if (
    s.includes('matin') ||
    s.includes('morning') ||
    s.includes('am')
  ) {
    return 'AM';
  }

  if (
    s.includes('après') ||
    s.includes('apres') ||
    s.includes('after') ||
    s.includes('pm') ||
    s.includes('soir') ||
    s.includes('evening')
  ) {
    return 'PM';
  }

  return 'ANY';
}
