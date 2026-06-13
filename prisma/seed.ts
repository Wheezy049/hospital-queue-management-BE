import { Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { prisma } from "../src/lib/prisma";

async function main() {
  const superAdminPassword = await hashPassword("superadmin123@");
  const doctorPassword = await hashPassword("doctor123@");

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@hospital.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@hospital.com",
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  const hospital = await prisma.hospital.upsert({
    where: { id: 'main-hospital-id' },
    update: { },
    create: {
      id: 'main-hospital-id',
      name: 'General Health Medical Center'
    }
  });

  const department = await prisma.department.upsert({
    where: { id: 'cardiology-dept-id' },
    update: {},
    create: {
        id: 'cardiology-dept-id',
        name: 'Cardiology',
        hospitalId: 'main-hospital-id'
    }
  });

  const doctor = await prisma.user.upsert({
    where: { email: "doctor@hospital.com" },
    update: {},
    create: {
      name: "Dr. Smith",
      email: "doctor@hospital.com",
      password: doctorPassword,
      role: Role.ADMIN, // Doctors are now ADMINS
      departmentId: 'cardiology-dept-id'
    },
  });

  console.log("Seeding completed.", { superAdmin, hospital, doctor });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());