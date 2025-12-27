import { Router } from "express";
import { addDepartment, getDepartment } from "../controllers/department.controller";
import { protectRoute, isAdmin } from "../middlewares/auth.middleware";

const departmentRouter = Router();

departmentRouter.get("/get-departments", protectRoute, getDepartment);
departmentRouter.post("/create-department", protectRoute, isAdmin, addDepartment);

export default departmentRouter;