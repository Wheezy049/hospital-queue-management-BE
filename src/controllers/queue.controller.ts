import { Request, Response } from "express";
import { callNextPatient, getMyQueueStatus, getQueueByDate, moveQueue } from "../services/queue.admin.service";
import { prisma } from "../lib/prisma";

// POST /queue/next
export const nextPatient = async (req: any, res: Response) => {
  try {
    const { date, departmentId } = req.body;
    const { role, userId } = req.user;

    let result;
    if (role === "ADMIN") {
      result = await callNextPatient({ doctorId: userId }, date);
    } else {
      if (!departmentId) {
        return res.status(400).json({ message: "departmentId is required" });
      }
      result = await callNextPatient({ departmentId }, date);
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("QUEUE NEXT ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to move queue",
    });
  }
};

// GET /queue/get-queue?doctorId=...&departmentId=...&date=...
export const getQueueByDateAdmin = async (req: any, res: Response) => {
  try {
    const { doctorId, departmentId, date } = req.query;
    const { role, userId } = req.user;

    let filters: any = {};

    if (role === "ADMIN") {
      filters.doctorId = userId;
    } else {
      if (doctorId) filters.doctorId = doctorId as string;
      if (departmentId) filters.departmentId = departmentId as string;
    }

    const queue = await getQueueByDate(filters, date as string);
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

    res.json({
      position: myStatus.position,
      status: myStatus.status,
      scheduledAt: myStatus.scheduledAt,
      department: {
        name: myStatus.appointment.department.name,
      },
    });
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
    res.json({
      id: move.id,
      position: move.position,
      status: move.status
    });
  } catch (error) {
    res.status(500).json({ message: "Error moving queue" });
  }
};

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

// GET /queue/public?doctorId=...&departmentId=...&date=...
export const getQueueByDatePublic = async (req: Request, res: Response) => {
  try {
    const { doctorId, departmentId, date } = req.query;

    if (!doctorId && !departmentId) {
      return res.status(400).json({ message: "doctorId or departmentId is required" });
    }

    const filters: any = {};
    if (doctorId) filters.doctorId = doctorId as string;
    if (departmentId) filters.departmentId = departmentId as string;

    const queue = await getQueueByDate(filters, date as string);

    // Map and strip sensitive data
    const publicQueue = queue.map((item) => ({
      id: item.id,
      position: item.position,
      status: item.status,
      scheduledAt: item.scheduledAt,
      appointmentId: item.appointment.id,
    }));

    res.json(publicQueue);
  } catch (error) {
    console.error("PUBLIC_QUEUE_FETCH_ERROR:", error);
    res.status(500).json({ message: "Error fetching public queue" });
  }
};