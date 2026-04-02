import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { emailSchema } from "@/lib/schemas/auth";
import { generateOtp, createOtp, extractDomain, getOrCreateCompany } from "@/lib/auth";
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
    const domain = extractDomain(email);

    // Block common personal email domains
    const blockedDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
    if (blockedDomains.includes(domain)) {
      return NextResponse.json(
        { success: false, error: "Please use your corporate email address" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      return NextResponse.json(
        { success: false, error: "Account already exists. Please log in instead." },
        { status: 409 }
      );
    }

    // Get or create company by domain
    const company = await getOrCreateCompany(email);

    // Create user
    user = await prisma.user.create({
      data: {
        email,
        role: "EMPLOYEE",
        companyId: company.id,
        status: "PENDING",
      },
    });

    // Generate and send OTP
    const otp = generateOtp();
    await createOtp(user.id, otp);
    await sendEmail({
      to: email,
      subject: "Verify your email — AmpleVisa",
      html: otpEmailHtml(otp),
    });

    return NextResponse.json({
      success: true,
      data: { message: "OTP sent to your email", isNewUser: true },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
