import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";

type UserProps = {
    name: string;
    email: string;
    password: string;
    role?: Role;
}

export const registerUser = async ({ name, email, password, role }: UserProps) => {

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || Role.PATIENT
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        }
    });
    return user;
}

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid email or password");
    };

    const token = generateToken({ userId: user.id, role: user.role });

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    }

}