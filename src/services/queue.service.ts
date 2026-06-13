import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "../lib/prisma";

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
      scheduledAt: {
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

export const resyncQueuePositions = async (
  tx: any,
  departmentId: string,
  date: Date
) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const queues = await tx.queue.findMany({
    where: {
      departmentId,
      scheduledAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: { in: ["WAITING", "ACTIVE"] },
    },
    orderBy: { position: "asc" },
  });

  for (let i = 0; i < queues.length; i++) {
    if (queues[i].position !== i + 1) {
      await tx.queue.update({
        where: { id: queues[i].id },
        data: { position: i + 1 },
      });
    }
  }
};

export const calculateEstimatedWaitTime = async (departmentId: string, position: number, date: Date) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const precedingQueues = await prisma.queue.findMany({
    where: {
      departmentId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      position: { lt: position },
      status: { in: ["WAITING", "ACTIVE"] },
    },
    include: {
      appointment: { select: { duration: true } }
    }
  });

  const totalMinutes = precedingQueues.reduce((acc: number, curr: any) => {
    return acc + (curr.appointment?.duration || 30);
  }, 0);

  return totalMinutes;
};
