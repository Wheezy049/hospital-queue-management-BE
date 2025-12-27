import { Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { prisma } from "../src/lib/prisma";


async function main() {
  const hashedPassword = await hashPassword("admin123@");

  const admin = await prisma.user.upsert({
    where: { email: "wheezy049@gmail.com" },
    update: {},
    create: {
      name: "Hospital Admin",
      email: "wheezy049@gmail.com",
      password: hashedPassword,
      role: Role.ADMIN,
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

  console.log("Seeding completed.", { admin, hospital });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());