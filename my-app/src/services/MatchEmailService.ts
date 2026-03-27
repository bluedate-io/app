// ─── MatchEmailService ────────────────────────────────────────────────────────
// Sends the four opt-in related emails:
//   1. Post-match       — sent after admin creates a match
//   2. Monday reminder  — "opt in before Friday" (cron)
//   3. Thursday reminder — "last chance tonight" (cron)
//   4. Late opt-in confirmation — sent when user opts in after Friday cutoff

import nodemailer from "nodemailer";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { generateOptInToken } from "@/utils/optInToken";

const log = logger.child("MatchEmailService");

type UserEmailTarget = {
  id: string;
  email: string;
  name: string;
  cardImageUrl?: string;
  otherPersonEmail?: string | null;
  otherPersonPhone?: string | null;
};

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const SUBTLE = "#9B8B78";

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="max-width:480px;width:100%;background:#fff;border:2.5px solid ${DARK};border-radius:18px;box-shadow:5px 5px 0 ${DARK};overflow:hidden;">
        <!-- header -->
        <tr>
          <td style="background:${DARK};padding:24px 32px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:800;color:${BG};letter-spacing:-0.5px;">bluedate</p>
          </td>
        </tr>
        <!-- body -->
        ${body}
        <!-- footer -->
        <tr>
          <td style="border-top:1.5px solid ${DARK}15;padding:16px 32px;">
            <p style="margin:0;font-size:12px;color:${SUBTLE};">© bluedate · campus dating, thoughtfully done</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <a href="${url}"
          style="display:inline-block;padding:14px 28px;background:${ACCENT};color:#fff;
            font-family:Georgia,serif;font-size:15px;font-weight:700;text-decoration:none;
            border-radius:12px;border:2.5px solid ${DARK};box-shadow:3px 3px 0 ${DARK};"
        >${text}</a>
      </td>
    </tr>
  </table>`;
}

function bodyRow(content: string): string {
  return `<tr><td style="padding:32px;">${content}</td></tr>`;
}

function buildWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return null;
  return `https://wa.me/${digitsOnly}`;
}

// ─── Service class ────────────────────────────────────────────────────────────

export class MatchEmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.email.smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpPort === 465,
        auth: { user: config.email.smtpUser, pass: config.email.smtpPass },
      });
    }
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private optInUrl(userId: string): string {
    const token = generateOptInToken(userId);
    return `${config.app.url}/api/optin?token=${encodeURIComponent(token)}`;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      log.info(`[DEV] Email suppressed — no SMTP. Would send to ${to}: "${subject}"`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"bluedate" <${config.email.fromAddress}>`,
        to,
        subject,
        html,
      });
      log.info("Email sent", { to, subject });
    } catch (err) {
      log.error("Failed to send email", { to, subject, err });
      throw err;
    }
  }

  // ── 1. Post-match email ────────────────────────────────────────────────────
  // Sent to both users right after admin creates a match.

  async sendPostMatchEmail(user: UserEmailTarget): Promise<void> {
    const whatsappUrl = buildWhatsAppUrl(user.otherPersonPhone);
    const mailUrl = user.otherPersonEmail ? `mailto:${user.otherPersonEmail}` : null;
    const cardHtml = user.cardImageUrl
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td style="border-radius:12px;overflow:hidden;border:2px solid ${DARK};">
              <img src="${user.cardImageUrl}" alt="Your match card" width="100%" style="display:block;max-width:100%;border-radius:10px;" />
            </td>
          </tr>
        </table>`
      : "";
    const contactDetailsHtml =
      user.otherPersonEmail || whatsappUrl
        ? `<div style="margin:0 0 24px;border:2.5px solid ${DARK};border-radius:18px;box-shadow:5px 5px 0 ${DARK};overflow:hidden;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${BG};border:2px solid ${DARK};border-radius:12px;padding:16px;">
                  <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:0.8px;">
                    Match contact details
                  </p>
                  ${
                    whatsappUrl
                      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                          <tr>
                            <td>
                              <a href="${whatsappUrl}"
                                style="display:block;width:100%;box-sizing:border-box;padding:14px 16px;background:#25D366;color:#0E2018;
                                  text-align:center;font-size:16px;font-weight:700;text-decoration:none;
                                  border-radius:12px;border:2.5px solid ${DARK};box-shadow:3px 3px 0 ${DARK};"
                              >Message on WhatsApp</a>
                            </td>
                          </tr>
                        </table>`
                      : ""
                  }
                  ${
                    mailUrl
                      ? `<table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <a href="${mailUrl}"
                                style="display:block;width:100%;box-sizing:border-box;padding:14px 16px;background:#D96431;color:#fff;
                                  text-align:center;font-size:16px;font-weight:700;text-decoration:none;
                                  border-radius:12px;border:2.5px solid ${DARK};box-shadow:3px 3px 0 ${DARK};"
                              >Mail Contact</a>
                            </td>
                          </tr>
                        </table>`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </div>`
        : "";
    const html = wrap(
      bodyRow(`
        <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Hey ${user.name},</p>
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:${DARK};font-family:Georgia,serif;">
          Your match is out! 🎉
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:${MUTED};line-height:1.6;">
          We've found someone special for you this week. Check it out in the app.
        </p>
        ${cardHtml}
        ${contactDetailsHtml}
      `),
    );
    await this.send(user.email, "Your match contact details are here 🎉", html);
  }

  // ── 2. Monday reminder ─────────────────────────────────────────────────────
  // Sent to all opted_out users on Monday morning IST.

  async sendMondayReminder(user: UserEmailTarget): Promise<void> {
    const url = this.optInUrl(user.id);
    const html = wrap(
      bodyRow(`
        <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Hey ${user.name},</p>
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:${DARK};font-family:Georgia,serif;">
          Matches lock this Friday 🔒
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:${MUTED};line-height:1.6;">
          The opt-in window for this week is open. Don't miss your match.
        </p>
        <p style="margin:0 0 28px;font-size:14px;color:${DARK};line-height:1.6;">
          Click below to secure your spot in this week's matching.
          It only takes a second.
        </p>
        ${ctaButton("Opt in for this week", url)}
        <p style="margin:20px 0 0;font-size:11px;color:${SUBTLE};line-height:1.6;">
          This link is unique to you. Don't share it.
        </p>
      `),
    );
    await this.send(user.email, "Matches lock Friday — opt in now", html);
  }

  // ── 3. Thursday reminder ───────────────────────────────────────────────────
  // Sent to all opted_out users on Thursday evening IST.

  async sendThursdayReminder(user: UserEmailTarget): Promise<void> {
    const url = this.optInUrl(user.id);
    const html = wrap(
      bodyRow(`
        <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Hey ${user.name},</p>
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:${DARK};font-family:Georgia,serif;">
          Last chance to opt in — closes tonight 🎯
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:${MUTED};line-height:1.6;">
          The matching window closes at midnight tonight. This is your final reminder.
        </p>
        <p style="margin:0 0 28px;font-size:14px;color:${DARK};line-height:1.6;">
          One click and you're in for this Friday's matching round.
        </p>
        ${ctaButton("Opt in now", url)}
        <p style="margin:20px 0 0;font-size:11px;color:${SUBTLE};line-height:1.6;">
          This link is unique to you. Don't share it.
        </p>
      `),
    );
    await this.send(user.email, "Last chance to opt in before tonight", html);
  }

  // ── 4. Late opt-in confirmation ────────────────────────────────────────────
  // Sent when a user clicks the opt-in link after the Friday cutoff.

  async sendLateOptInConfirmation(user: { email: string; name: string }): Promise<void> {
    const html = wrap(
      bodyRow(`
        <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Hey ${user.name},</p>
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:${DARK};font-family:Georgia,serif;">
          You're in — prioritized for next week 🎯
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:${MUTED};line-height:1.6;">
          You opted in after this week's cutoff, so this week's round is already locked.
        </p>
        <p style="margin:0 0 0;font-size:14px;color:${DARK};line-height:1.6;">
          We've put you at the top of the list for <strong>next Friday's</strong> matching round.
          You don't need to do anything else — we'll email you when your match is ready.
        </p>
      `),
    );
    await this.send(
      user.email,
      "You're in — prioritized for next week's match",
      html,
    );
  }
}
