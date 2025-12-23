import jwt from "jsonwebtoken";

export const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
    throw new Error("JWT_SECRET environment variable is not set.");
}

export const generateToken = (payload: { userId: string, role: string }) => {
    return jwt.sign(payload, SECRET, { expiresIn: "1h" });

}

export const verifyToken = (token: string) => {
    return jwt.verify(token, SECRET);
}