import { Request, Response } from "express";
import { createAppointment } from "../services/appointment.service";
import { prisma } from "../lib/prisma";

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

        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                patientId: user.userId,
                date: new Date(date),
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

        const appointment = await createAppointment({
            departmentId,
            patientId: user.userId,
            date: new Date(date),
            time,
        });

        res.status(201).json(appointment);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to create appointment" });
    }
};