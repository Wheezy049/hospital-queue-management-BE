import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { createAppointment, cancelAppointment, completeAppointment, getAppointments, updateAppointmentNotes } from "../services/appointment.service";
import { calculateEstimatedWaitTime } from "../services/queque.service";
import { prisma } from "../lib/prisma";
import { normalizeScheduledAt } from "../utils/date";

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
/**
 * @openapi
 * /appointments/create-appointment:
 *   post:
 *     tags:
 *       - Appointments
 *     summary: Create a new appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentId
 *               - hospitalId
 *               - date
 *               - time
 *             properties:
 *               departmentId:
 *                 type: string
 *               hospitalId:
 *                 type: string
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export const addAppointment = async (req: Request, res: Response) => {
    try {
        const { departmentId, hospitalId, date, time, description, duration } = req.body;

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
            description,
            duration: duration ? parseInt(duration) : undefined
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
/**
 * @openapi
 * /appointments/{id}/complete:
 *   patch:
 *     tags:
 *       - Appointments
 *     summary: Mark an appointment as complete (Staff only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment completed
 *       403:
 *         description: Staff only
 */
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
/**
 * @openapi
 * /appointments/{id}/cancel:
 *   patch:
 *     tags:
 *       - Appointments
 *     summary: Cancel an appointment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled
 */
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
/**
 * @openapi
 * /appointments/my-appointments:
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Get my appointments
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [past, upcoming]
 *         description: Filter by past or upcoming appointments
 *     responses:
 *       200:
 *         description: List of appointments
 */
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
        if (appt.queue && appt.status === "WAITING") {
            waitTime = await calculateEstimatedWaitTime(
                appt.queue.departmentId,
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