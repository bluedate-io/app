// ─── TwilioService ────────────────────────────────────────────────────────────
// Uses Twilio Verify — Twilio manages code generation, delivery, expiry, and
// rate-limiting. No OTP storage needed on our side.

import twilio from "twilio";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { OtpSendFailedError, OtpInvalidError } from "@/utils/errors";

const log = logger.child("TwilioService");

export interface ITwilioService {
  sendVerification(phone: string): Promise<void>;
  checkVerification(phone: string, code: string): Promise<void>;
  sendWhatsAppMessage(toPhone: string, body: string): Promise<void>;
}

export class TwilioService implements ITwilioService {
  private readonly client: ReturnType<typeof twilio>;
  private readonly serviceSid: string;

  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.serviceSid = config.twilio.verifyServiceSid;
  }

  // ── Send OTP via Twilio Verify ─────────────────────────────────────────────

  async sendVerification(phone: string): Promise<void> {
    // In development log a reminder — Twilio still sends the real SMS
    // (Twilio test credentials will silently succeed without charging)
    if (config.isDev) {
      log.info(`[DEV] Sending Twilio Verify OTP to ${phone}`);
    }

    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({ to: phone, channel: "sms" });

      log.info("Verification sent", { phone, status: verification.status });
    } catch (error) {
      log.error("Failed to send verification", { phone, error });
      throw new OtpSendFailedError();
    }
  }

  // ── Check OTP via Twilio Verify ────────────────────────────────────────────

  async checkVerification(phone: string, code: string): Promise<void> {
    try {
      const check = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({ to: phone, code });

      if (check.status !== "approved") {
        log.warn("OTP check failed", { phone, status: check.status });
        throw new OtpInvalidError();
      }

      log.info("OTP approved", { phone });
    } catch (error) {
      if (error instanceof OtpInvalidError) throw error;
      log.error("Verification check error", { phone, error });
      throw new OtpInvalidError();
    }
  }

  // ── Send WhatsApp message (e.g. invite code) ──────────────────────────────────

  async sendWhatsAppMessage(toPhone: string, body: string): Promise<void> {
    const to = toPhone.startsWith("+") ? toPhone : `+${toPhone}`;
    const toWhatsApp = `whatsapp:${to}`;
    const from = config.twilio.whatsappNumber;
    try {
      await this.client.messages.create({
        from,
        to: toWhatsApp,
        body,
      });
      log.info("WhatsApp message sent", { to: toWhatsApp });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = error && typeof error === "object" && "code" in error ? (error as { code: number }).code : undefined;
      log.error("Failed to send WhatsApp message", { to: toWhatsApp, message, code });
      throw new OtpSendFailedError("Failed to send WhatsApp message.");
    }
  }
}
