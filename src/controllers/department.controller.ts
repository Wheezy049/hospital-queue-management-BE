import { Request, Response } from "express";
import { createDepartment, getAllDepartments } from "../services/department.service";

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
    const departments = await getAllDepartments();
    res.status(200).json(departments);
  } catch (error) {
    res.status(400).json({ error: "Failed to get departments" });
  }
}