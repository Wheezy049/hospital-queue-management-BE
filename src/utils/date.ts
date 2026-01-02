import { startOfDay } from "date-fns";

/**
 * Converts a YYYY-MM-DD string to UTC start of day
 */
export const normalizeDate = (date: string | Date): Date => {
  const d = typeof date === "string" ? new Date(date) : date;
  return startOfDay(d);
};
