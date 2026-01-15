import { Response, Request, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export const protectRoute = (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token." });
    }
}

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access only" });
    }
    next();
}