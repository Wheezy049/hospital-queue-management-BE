import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { createAppointment, cancelAppointment, completeAppointment, getAppointments, updateAppointmentNotes } from "../services/appointment.service";
import { calculateEstimatedWaitTime } from "../services/queue.service";
import { prisma } from "../lib/prisma";

// GET /appointments
export const listAppointments = async (req: any, res: Response) => {
    try {
        const { userId, role } = req.user;
        
        // For Doctors/Admins, we need to know their department
        let departmentId = undefined;
        if (role === "ADMIN") {
            const userDetails = await prisma.user.findUnique({
                where: { id: userId },
                select: { departmentId: true }
            });
            departmentId = userDetails?.departmentId || undefined;
        }

        const appointments = await getAppointments(userId, role, departmentId);
        res.json(appointments);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// PATCH /appointments/:id/notes
export const addNotes = async (req: any, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ message: "Only doctors can add notes" });
    }

    try {
        const result = await updateAppointmentNotes(id, notes);
        res.json({ message: "Notes updated", appointment: result });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}

// POST /appointments/create-appointment
export const addAppointment = async (req: Request, res: Response) => {
    try {
        const { doctorAvailabilityId, preferredDoctorId, description, lastDayOfAppointment } = req.body;

        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (user.role !== "PATIENT") {
            return res.status(403).json({ error: "Only patients can book appointments" });
        }

        if (!doctorAvailabilityId) {
            return res.status(400).json({ error: "doctorAvailabilityId is required" });
        }

        const appointment = await createAppointment({
            patientId: user.userId,
            doctorAvailabilityId,
            preferredDoctorId,
            description,
            lastDayOfAppointment
        });

        res.status(201).json({
            appointmentId: appointment.appointment.id,
            scheduledAt: appointment.appointment.scheduledAt,
            status: appointment.appointment.status,
            queue: {
                position: appointment.queue.position,
                status: appointment.queue.status,
            },
        });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message || "Failed to create appointment" });
    }
};

// PATCH /appointments/:id/complete
export const complete = async (req: any, res: Response) => {
    const staffRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!staffRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Staff only" });
    }

    try {
        const { id } = req.params;
        const result = await completeAppointment(id);
        res.json({
            message: "Appointment completed",
            appointmentId: result.id,
            status: result.status
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// PATCH /appointments/:id/cancel
export const cancel = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.user;
        const result = await cancelAppointment(id, userId, role);
        res.json({
            message: "Appointment cancelled",
            appointmentId: result.id,
            status: result.status
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// GET /appointments/my-appointments?type=past
export const myAppointments = async (req: any, res: Response) => {
    const { type } = req.query;
    const userId = req.user.userId;
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)); // Using native JS for local startOfDay

    const where: Prisma.AppointmentWhereInput =
        type === "past"
            ? {
                  patientId: userId,
                  OR: [
                      { scheduledAt: { lt: todayStart } },
                      { status: { in: ["DONE", "CANCELLED"] } }
                  ]
              }
            : {
                  patientId: userId,
                  scheduledAt: { gte: todayStart },
                  status: { in: ["WAITING", "ACTIVE"] }
              };

    const appointments = await prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: "asc" },
        include: {
            department: {
                select: { id: true, name: true, hospital: { select: { name: true } } }
            },
            doctor: {
                select: { id: true, name: true, email: true }
            },
            queue: {
                select: {
                    position: true,
                    status: true,
                    departmentId: true,
                    scheduledAt: true
                }
            }
        }
    });

    const results = await Promise.all(appointments.map(async (appt) => {
        let waitTime = 0;
        if (appt.queue && appt.status === "WAITING" && appt.doctorId) {
            waitTime = await calculateEstimatedWaitTime(
                appt.doctorId,
                appt.queue.position,
                appt.queue.scheduledAt
            );
        }
        return {
            ...appt,
            estimatedWaitTime: waitTime
        };
    }));

    res.json(results);
};