import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { normalizeDate } from "../utils/date";

export const callNextPatient = async (departmentId: string, date: string) => {
  const normalizedDate = normalizeDate(date);
  const dayStart = startOfDay(normalizedDate);
  const dayEnd = endOfDay(normalizedDate);

  return prisma.$transaction(async (tx) => {

    // 1️⃣ Find current ACTIVE queue (if any)
    const activeQueue = await tx.queue.findFirst({
  where: {
    departmentId,
    date: {
      gte: dayStart,
      lte: dayEnd,
    },
    status: "ACTIVE",
  },
});

    // 2️⃣ If exists → mark as DONE
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

    // 3️⃣ Find next WAITING queue
    const nextQueue = await tx.queue.findFirst({
      where: {
        status: "WAITING",
        appointment: {
          departmentId,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    if (!nextQueue) {
      return { message: "No patients waiting" };
    }

    // 4️⃣ Mark next as ACTIVE
    const activatedQueue = await tx.queue.update({
      where: { id: nextQueue.id },
      data: { status: "ACTIVE" },
    });

    await tx.appointment.update({
      where: { id: nextQueue.appointmentId },
      data: { status: "ACTIVE" },
    });

    return activatedQueue;
  });
};


// For ADMIN: See all appointments and their queue positions for today
export const getQueueByDate = async (departmentId: string, date: string) => {
  const normalizedDate = normalizeDate(date);

  return prisma.queue.findMany({
    where: {
      departmentId,
      date: {
        gte: startOfDay(normalizedDate),
        lte: endOfDay(normalizedDate),
      },
    },
    include: {
      appointment: {
        include: {
          patient: {
            select: { name: true, email: true },
          },
        },
      },
    },
    orderBy: { position: "asc" },
  });
};


// For PATIENT: See their own active/waiting appointment for today
export const getMyQueueStatus = async (userId: string, date: string) => {
  const normalizedDate = normalizeDate(date);

  return await prisma.queue.findFirst({
    where: {
      appointment: {
        patientId: userId,
        date: {
          gte: startOfDay(normalizedDate),
          lte: endOfDay(normalizedDate),
        },
      },
      // We only care about appointments that aren't finished or cancelled
      status: { in: ['WAITING', 'ACTIVE'] }
    },
    include: {
      appointment: {
        include: {
          department: true
        }
      }
    }
  });
};