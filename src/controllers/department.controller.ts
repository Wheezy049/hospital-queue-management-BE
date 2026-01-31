import { Request, Response } from "express";
import { createDepartment, getAllDepartments } from "../services/department.service";

/**
 * @openapi
 * /departments:
 *   post:
 *     tags:
 *       - Departments
 *     summary: Create a new department
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - hospitalId
 *             properties:
 *               name:
 *                 type: string
 *               hospitalId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created
 *       400:
 *         description: Bad request
 */
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

/**
 * @openapi
 * /departments:
 *   get:
 *     tags:
 *       - Departments
 *     security: []
 *     summary: Get all departments
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of departments
 */
export const getDepartment = async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.query;
    const departments = await getAllDepartments(hospitalId as string | undefined);
    res.status(200).json(departments);
  } catch (error) {
    res.status(400).json({ error: "Failed to get departments" });
  }
}