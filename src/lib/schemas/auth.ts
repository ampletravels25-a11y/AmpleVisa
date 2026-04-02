import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const adminVerify2faSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6, "2FA code must be 6 digits"),
});

export type EmailInput = z.infer<typeof emailSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
