import { startOfDay, endOfDay } from "date-fns";
import { AssignmentReason, AssignmentStrategy } from "@prisma/client";

export const assignDoctor = async (
  tx: any,
  {
    patientId,
    departmentId,
    date,
    preferredDoctorId,
  }: {
    patientId: string;
    departmentId: string;
    date: Date;
    preferredDoctorId?: string;
  }
): Promise<{ doctorId: string; reason: AssignmentReason; isTemporary: boolean }> => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Fetch Department configuration
  const department = await tx.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  // Helper function to check if a doctor is available on a specific day
  const isDoctorAvailable = async (docId: string): Promise<boolean> => {
    // Check doctor status & availability fields
    const doctor = await tx.user.findFirst({
      where: {
        id: docId,
        role: "ADMIN",
        isAvailable: true,
        status: "ACTIVE", // Must be active (not on leave/off-duty)
      },
    });

    if (!doctor) return false;

    // Check if doctor has an unbooked slot on this date
    const hasSlot = await tx.doctorAvailability.findFirst({
      where: {
        doctorId: docId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        isBooked: false,
      },
    });

    if (!hasSlot) return false;

    // Check doctor's capacity limit (maxDailyPatients)
    const appointmentCount = await tx.appointment.count({
      where: {
        doctorId: docId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
    });

    if (appointmentCount >= doctor.maxDailyPatients) {
      return false;
    }

    return true;
  };

  // Helper function to perform auto-assignment logic
  const performAutoAssignment = async (): Promise<string> => {
    // Find all doctors in the department
    const doctors = await tx.user.findMany({
      where: {
        departmentId,
        role: "ADMIN",
        isAvailable: true,
        status: "ACTIVE",
      },
    });

    const candidates = [];

    for (const doc of doctors) {
      // Check if they have an unbooked slot today
      const hasSlot = await tx.doctorAvailability.findFirst({
        where: {
          doctorId: doc.id,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          isBooked: false,
        },
      });

      if (!hasSlot) continue;

      // Check capacity
      const appointmentCount = await tx.appointment.count({
        where: {
          doctorId: doc.id,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          status: { not: "CANCELLED" },
        },
      });

      if (appointmentCount >= doc.maxDailyPatients) continue;

      // Get queue size
      const queueCount = await tx.queue.count({
        where: {
          doctorId: doc.id,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          status: "WAITING",
        },
      });

      candidates.push({
        id: doc.id,
        workload: appointmentCount,
        queueLength: queueCount,
      });
    }

    if (candidates.length === 0) {
      throw new Error("No doctors available in this department for the selected date.");
    }

    // Rank candidates: lowest queue length first, then lowest workload
    candidates.sort((a, b) => {
      if (a.queueLength !== b.queueLength) {
        return a.queueLength - b.queueLength;
      }
      return a.workload - b.workload;
    });

    return candidates[0].id;
  };

  // Check if the patient has a Primary Doctor relationship in this department
  const primaryDocRel = await tx.patientDoctor.findUnique({
    where: {
      patientId_departmentId: {
        patientId,
        departmentId,
      },
    },
  });

  if (primaryDocRel && primaryDocRel.isPrimary) {
    const primaryDocId = primaryDocRel.doctorId;

    // Verify availability
    const available = await isDoctorAvailable(primaryDocId);

    if (available) {
      return {
        doctorId: primaryDocId,
        reason: AssignmentReason.PRIMARY_DOCTOR,
        isTemporary: false,
      };
    } else {
      // Primary doctor is not available. Find a temporary replacement.
      const replacementId = await performAutoAssignment();
      return {
        doctorId: replacementId,
        reason: AssignmentReason.TEMPORARY_REPLACEMENT,
        isTemporary: true,
      };
    }
  }

  // First-time visit: select based on department strategy
  if (department.assignmentStrategy === AssignmentStrategy.PATIENT_SELECTED) {
    if (!preferredDoctorId) {
      throw new Error("A doctor selection is required for this department.");
    }

    const available = await isDoctorAvailable(preferredDoctorId);
    if (!available) {
      throw new Error("Selected doctor is not available at the chosen date/time.");
    }

    // Save as primary doctor for this department
    await tx.patientDoctor.create({
      data: {
        patientId,
        departmentId,
        doctorId: preferredDoctorId,
        isPrimary: true,
      },
    });

    return {
      doctorId: preferredDoctorId,
      reason: AssignmentReason.PATIENT_SELECTED,
      isTemporary: false,
    };
  } else {
    // Default is AUTO_ASSIGN
    const assignedDoctorId = await performAutoAssignment();

    // Save as primary doctor for this department
    await tx.patientDoctor.create({
      data: {
        patientId,
        departmentId,
        doctorId: assignedDoctorId,
        isPrimary: true,
      },
    });

    return {
      doctorId: assignedDoctorId,
      reason: AssignmentReason.AUTO_ASSIGNED,
      isTemporary: false,
    };
  }
};