import { Router } from "express";
import { addDepartment, getDepartment, updateStrategy } from "../controllers/department.controller";
import { protectRoute, isSuperAdmin } from "../middlewares/auth.middleware";

const departmentRouter = Router();

departmentRouter.get("/get-departments", protectRoute, getDepartment);
departmentRouter.post("/create-department", protectRoute, isSuperAdmin, addDepartment);
departmentRouter.put("/:id/strategy", protectRoute, isSuperAdmin, updateStrategy);

export default departmentRouter;