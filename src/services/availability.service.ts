import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { normalizeScheduledAt } from "../utils/date";

export const createSlots = async (doctorId: string, date: string, times: string[]) => {
  const slotsCreated = [];

  for (const time of times) {
    const scheduledAt = normalizeScheduledAt(date, time);

    if (scheduledAt.getTime() < Date.now()) {
      throw new Error(`Cannot create availability in the past: ${time}`);
    }

    // Check if slot already exists
    const existingSlot = await prisma.doctorAvailability.findUnique({
      where: {
        doctorId_scheduledAt: {
          doctorId,
          scheduledAt,
        },
      },
    });

    if (existingSlot) {
      continue; // Skip if already exists
    }

    const slot = await prisma.doctorAvailability.create({
      data: {
        doctorId,
        scheduledAt,
      },
    });

    slotsCreated.push(slot);
  }

  return slotsCreated;
};

export const getDoctorSlots = async (doctorId: string, date?: string) => {
  let where: any = { doctorId };

  if (date) {
    const targetDate = parseISO(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    where.scheduledAt = {
      gte: dayStart,
      lte: dayEnd,
    };
  }

  return prisma.doctorAvailability.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      appointment: {
        include: {
          patient: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
};

export const getAvailableSlots = async (filters: {
  doctorId?: string;
  departmentId?: string;
  date?: string;
}) => {
  let where: any = {
    isBooked: false,
    scheduledAt: {
      gte: new Date(),
    },
  };

  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  if (filters.departmentId) {
    where.doctor = {
      departmentId: filters.departmentId,
    };
  }

  if (filters.date) {
    const targetDate = parseISO(filters.date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    // Combine with the gte: now() condition
    where.scheduledAt = {
      gte: new Date(Math.max(Date.now(), dayStart.getTime())),
      lte: dayEnd,
    };
  }

  return prisma.doctorAvailability.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });
};

export const deleteSlot = async (doctorId: string, slotId: string, isSuperAdmin = false) => {
  const slot = await prisma.doctorAvailability.findUnique({
    where: { id: slotId },
  });

  if (!slot) {
    throw new Error("Availability slot not found");
  }

  if (!isSuperAdmin && slot.doctorId !== doctorId) {
    throw new Error("Unauthorized to delete this slot");
  }

  if (slot.isBooked) {
    throw new Error("Cannot delete a booked availability slot");
  }

  return prisma.doctorAvailability.delete({
    where: { id: slotId },
  });
};