import { Request, Response } from "express";
import { registerUser, loginUser, getAllDoctors } from "../services/auth.service";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { prisma } from "../lib/prisma";

export const register = async (req: Request, res: Response) => {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({ message: validation.error.issues[0].message });
    }

    try {
        const user = await registerUser(validation.data);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}

export const listDoctors = async (req: Request, res: Response) => {
    try {
        const doctors = await getAllDoctors();
        res.status(200).json(doctors);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}

export const login = async (req: Request, res: Response) => {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({ message: validation.error.issues[0].message });
    }

    try {
        const user = await loginUser(validation.data.email, validation.data.password);
        res.status(200).json(user);
    } catch (error: any) {
        res.status(401).json({ message: error.message });

    }
}

export const getMe = async (req: any, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            department: { select: { name: true } }
        },
    });

    res.json(user);
};

export const createDoctor = async (req: Request, res: Response) => {
    try {
        const { name, email, password, departmentId } = req.body;

        // Note: Middleware should handle Super Admin check, but we can double check here
        if ((req as any).user.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Only Super Admins can create doctors" });
        }

        const doctor = await registerUser({
            name,
            email,
            password,
            role: "ADMIN",
            departmentId
        });

        res.status(201).json(doctor);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}