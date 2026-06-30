import { Router } from "express";
import { protectRoute, isDoctor } from "../middlewares/auth.middleware";
import {
  addDoctorAvailability,
  listMySlots,
  listAvailableSlots,
  removeSlot,
} from "../controllers/availability.controller";

const availabilityRouter = Router();

availabilityRouter.post("/", protectRoute, isDoctor, addDoctorAvailability);
availabilityRouter.get("/me", protectRoute, isDoctor, listMySlots);
availabilityRouter.get("/available", protectRoute, listAvailableSlots);
availabilityRouter.delete("/:id", protectRoute, isDoctor, removeSlot);

export default availabilityRouter;