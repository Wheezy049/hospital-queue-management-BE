import { prisma } from "../lib/prisma";
import { getNextPosition, resyncQueuePositions } from "./queue.service";
import { assignDoctor } from "./assignment.service";

export const createAppointment = async ({ 
  patientId, 
  doctorAvailabilityId, 
  preferredDoctorId,
  description, 
  lastDayOfAppointment 
}: {
  patientId: string;
  doctorAvailabilityId: string;
  preferredDoctorId?: string;
  description?: string;
  lastDayOfAppointment?: string;
}) => {
  return await prisma.$transaction(async (tx) => {
    // Fetch selected availability slot
    const selectedSlot = await tx.doctorAvailability.findUnique({
      where: { id: doctorAvailabilityId },
      include: {
        doctor: {
          select: {
            id: true,
            departmentId: true,
          },
        },
      },
    });

    if (!selectedSlot) {
      throw new Error("Availability slot not found");
    }

    if (selectedSlot.isBooked) {
      throw new Error("This slot is already booked");
    }

    const departmentId = selectedSlot.doctor.departmentId;
    if (!departmentId) {
      throw new Error("Doctor is not assigned to any department");
    }

    const appointmentTime = selectedSlot.scheduledAt;

    // Run Doctor Assignment workflow
    const assignment = await assignDoctor(tx, {
      patientId,
      departmentId,
      date: appointmentTime,
      preferredDoctorId: preferredDoctorId || selectedSlot.doctorId,
    });

    // Resolve which slot to actually book
    let slotToBook = selectedSlot;

    if (assignment.doctorId !== selectedSlot.doctorId) {
      // Find if the resolved doctor has a slot at this exact time
      const resolvedSlot = await tx.doctorAvailability.findFirst({
        where: {
          doctorId: assignment.doctorId,
          scheduledAt: appointmentTime,
          isBooked: false,
        },
        include: {
          doctor: { select: { id: true, departmentId: true } }
        }
      });

      if (resolvedSlot) {
        slotToBook = resolvedSlot;
      } else {
        // If the resolved primary doctor doesn't have a slot at this time,
        // we fallback to the selected slot's doctor as a TEMPORARY_REPLACEMENT
        assignment.doctorId = selectedSlot.doctorId;
        assignment.reason = "TEMPORARY_REPLACEMENT";
        assignment.isTemporary = true;
      }
    }

    // Mark slot as booked
    await tx.doctorAvailability.update({
      where: { id: slotToBook.id },
      data: { isBooked: true },
    });

    // Parse lastDayOfAppointment if provided
    const lastDay = lastDayOfAppointment ? new Date(lastDayOfAppointment) : null;

    // Create Appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        doctorId: assignment.doctorId,
        departmentId,
        scheduledAt: appointmentTime,
        duration: slotToBook.duration,
        description,
        doctorAvailabilityId: slotToBook.id,
        lastDayOfAppointment: lastDay,
        status: "WAITING",
        assignmentReason: assignment.reason,
        isTemporaryAssignment: assignment.isTemporary,
      },
    });

    //  Get queue position per doctor
    const position = await getNextPosition(tx, assignment.doctorId, appointmentTime);

    // Create Queue entry
    const queue = await tx.queue.create({
      data: {
        appointmentId: appointment.id,
        doctorId: assignment.doctorId,
        departmentId,
        scheduledAt: appointmentTime,
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

    await resyncQueuePositions(tx, appointment.doctorId || "", appointment.scheduledAt);

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

    // Free the availability slot if it exists!
    if (appointment.doctorAvailabilityId) {
      await tx.doctorAvailability.update({
        where: { id: appointment.doctorAvailabilityId },
        data: { isBooked: false },
      });
    }

    await resyncQueuePositions(tx, appointment.doctorId || "", appointment.scheduledAt);

    return updatedAppt;
  });
};

export const getAppointments = async (userId: string, role: string, departmentId?: string) => {
  let where: any = {};

  if (role === "SUPER_ADMIN") {
    // see everything
  } else if (role === "ADMIN") {
    // Doctors only see appointments assigned directly to them
    where.doctorId = userId;
  } else if (role === "PATIENT") {
    where.patientId = userId;
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
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