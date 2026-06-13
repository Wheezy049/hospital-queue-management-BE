import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check all queue entries
  const queues = await prisma.queue.findMany({
    include: {
      appointment: {
        include: { patient: { select: { name: true, email: true } }, department: { select: { name: true } } }
      },
      department: { select: { name: true } }
    },
    orderBy: { scheduledAt: "desc" },
    take: 10
  });

  console.log("=== ALL QUEUE ENTRIES (last 10) ===");
  queues.forEach(q => {
    console.log(`  ID: ${q.id}`);
    console.log(`  DepartmentID: ${q.departmentId} (${q.department.name})`);
    console.log(`  scheduledAt: ${q.scheduledAt.toISOString()} | Local: ${q.scheduledAt.toString()}`);
    console.log(`  Position: ${q.position} | Status: ${q.status}`);
    console.log(`  Patient: ${q.appointment?.patient?.name}`);
    console.log(`  ---`);
  });

  // Check all appointments for today
  const today = new Date();
  console.log(`\n=== SERVER TIME ===`);
  console.log(`  new Date(): ${today.toString()}`);
  console.log(`  ISO: ${today.toISOString()}`);
  console.log(`  Local date string: ${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);

  // Check all doctors
  const doctors = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true, departmentId: true, department: { select: { name: true } } }
  });

  console.log(`\n=== DOCTORS ===`);
  doctors.forEach(d => {
    console.log(`  ${d.name} (${d.email}) | DeptID: ${d.departmentId} (${d.department?.name || 'NONE'})`);
  });

  // Check today's appointments
  const appointments = await prisma.appointment.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 10,
    include: {
      patient: { select: { name: true } },
      department: { select: { name: true } }
    }
  });

  console.log(`\n=== RECENT APPOINTMENTS (last 10) ===`);
  appointments.forEach(a => {
    console.log(`  ID: ${a.id}`);
    console.log(`  DeptID: ${a.departmentId} (${a.department.name})`);
    console.log(`  scheduledAt: ${a.scheduledAt.toISOString()} | Local: ${a.scheduledAt.toString()}`);
    console.log(`  Status: ${a.status} | Patient: ${a.patient.name}`);
    console.log(`  ---`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
