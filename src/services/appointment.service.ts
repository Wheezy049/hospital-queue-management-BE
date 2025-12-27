import { prisma } from "../lib/prisma";

export const createAppointment = async ({ departmentId, date, patientId, time }: {
    departmentId: string;
    patientId: string;
    date: Date;
    time: string;
}) => {
    return prisma.appointment.create({
        data: {
            departmentId,
            patientId,
            date,
            time,
        }
    })
}