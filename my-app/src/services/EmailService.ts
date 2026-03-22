// ─── EmailService ──────────────────────────────────────────────────────────────
// Generates, stores, and sends email OTPs.
// In development (no SMTP configured) the OTP is printed to console.

import crypto from "crypto";
import nodemailer from "nodemailer";
import type { PrismaClient } from "@/generated/prisma/client";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { OtpSendFailedError, OtpInvalidError } from "@/utils/errors";

const log = logger.child("EmailService");

export interface IEmailService {
  sendOtp(email: string): Promise<void>;
  verifyOtp(email: string, code: string): Promise<void>;
}

export class EmailService implements IEmailService {
  constructor(private readonly db: PrismaClient) {}

  // ── Send 6-digit OTP to email ─────────────────────────────────────────────

  async sendOtp(email: string): Promise<void> {
    // Invalidate any existing unused OTPs for this email
    await this.db.emailOtp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + config.auth.otpTtlMinutes * 60 * 1000);

    await this.db.emailOtp.create({ data: { email, code, expiresAt } });

    if (config.isDev && !config.email.smtpHost) {
      log.info(`[DEV] Email OTP for ${email}: ${code} (expires ${expiresAt.toISOString()})`);
      console.log(`\n📧 [DEV] OTP for ${email} → ${code}\n`);
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpPort === 465,
        auth: {
          user: config.email.smtpUser,
          pass: config.email.smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"bluedate" <${config.email.fromAddress}>`,
        to: email,
        subject: "Your bluedate verification code",
        text: `Your verification code is ${code}. It expires in ${config.auth.otpTtlMinutes} minutes.`,
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;">
            <h2 style="color:#8F3A8F;margin-bottom:8px;">bluedate</h2>
            <p style="color:#333;font-size:16px;margin-bottom:24px;">
              Your verification code is:
            </p>
            <div style="background:#f5f0ff;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#2d2d2d;">${code}</span>
            </div>
            <p style="color:#666;font-size:14px;">
              This code expires in ${config.auth.otpTtlMinutes} minutes.<br/>
              If you didn&apos;t request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      log.info("OTP email sent", { email });
    } catch (error) {
      log.error("Failed to send OTP email", { email, error });
      throw new OtpSendFailedError("Failed to send verification email. Please try again.");
    }
  }

  // ── Verify OTP code ───────────────────────────────────────────────────────

  async verifyOtp(email: string, code: string): Promise<void> {
    const otp = await this.db.emailOtp.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      log.warn("OTP invalid or expired", { email });
      throw new OtpInvalidError();
    }

    await this.db.emailOtp.update({ where: { id: otp.id }, data: { used: true } });
    log.info("OTP verified", { email });
  }
}
