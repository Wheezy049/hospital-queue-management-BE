import { Router } from "express";
import { listHospitals } from "../controllers/hospital.controller";
import { protectRoute } from "../middlewares/auth.middleware";

const hospitalRouter = Router();

hospitalRouter.get("/", protectRoute, listHospitals);

export default hospitalRouter;