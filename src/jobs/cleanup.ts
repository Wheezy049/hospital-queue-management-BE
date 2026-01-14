import { prisma } from "../lib/prisma";
import { startOfDay } from "date-fns";

export const cleanupExpiredAppointments = async () => {
  const todayStart = startOfDay(new Date());

  await prisma.$transaction(async (tx) => {
    const expired = await tx.appointment.findMany({
      where: {
        scheduledAt: { lt: todayStart },
        status: { in: ["WAITING", "ACTIVE"] },
      },
    });

    for (const appt of expired) {
      await tx.appointment.update({
        where: { id: appt.id },
        data: { status: "CANCELLED" },
      });

      await tx.queue.updateMany({
        where: { appointmentId: appt.id },
        data: { status: "DONE" },
      });
    }
  });
};
