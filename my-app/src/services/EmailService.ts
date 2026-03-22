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
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly db: PrismaClient) {
    if (config.email.smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpPort === 465,
        auth: {
          user: config.email.smtpUser,
          pass: config.email.smtpPass,
        },
      });
    }
  }

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

    if (!this.transporter) {
      log.info(`[DEV] Email OTP for ${email}: ${code} (expires ${expiresAt.toISOString()})`);
      console.log(`\n📧 [DEV] OTP for ${email} → ${code}\n`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"bluedate" <${config.email.fromAddress}>`,
        to: email,
        subject: "Your bluedate verification code",
        text: `Your verification code is ${code}. It expires in ${config.auth.otpTtlMinutes} minutes.`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EDE8D5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDE8D5;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border:2.5px solid #2B1A07;border-radius:18px;box-shadow:5px 5px 0 #2B1A07;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#2B1A07;padding:24px 32px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:800;color:#EDE8D5;letter-spacing:-0.5px;">bluedate</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#2B1A07;font-family:Georgia,serif;">Verify your email</p>
            <p style="margin:0 0 28px;font-size:14px;color:#7A6A54;line-height:1.6;">
              Use the code below to complete your sign in. It expires in ${config.auth.otpTtlMinutes} minutes.
            </p>
            <!-- OTP box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#EDE8D5;border:2.5px solid #2B1A07;border-radius:14px;box-shadow:4px 4px 0 #2B1A07;padding:24px;text-align:center;">
                  <span style="font-family:Georgia,serif;font-size:40px;font-weight:800;letter-spacing:14px;color:#2B1A07;">${code}</span>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;color:#7A6A54;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.<br/>
              Never share this code with anyone.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1.5px solid #2B1A0715;padding:16px 32px;">
            <p style="margin:0;font-size:12px;color:#9B8B78;">© bluedate · campus dating, thoughtfully done</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
