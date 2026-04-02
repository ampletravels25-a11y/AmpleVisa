import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { adminLoginSchema } from "@/lib/schemas/auth";
import { verifyPassword, createSession } from "@/lib/auth";
import { verifySync } from "otplib";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !["SUPERADMIN", "ADMIN_TEAM"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // If 2FA code provided in body, verify it
      if (body.twoFactorCode) {
        const isValid2fa = verifySync({
          token: body.twoFactorCode,
          secret: user.twoFactorSecret,
        });

        if (!isValid2fa) {
          return NextResponse.json(
            { success: false, error: "Invalid 2FA code" },
            { status: 401 }
          );
        }
      } else {
        // Request 2FA code
        return NextResponse.json({
          success: true,
          data: { requires2fa: true, message: "Please enter your 2FA code" },
        });
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await createSession(user.id, user.role);

    return NextResponse.json({
      success: true,
      data: { message: "Login successful", redirectTo: "/admin/dashboard" },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
