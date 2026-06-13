import { Router } from "express";
import { register, login, getMe, createDoctor, listDoctors } from "../controllers/auth.controller";
import { protectRoute, isSuperAdmin } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", protectRoute, getMe);
authRouter.post("/create-doctor", protectRoute, isSuperAdmin, createDoctor);
authRouter.get("/doctors", protectRoute, listDoctors);

export default authRouter;