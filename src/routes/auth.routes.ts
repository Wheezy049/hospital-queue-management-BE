import { Router } from "express";
import { register, login, getMe, createDoctor, listDoctors } from "../controllers/auth.controller";
import { protectRoute, isSuperAdmin } from "../middlewares/auth.middleware";
import rateLimiter from "express-rate-limit";

const authRouter = Router();

const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: "Too many login attempts. Please try again after 15 minutes." }
});

authRouter.post("/register", register);
authRouter.post("/login", loginLimiter, login);
authRouter.get("/me", protectRoute, getMe);
authRouter.post("/create-doctor", protectRoute, isSuperAdmin, createDoctor);
authRouter.get("/doctors", protectRoute, listDoctors);

export default authRouter;