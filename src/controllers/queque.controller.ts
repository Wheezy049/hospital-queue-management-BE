import { Request, Response } from "express";
import { callNextPatient, getMyQueueStatus, getTodaysQueue } from "../services/queque.admin.service";

export const nextPatient = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.body;

    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    const result = await callNextPatient(departmentId);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to move queue" });
  }
};


// GET /queue/today?departmentId=...
export const getTodayQueue = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.query;
    if (!departmentId) return res.status(400).json({ message: "departmentId required" });

    const queue = await getTodaysQueue(departmentId as string);
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: "Error fetching queue" });
  }
};

// GET /queue/me
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const myStatus = await getMyQueueStatus(userId);
    
    if (!myStatus) {
      return res.status(404).json({ message: "No active queue found for today" });
    }

    res.json(myStatus);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your status" });
  }
};