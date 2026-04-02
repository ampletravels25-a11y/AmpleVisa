import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create superadmin user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@amplevisa.com" },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@123456", 12);

    await prisma.user.create({
      data: {
        email: "admin@amplevisa.com",
        firstName: "Super",
        lastName: "Admin",
        role: "SUPERADMIN",
        status: "ACTIVE",
        passwordHash,
        twoFactorEnabled: false,
      },
    });

    console.log("Superadmin created: admin@amplevisa.com / Admin@123456");
  } else {
    console.log("Superadmin already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
