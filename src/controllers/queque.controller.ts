import { Request, Response } from "express";
import { callNextPatient, getMyQueueStatus, getQueueByDate } from "../services/queque.admin.service";

export const nextPatient = async (req: Request, res: Response) => {
  try {
    const { departmentId, date } = req.body;

    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    const result = await callNextPatient(departmentId, date);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to move queue" });
  }
};

// GET /queue/today?departmentId=...
export const getQueueByDateAdmin = async (req: Request, res: Response) => {
  try {
    const { departmentId, date } = req.query;
    if (!departmentId) return res.status(400).json({ message: "departmentId required" });

    const queue = await getQueueByDate(departmentId as string, date as string);
    res.json(queue);
  } catch (error) {
    console.error("ADMIN_QUEUE_FETCH_ERROR:", error);
    res.status(500).json({ message: "Error fetching queue" });
  }
};

// GET /queue/me
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const myStatus = await getMyQueueStatus(userId, date as string);

    if (!myStatus) {
      return res.status(404).json({ message: "No queue found for this date" });
    }

    res.json(myStatus);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your status" });
  }
};