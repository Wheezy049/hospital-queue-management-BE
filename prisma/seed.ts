import { Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { prisma } from "../src/lib/prisma";

async function main() {
  // Hash passwords for the seed data
  const superAdminPassword = await hashPassword("superadmin123@");
  const doctorPassword = await hashPassword("doctor123@");

  console.log("Starting database seed...");

  // 1. Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@qure.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@qure.com",
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Create Hospital 1: Qure Metro Hospital
  const metroHospital = await prisma.hospital.upsert({
    where: { id: "qure-metro-id" },
    update: { name: "Qure Metro Hospital" },
    create: {
      id: "qure-metro-id",
      name: "Qure Metro Hospital",
    },
  });

  // 3. Create Hospital 2: Qure Care Clinic
  const careClinic = await prisma.hospital.upsert({
    where: { id: "qure-care-id" },
    update: { name: "Qure Care Clinic" },
    create: {
      id: "qure-care-id",
      name: "Qure Care Clinic",
    },
  });

  // 4. Create Departments for Hospital 1
  const cardiologyDept = await prisma.department.upsert({
    where: { id: "metro-cardiology-id" },
    update: {},
    create: {
      id: "metro-cardiology-id",
      name: "Cardiology",
      hospitalId: metroHospital.id,
    },
  });

  const pediatricsDept = await prisma.department.upsert({
    where: { id: "metro-pediatrics-id" },
    update: {},
    create: {
      id: "metro-pediatrics-id",
      name: "Pediatrics",
      hospitalId: metroHospital.id,
    },
  });

  // 5. Create Department for Hospital 2
  const generalDept = await prisma.department.upsert({
    where: { id: "care-general-id" },
    update: {},
    create: {
      id: "care-general-id",
      name: "General Medicine",
      hospitalId: careClinic.id,
    },
  });

  // 6. Create Doctors
  const doctorSmith = await prisma.user.upsert({
    where: { email: "smith@qure.com" },
    update: {},
    create: {
      id: "doctor-smith-id",
      name: "Dr. Smith",
      email: "smith@qure.com",
      password: doctorPassword,
      role: Role.ADMIN,
      departmentId: cardiologyDept.id,
    },
  });

  const doctorDavis = await prisma.user.upsert({
    where: { email: "davis@qure.com" },
    update: {},
    create: {
      id: "doctor-davis-id",
      name: "Dr. Davis",
      email: "davis@qure.com",
      password: doctorPassword,
      role: Role.ADMIN,
      departmentId: pediatricsDept.id,
    },
  });

  const doctorJohnson = await prisma.user.upsert({
    where: { email: "johnson@qure.com" },
    update: {},
    create: {
      id: "doctor-johnson-id",
      name: "Dr. Johnson",
      email: "johnson@qure.com",
      password: doctorPassword,
      role: Role.ADMIN,
      departmentId: generalDept.id,
    },
  });

  console.log("Seeding completed successfully.", {
    superAdmin: superAdmin.email,
    hospitals: [metroHospital.name, careClinic.name],
    departments: [cardiologyDept.name, pediatricsDept.name, generalDept.name],
    doctors: [doctorSmith.name, doctorDavis.name, doctorJohnson.name],
  });
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });