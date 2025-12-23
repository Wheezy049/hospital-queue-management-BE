import { Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { prisma } from "../src/lib/prisma";


async function main() {
  const hashedPassword = await hashPassword("admin123@");

  await prisma.user.upsert({
    where: { email: "wheezy049@gmail.com" },
    update: {},
    create: {
      name: "Hospital Admin",
      email: "wheezy049@gmail.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log("Admin user created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());