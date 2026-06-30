import { Request, Response } from "express";
import { createSlots, getDoctorSlots, getAvailableSlots, deleteSlot } from "../services/availability.service";

export const addDoctorAvailability = async (req: any, res: Response) => {
  try {
    const { date, times, doctorId: bodyDoctorId } = req.body;
    const { role, userId } = req.user;

    let targetDoctorId = userId;
    if (role === "SUPER_ADMIN") {
      if (!bodyDoctorId) {
        return res.status(400).json({ message: "doctorId is required for super admin" });
      }
      targetDoctorId = bodyDoctorId;
    }

    if (!date || !times || !Array.isArray(times)) {
      return res.status(400).json({ message: "date and an array of times are required" });
    }

    const slots = await createSlots(targetDoctorId, date, times);
    res.status(201).json({ message: "Availability slots created", slots });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listMySlots = async (req: any, res: Response) => {
  try {
    const { role, userId } = req.user;
    const { date, doctorId: queryDoctorId } = req.query;

    let targetDoctorId = userId;
    if (role === "SUPER_ADMIN") {
      if (!queryDoctorId) {
        return res.status(400).json({ message: "doctorId is required for super admin" });
      }
      targetDoctorId = queryDoctorId as string;
    }

    const slots = await getDoctorSlots(targetDoctorId, date as string);
    res.json(slots);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId, departmentId, date } = req.query;

    const slots = await getAvailableSlots({
      doctorId: doctorId as string,
      departmentId: departmentId as string,
      date: date as string,
    });
    res.json(slots);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeSlot = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;

    await deleteSlot(userId, id, role === "SUPER_ADMIN");
    res.json({ message: "Availability slot deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};