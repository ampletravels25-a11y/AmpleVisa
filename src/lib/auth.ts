import { cookies } from "next/headers";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./db";
import {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  SESSION_DURATION_EMPLOYEE,
  SESSION_DURATION_ADMIN,
} from "./constants";
import type { UserRole } from "@/generated/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

// ─── OTP ─────────────────────────────────────────────────

export function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

export async function createOtp(userId: string, otp: string) {
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  return prisma.otpCode.create({
    data: {
      userId,
      code: hashedOtp,
      expiresAt,
    },
  });
}

export async function verifyOtp(userId: string, otp: string): Promise<boolean> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) return false;

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    return false;
  }

  const isValid = await bcrypt.compare(otp, otpRecord.code);

  if (isValid) {
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });
    return true;
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { attempts: otpRecord.attempts + 1 },
  });

  return false;
}

// ─── Password (Admin) ───────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Sessions ───────────────────────────────────────────

export function createToken(payload: { userId: string; role: UserRole }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; role: UserRole } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: UserRole) {
  const token = createToken({ userId, role });
  const duration =
    role === "EMPLOYEE" ? SESSION_DURATION_EMPLOYEE : SESSION_DURATION_ADMIN;
  const expiresAt = new Date(Date.now() + duration);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { company: true, profile: true },
  });

  if (!user || user.status !== "ACTIVE") return null;

  return { user, session };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete("session_token");
  }
}

// ─── Company Domain Matching ────────────────────────────

export function extractDomain(email: string): string {
  return email.split("@")[1].toLowerCase();
}

export async function getOrCreateCompany(email: string) {
  const domain = extractDomain(email);

  let company = await prisma.company.findUnique({
    where: { domain },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1),
        domain,
        status: "PENDING_VERIFICATION",
      },
    });
  }

  return company;
}
