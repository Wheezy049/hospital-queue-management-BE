import { Router } from "express";
import { protectRoute, isAdmin } from "../middlewares/auth.middleware";
import { addAppointment, cancel, complete, myAppointments } from "../controllers/appointment.controller";

const appointmentRouter = Router();

appointmentRouter.post("/create-appointment", protectRoute, addAppointment);
appointmentRouter.patch("/:id/complete", protectRoute, isAdmin, complete);
appointmentRouter.patch("/:id/cancel", protectRoute, cancel);
appointmentRouter.get("/my-appointments", protectRoute, myAppointments);

export default appointmentRouter;