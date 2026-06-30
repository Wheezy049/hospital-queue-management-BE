import { Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { prisma } from "../src/lib/prisma";

async function main() {
  // Hash passwords for the seed data
  const superAdminPassword = await hashPassword("superadmin123@");
  const doctorPassword = await hashPassword("doctor123@");

  console.log("Starting database seed...");

  // Create Super Admin
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

  // Create Hospital : Qure Metro Hospital
  const metroHospital = await prisma.hospital.upsert({
    where: { id: "qure-metro-id" },
    update: { name: "Qure Metro Hospital" },
    create: {
      id: "qure-metro-id",
      name: "Qure Metro Hospital",
    },
  });

  // Create Departments for Hospital 
  const cardiologyDept = await prisma.department.upsert({
    where: { id: "metro-cardiology-id" },
    update: {},
    create: {
      id: "metro-cardiology-id",
      name: "Cardiology",
      hospitalId: metroHospital.id,
      assignmentStrategy: "PATIENT_SELECTED",
    },
  });

  const pediatricsDept = await prisma.department.upsert({
    where: { id: "metro-pediatrics-id" },
    update: {},
    create: {
      id: "metro-pediatrics-id",
      name: "Pediatrics",
      hospitalId: metroHospital.id,
      assignmentStrategy: "AUTO_ASSIGN",
    },
  });

  // Create General Medicine for Hospital 
  const generalDept = await prisma.department.upsert({
    where: { id: "care-general-id" },
    update: {},
    create: {
      id: "care-general-id",
      name: "General Medicine",
      hospitalId: metroHospital.id,
      assignmentStrategy: "AUTO_ASSIGN",
    },
  });

  // Create Doctors
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
      status: "ACTIVE",
      isAvailable: true,
      maxDailyPatients: 20,
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
      status: "ACTIVE",
      isAvailable: true,
      maxDailyPatients: 20,
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
      status: "ACTIVE",
      isAvailable: true,
      maxDailyPatients: 20,
    },
  });

  // Create Doctor Availabilities
  const today = new Date();
  const getFutureDate = (daysAhead: number, hours: number, minutes: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const availabilityData = [
    // Dr. Smith slots
    { doctorId: "doctor-smith-id", scheduledAt: getFutureDate(1, 9, 0) },
    { doctorId: "doctor-smith-id", scheduledAt: getFutureDate(1, 9, 30) },
    { doctorId: "doctor-smith-id", scheduledAt: getFutureDate(1, 10, 0) },
    { doctorId: "doctor-smith-id", scheduledAt: getFutureDate(1, 10, 30) },
    { doctorId: "doctor-smith-id", scheduledAt: getFutureDate(1, 11, 0) },

    // Dr. Davis slots
    { doctorId: "doctor-davis-id", scheduledAt: getFutureDate(1, 14, 0) },
    { doctorId: "doctor-davis-id", scheduledAt: getFutureDate(1, 14, 30) },
    { doctorId: "doctor-davis-id", scheduledAt: getFutureDate(1, 15, 0) },
    { doctorId: "doctor-davis-id", scheduledAt: getFutureDate(1, 15, 30) },

    // Dr. Johnson slots
    { doctorId: "doctor-johnson-id", scheduledAt: getFutureDate(2, 10, 0) },
    { doctorId: "doctor-johnson-id", scheduledAt: getFutureDate(2, 10, 30) },
    { doctorId: "doctor-johnson-id", scheduledAt: getFutureDate(2, 11, 0) },
    { doctorId: "doctor-johnson-id", scheduledAt: getFutureDate(2, 11, 30) },
  ];

  for (const slot of availabilityData) {
    await prisma.doctorAvailability.upsert({
      where: {
        doctorId_scheduledAt: {
          doctorId: slot.doctorId,
          scheduledAt: slot.scheduledAt,
        },
      },
      update: {},
      create: {
        doctorId: slot.doctorId,
        scheduledAt: slot.scheduledAt,
      },
    });
  }

  console.log("Seeding completed successfully.", {
    superAdmin: superAdmin.email,
    hospitals: [metroHospital.name],
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