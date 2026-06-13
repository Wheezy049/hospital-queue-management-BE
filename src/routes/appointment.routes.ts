import { Router } from "express";
import { protectRoute, isStaff, isDoctor } from "../middlewares/auth.middleware";
import { addAppointment, cancel, complete, myAppointments, listAppointments, addNotes } from "../controllers/appointment.controller";

const appointmentRouter = Router();

appointmentRouter.post("/create-appointment", protectRoute, addAppointment);
appointmentRouter.patch("/:id/complete", protectRoute, isStaff, complete);
appointmentRouter.patch("/:id/cancel", protectRoute, cancel);
appointmentRouter.patch("/:id/notes", protectRoute, isDoctor, addNotes);
appointmentRouter.get("/my-appointments", protectRoute, myAppointments);
appointmentRouter.get("/", protectRoute, listAppointments);

export default appointmentRouter;