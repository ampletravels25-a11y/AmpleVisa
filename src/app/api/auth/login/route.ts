import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { emailSchema } from "@/lib/schemas/auth";
import { generateOtp, createOtp } from "@/lib/auth";
import { sendEmail, otpEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found. Please sign up first." },
        { status: 404 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, error: "Your account has been suspended. Contact support." },
        { status: 403 }
      );
    }

    // Rate limiting: max 5 OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await prisma.otpCode.count({
      where: {
        userId: user.id,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentOtps >= 5) {
      return NextResponse.json(
        { success: false, error: "Too many OTP requests. Try again later." },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    await createOtp(user.id, otp);
    await sendEmail({
      to: email,
      subject: "Your login code — AmpleVisa",
      html: otpEmailHtml(otp),
    });

    return NextResponse.json({
      success: true,
      data: { message: "OTP sent to your email" },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
