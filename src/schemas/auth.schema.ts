import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string()
        .email("Invalid email format"),
    password: z.string()
        .min(7, "Password must be more than 6 characters")
        .regex(/[a-zA-Z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});
