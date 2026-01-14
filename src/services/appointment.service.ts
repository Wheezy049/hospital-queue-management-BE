import { prisma } from "../lib/prisma";
import { getNextPosition, resyncQueuePositions } from "./queque.service";
import { normalizeScheduledAt } from "../utils/date";

export const createAppointment = async ({ departmentId, date, patientId, time }: {
  departmentId: string;
  patientId: string;
  date: string;
  time: string;
}) => {
  const scheduledAt = normalizeScheduledAt(date, time);

  return await prisma.$transaction(async (tx) => {
    // create Appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        departmentId,
        scheduledAt,
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
  // check if the appointment belongs to the patient
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) throw new Error("Appointment not found");

  // only the owner or an Admin can cancel
  if (role !== "ADMIN" && appointment.patientId !== userId) {
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