import { Request, Response } from "express";
import { createDepartment, getAllDepartments, updateDepartmentStrategy } from "../services/department.service";

export const addDepartment = async (req: Request, res: Response) => {
  try {
    const { name, hospitalId } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Department name is required" });
    }
    if (!hospitalId) {
      return res.status(400).json({ error: "Hospital ID is required" });
    }
    const department = await createDepartment(name, hospitalId);
    res.status(201).json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    if ((error as any).code === 'P2003') {
      return res.status(400).json({ error: "The provided Hospital ID does not exist." });
    }
    res.status(400).json({ error: "Failed to create department" });
  }
}

export const getDepartment = async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.query;
    const departments = await getAllDepartments(hospitalId as string | undefined);
    res.status(200).json(departments);
  } catch (error) {
    res.status(400).json({ error: "Failed to get departments" });
  }
}

export const updateStrategy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignmentStrategy } = req.body;

    if (!assignmentStrategy || (assignmentStrategy !== "AUTO_ASSIGN" && assignmentStrategy !== "PATIENT_SELECTED")) {
      return res.status(400).json({ error: "Invalid assignmentStrategy" });
    }

    const department = await updateDepartmentStrategy(id, assignmentStrategy);
    res.status(200).json(department);
  } catch (error: any) {
    console.error("Error updating department strategy:", error);
    res.status(400).json({ error: error.message || "Failed to update strategy" });
  }
};