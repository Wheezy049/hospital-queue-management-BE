import { prisma } from "../lib/prisma";
import { getNextPosition, resyncQueuePositions } from "./queque.service";
import { normalizeScheduledAt } from "../utils/date";

export const createAppointment = async ({ departmentId, date, patientId, time, description, duration }: {
  departmentId: string;
  patientId: string;
  date: string;
  time: string;
  description?: string;
  duration?: number;
}) => {
  const scheduledAt = normalizeScheduledAt(date, time);

  return await prisma.$transaction(async (tx) => {
    // create Appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        departmentId,
        scheduledAt,
        description,
        duration: duration || 30,
        status: "WAITING",
      },
    });

    // get position (Passing 'tx' to maintain the transaction link)
    const position = await getNextPosition(tx, departmentId, scheduledAt);

    // create Queue entry
    const queue = await tx.queue.create({
      data: {
        appointmentId: appointment.id,
        departmentId,
        scheduledAt,
        position,
        status: "WAITING",
      },
    });

    return { appointment, queue };
  });
};

// ADMIN: Mark an appointment as DONE
export const completeAppointment = async (appointmentId: string) => {
  return await prisma.$transaction(async (tx) => {
    // update appointment status
    const appointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "DONE" },
    });

    // update queue status
    await tx.queue.update({
      where: { appointmentId },
      data: { status: "DONE" },
    });

    await resyncQueuePositions(tx, appointment.departmentId, appointment.scheduledAt);

    return appointment;
  });
};

// PATIENT or ADMIN: Cancel an appointment
export const cancelAppointment = async (appointmentId: string, userId: string, role: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) throw new Error("Appointment not found");

  const staffRoles = ["ADMIN", "SUPER_ADMIN"];
  const isStaff = staffRoles.includes(role);

  // only the owner or Staff can cancel
  if (!isStaff && appointment.patientId !== userId) {
    throw new Error("Unauthorized to cancel this appointment");
  }

  return await prisma.$transaction(async (tx) => {
    const updatedAppt = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    await tx.queue.update({
      where: { appointmentId },
      data: { status: "DONE" },
    });

    await resyncQueuePositions(tx, appointment.departmentId, appointment.scheduledAt);

    return updatedAppt;
  });
};

export const getAppointments = async (userId: string, role: string, departmentId?: string) => {
  let where: any = {};

  if (role === "SUPER_ADMIN") {
    // see everything
  } else if (role === "ADMIN") {
    if (!departmentId) throw new Error("Department ID required for staff");
    where.departmentId = departmentId;
  } else if (role === "PATIENT") {
    where.patientId = userId;
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { name: true, email: true } },
      department: { select: { name: true } },
      queue: true
    },
    orderBy: { scheduledAt: 'asc' }
  });
};

export const updateAppointmentNotes = async (appointmentId: string, doctorNotes: string) => {
    return prisma.appointment.update({
        where: { id: appointmentId },
        data: { doctorNotes }
    });
}