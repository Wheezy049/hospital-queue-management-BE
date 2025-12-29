import { Router } from "express";
import { protectRoute, isAdmin } from "../middlewares/auth.middleware";
import { nextPatient, getMe, getTodayQueue } from "../controllers/queque.controller";

const quequeRouter = Router();

quequeRouter.post("/next", protectRoute, isAdmin, nextPatient);
quequeRouter.get("/today", protectRoute, isAdmin, getTodayQueue);
quequeRouter.get("/me", protectRoute, getMe);

export default quequeRouter;