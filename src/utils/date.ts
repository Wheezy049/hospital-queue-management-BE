import { startOfDay } from "date-fns";

/**
 * Input:
 *  date = "2026-01-01"
 *  time = "07:30"
 * Output:
 *  2026-01-01T07:30:00.000Z
 */
export const normalizeScheduledAt = (date: string, time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const d = startOfDay(new Date(date));
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
};
