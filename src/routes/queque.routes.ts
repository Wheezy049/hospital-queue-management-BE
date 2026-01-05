import { Router } from "express";
import { protectRoute, isAdmin } from "../middlewares/auth.middleware";
import { nextPatient, getMe, getQueueByDateAdmin } from "../controllers/queque.controller";

const quequeRouter = Router();

quequeRouter.post("/next", protectRoute, isAdmin, nextPatient);
quequeRouter.get("/get-queque", protectRoute, isAdmin, getQueueByDateAdmin);
quequeRouter.get("/me", protectRoute, getMe);

export default quequeRouter;