import { Request, Response } from "express";
import { callNextPatient, getMyQueueStatus, getQueueByDate, moveQueue } from "../services/queque.admin.service";
import { prisma } from "../lib/prisma";

// POST /queue/next
export const nextPatient = async (req: Request, res: Response) => {
  try {
    const { departmentId, date } = req.body;

    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    const result = await callNextPatient(departmentId, date);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("QUEUE NEXT ERROR:", error); 
    res.status(500).json({
      message: error.message || "Failed to move queue",
    });

  }
};

// GET /queue/get-queque?departmentId=...&date=...
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

// GET /queue/me?date=...
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;

    const myStatus = await getMyQueueStatus(userId, date as string);

    if (!myStatus) {
      return res.status(404).json({ message: "No queue found for this date" });
    }

    res.json(myStatus);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your status" });
  }
};

// PATCH /queue/:id/move
export const getMoveQueue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { direction } = req.body;

  if (!direction) return res.status(400).json({ message: "direction is required" });
  try {
    const move = await moveQueue(id, direction);
    res.json(move);
  } catch (error) {
    res.status(500).json({ message: "Error moving queue" });
  }
}

// GET /queue/by-appointment/:appointmentId
export const getQueueByAppointment = async (req: Request, res: Response) => {
  const { appointmentId } = req.params;

  const queue = await prisma.queue.findUnique({
    where: { appointmentId },
  });

  if (!queue) return res.status(404).json({ message: "Not in queue" });

  res.json({
    position: queue.position,
    status: queue.status,
  });
};