import { Router } from "express";
import { protectRoute, isAdmin } from "../middlewares/auth.middleware";
import { nextPatient, getMe, getQueueByDateAdmin, getMoveQueue, getQueueByAppointment, getQueueByDatePublic } from "../controllers/queue.controller";

const queueRouter = Router();

queueRouter.post("/next", protectRoute, isAdmin, nextPatient);
queueRouter.get("/get-queue", protectRoute, isAdmin, getQueueByDateAdmin);
queueRouter.get("/public", protectRoute, getQueueByDatePublic);
queueRouter.get("/me", protectRoute, getMe);
queueRouter.patch("/:id/move", protectRoute, isAdmin, getMoveQueue);
queueRouter.get("/by-appointment/:appointmentId", protectRoute, getQueueByAppointment);

export default queueRouter;
