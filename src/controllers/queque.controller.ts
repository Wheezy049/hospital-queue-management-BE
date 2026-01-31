import { Request, Response } from "express";
import { callNextPatient, getMyQueueStatus, getQueueByDate, moveQueue } from "../services/queque.admin.service";
import { prisma } from "../lib/prisma";

// POST /queue/next
/**
 * @openapi
 * /queue/next:
 *   post:
 *     tags:
 *       - Queue
 *     summary: Call the next patient in queue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentId
 *             properties:
 *               departmentId:
 *                 type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Next patient called
 */
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
/**
 * @openapi
 * /queue/get-queque:
 *   get:
 *     tags:
 *       - Queue
 *     summary: Get queue for a department (Admin)
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue list
 */
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
/**
 * @openapi
 * /queue/me:
 *   get:
 *     tags:
 *       - Queue
 *     summary: Get my queue status
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: My queue status
 *       404:
 *         description: No queue found
 */
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
/**
 * @openapi
 * /queue/{id}/move:
 *   patch:
 *     tags:
 *       - Queue
 *     summary: Move a queue item up or down
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - direction
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [UP, DOWN]
 *     responses:
 *       200:
 *         description: Queue moved
 */
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
}

// GET /queue/by-appointment/:appointmentId
/**
 * @openapi
 * /queue/by-appointment/{appointmentId}:
 *   get:
 *     tags:
 *       - Queue
 *     summary: Get queue status by appointment ID
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue status
 *       404:
 *         description: Not in queue
 */
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