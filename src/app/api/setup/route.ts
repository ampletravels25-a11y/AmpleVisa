import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// One-time setup endpoint to create the superadmin account.
// Only works if no superadmin exists yet.
export async function GET() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "SUPERADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: "Superadmin already exists. Setup not needed.",
      });
    }

    const passwordHash = await hashPassword("Admin@123456");

    const admin = await prisma.user.create({
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

    return NextResponse.json({
      success: true,
      data: {
        message: "Superadmin created successfully",
        email: admin.email,
        password: "Admin@123456",
        note: "Change this password immediately after first login!",
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { success: false, error: "Setup failed. Check server logs." },
      { status: 500 }
    );
  }
}
