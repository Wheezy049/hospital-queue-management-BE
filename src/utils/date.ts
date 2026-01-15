/**
 * Always returns a UTC datetime
 * Input:
 *  date = "2026-01-14"
 *  time = "14:00"
 * Output:
 *  2026-01-14T14:00:00.000Z
 */
export const normalizeScheduledAt = (date: string, time: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
};
