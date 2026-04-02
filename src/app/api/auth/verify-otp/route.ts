import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyOtpSchema } from "@/lib/schemas/auth";
import { verifyOtp, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const isValid = await verifyOtp(user.id, otp);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    // Activate user if pending (first login after signup)
    if (user.status === "PENDING") {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE" },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    await createSession(user.id, user.role);

    const redirectTo = user.role === "EMPLOYEE" ? "/dashboard" : "/admin/dashboard";

    return NextResponse.json({
      success: true,
      data: { message: "Login successful", redirectTo },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
