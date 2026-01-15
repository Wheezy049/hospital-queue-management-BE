import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export const callNextPatient = async (
  departmentId: string,
  date?: string
) => {
  const targetDate = date
    ? startOfDay(parseISO(date))
    : startOfDay(new Date());

  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  return prisma.$transaction(async (tx) => {

    const activeQueue = await tx.queue.findFirst({
      where: {
        departmentId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: "ACTIVE",
      },
    });

    if (activeQueue) {
      await tx.queue.update({
        where: { id: activeQueue.id },
        data: { status: "DONE" },
      });

      await tx.appointment.update({
        where: { id: activeQueue.appointmentId },
        data: { status: "DONE" },
      });
    }

    const nextQueue = await tx.queue.findFirst({
      where: {
        departmentId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: "WAITING",
      },
      orderBy: { position: "asc" },
    });

    if (!nextQueue) {
      return { message: "No patients waiting" };
    }

    const activatedQueue = await tx.queue.update({
      where: { id: nextQueue.id },
      data: { status: "ACTIVE" },
    });

    await tx.appointment.update({
      where: { id: activatedQueue.appointmentId },
      data: { status: "ACTIVE" },
    });

    return activatedQueue;
  });
};



// For ADMIN: See all appointments and their queue positions for today
export const getQueueByDate = async (
  departmentId: string,
  date?: string
) => {
  const targetDate = date
    ? startOfDay(new Date(date))
    : startOfDay(new Date());

  return prisma.queue.findMany({
    where: {
      departmentId,
      scheduledAt: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
    orderBy: { position: "asc" },
    include: {
      appointment: {
        include: {
          patient: { select: { name: true, email: true } },
        },
      },
    },
  });
};

// For PATIENT: See their own active/waiting appointment for today
export const getMyQueueStatus = async (
  userId: string,
  date?: string
) => {
  const targetDate = date
    ? startOfDay(new Date(date))
    : startOfDay(new Date());

  return prisma.queue.findFirst({
    where: {
      appointment: { patientId: userId },
      scheduledAt: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
      status: { in: ["WAITING", "ACTIVE"] },
    },
    include: {
      appointment: { include: { department: true } },
    },
  });
};

// For ADMIN: Move a queue up or down
export const moveQueue = async (
  queueId: string,
  direction: "UP" | "DOWN"
) => {
  return prisma.$transaction(async (tx) => {
    const current = await tx.queue.findUnique({ where: { id: queueId } });
    if (!current) throw new Error("Queue not found");

    // Cannot move DONE queues
    if (current.status === "DONE") {
      throw new Error("Cannot move completed queue");
    }

    const dayStart = startOfDay(current.scheduledAt);
    const dayEnd = endOfDay(current.scheduledAt);

    const targetPosition =
      direction === "UP" ? current.position - 1 : current.position + 1;

    if (targetPosition < 1) return current;

    const other = await tx.queue.findFirst({
      where: {
        departmentId: current.departmentId,
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        position: targetPosition,
        status: { in: ["WAITING", "ACTIVE"] },
      },
    });

    if (!other) return current;

    await tx.queue.update({
      where: { id: other.id },
      data: { position: current.position },
    });

    return tx.queue.update({
      where: { id: current.id },
      data: { position: targetPosition },
    });
  });
};

