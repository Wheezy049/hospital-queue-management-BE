import { startOfDay, endOfDay } from "date-fns";

export const getNextPosition = async (
  tx: any,
  departmentId: string,
  date: Date
) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const lastQueueEntry = await tx.queue.findFirst({
    where: {
      departmentId,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: { in: ["WAITING", "ACTIVE"] },
    },
    orderBy: {
      position: "desc",
    },
  });

  return lastQueueEntry ? lastQueueEntry.position + 1 : 1;
};
