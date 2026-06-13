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

export const hasRole = (roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of these roles: ${roles.join(", ")}` });
        }
        next();
    };
};

// Convenience middleware
export const isAdmin = hasRole(["ADMIN", "SUPER_ADMIN"]);
export const isSuperAdmin = hasRole(["SUPER_ADMIN"]);
export const isDoctor = hasRole(["ADMIN", "SUPER_ADMIN"]);
export const isStaff = hasRole(["ADMIN", "SUPER_ADMIN"]);