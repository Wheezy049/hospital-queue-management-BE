import { prisma } from "../lib/prisma";

export const createDepartment = async (name: string, hospitalId: string) => {
   return prisma.department.create({
    data: {
        name,
        hospitalId
    }
   })
}

export const getAllDepartments = async () => {
    return prisma.department.findMany({
        include: {
            hospital: true
        }
    });
}