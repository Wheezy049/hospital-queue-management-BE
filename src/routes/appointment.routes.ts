import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware";
import { addAppointment } from "../controllers/appointment.controller";

const appointmentRouter = Router();

appointmentRouter.post("/create-appointment", protectRoute, addAppointment);

export default appointmentRouter;