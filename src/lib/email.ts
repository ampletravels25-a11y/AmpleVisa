import { APP_NAME } from "./constants";

// Email sending utility
// Uses Resend in production, logs to console in development

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@amplevisa.com>`,
      to,
      subject,
      html,
    });
  }

  // Development: log to console
  console.log(`\n📧 Email to: ${to}\n   Subject: ${subject}\n   Body: ${html}\n`);
  return { id: "dev-" + Date.now() };
}

export function otpEmailHtml(otp: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1E40AF;">${APP_NAME}</h2>
      <p>Your verification code is:</p>
      <div style="background: #F0F4FF; padding: 20px; text-align: center; border-radius: 8px; margin: 16px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1E40AF;">${otp}</span>
      </div>
      <p style="color: #64748B; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;
}
