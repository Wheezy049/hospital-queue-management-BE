import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";
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
        },
    });

    res.json(user);
};