import { prisma } from "../lib/prisma";
import { getNextPosition } from "./queque.service";
import { startOfDay } from "date-fns";

export const createAppointment = async ({ departmentId, date, patientId, time }: {
  departmentId: string;
  patientId: string;
  date: Date;
  time: string;
}) => {
  const appointmentDate = new Date(`${date}T00:00:00.000Z`);

  return await prisma.$transaction(async (tx) => {
    // 1. Create Appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        departmentId,
        date: appointmentDate,
        time,
        status: "WAITING",
      },
    });

    // 2. Get position (Passing 'tx' to maintain the transaction link)
    const position = await getNextPosition(tx, departmentId, appointmentDate);

    // 3. Create Queue entry
    const queue = await tx.queue.create({
      data: {
        appointmentId: appointment.id,
        departmentId,
        date: appointmentDate,
        position,
        status: "WAITING",
      },
    });

    // Return both so the controller can send them to the user
    return { appointment, queue };
  });
};

// ADMIN: Mark an appointment as DONE
export const completeAppointment = async (appointmentId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Update Appointment Status
    const appointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "DONE" },
    });

    // 2. Update Queue Status
    await tx.queue.update({
      where: { appointmentId },
      data: { status: "DONE" },
    });

    return appointment;
  });
};

// PATIENT or ADMIN: Cancel an appointment
export const cancelAppointment = async (appointmentId: string, userId: string, role: string) => {
  // Check if the appointment belongs to the patient (Security Check)
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) throw new Error("Appointment not found");

  // Only the owner or an Admin can cancel
  if (role !== "ADMIN" && appointment.patientId !== userId) {
    throw new Error("Unauthorized to cancel this appointment");
  }

  return await prisma.$transaction(async (tx) => {
    const updatedAppt = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    // We use updateMany because a queue record might not exist if it was just WAITING
    await tx.queue.updateMany({
      where: { appointmentId },
      data: { status: "DONE" },
    });

    return updatedAppt;
  });
};