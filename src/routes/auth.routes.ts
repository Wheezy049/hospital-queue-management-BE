import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { protectRoute } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", protectRoute, getMe);

export default authRouter;