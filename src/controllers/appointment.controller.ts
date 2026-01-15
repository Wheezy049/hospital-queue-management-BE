import { Request, Response } from "express";
import { createAppointment, cancelAppointment, completeAppointment } from "../services/appointment.service";
import { prisma } from "../lib/prisma";
import { normalizeScheduledAt } from "../utils/date";

// POST /appointments/create-appointment
export const addAppointment = async (req: Request, res: Response) => {
    try {
        const { departmentId, hospitalId, date, time } = req.body;

        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (user.role !== "PATIENT") {
            return res.status(403).json({ error: "Only patients can book appointments" });
        }

        if (!departmentId || !hospitalId || !date || !time) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const department = await prisma.department.findFirst({
            where: {
                id: departmentId,
                hospitalId,
            },
        });

        if (!department) {
            return res
                .status(404)
                .json({ error: "Department not found in the specified hospital" });
        }

        const scheduledAt = normalizeScheduledAt(date, time);

        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                patientId: user.userId,
                departmentId,
                scheduledAt,
                status: {
                    notIn: ["CANCELLED", "DONE"],
                },
            },
        });

        if (existingAppointment) {
            return res
                .status(400)
                .json({ error: "You already have an appointment for this date" });
        }

        if (scheduledAt.getTime() < Date.now()) {
            return res.status(400).json({
                error: "You cannot book an appointment in the past",
            });
        }

        const appointment = await createAppointment({
            departmentId,
            patientId: user.userId,
            date,
            time,
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
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to create appointment" });
    }
};

// PATCH /appointments/:id/complete
export const complete = async (req: any, res: Response) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admins only" });
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
    const where =
        type === "past"
            ? { patientId: userId, scheduledAt: { lt: today } }
            : { patientId: userId, scheduledAt: { gte: today } };

    const appointments = await prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: "asc" },
        select: {
            id: true,
            scheduledAt: true,
            status: true,
            department: {
                select: { name: true, hospital: { select: { name: true } } }
            },
            queue: {
                select: {
                    position: true,
                    status: true
                }
            }
        }
    });

    res.json(appointments);
};