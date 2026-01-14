import { Router } from "express";
import { protectRoute, isAdmin } from "../middlewares/auth.middleware";
import { nextPatient, getMe, getQueueByDateAdmin, getMoveQueue, getQueueByAppointment } from "../controllers/queque.controller";

const quequeRouter = Router();

quequeRouter.post("/next", protectRoute, isAdmin, nextPatient);
quequeRouter.get("/get-queque", protectRoute, isAdmin, getQueueByDateAdmin);
quequeRouter.get("/me", protectRoute, getMe);
quequeRouter.patch("/:id/move", protectRoute, isAdmin, getMoveQueue);
quequeRouter.get("/by-appointment/:appointmentId", protectRoute, getQueueByAppointment)

export default quequeRouter;