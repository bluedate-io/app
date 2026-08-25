// ─── AdminOptInReminderService — BCC batch reminders for weekly opt-in ────────

import nodemailer from "nodemailer";
import { UserRole } from "@/generated/prisma/client";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import type { AdminOptInReminderRepository } from "@/repositories/AdminOptInReminderRepository";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/utils/errors";

const log = logger.child("AdminOptInReminderService");

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
        <tr>
          <td style="background:${DARK};padding:24px 32px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:800;color:${BG};letter-spacing:-0.5px;">Tryren</p>
          </td>
        </tr>
        ${body}
        <tr>
          <td style="border-top:1.5px solid ${DARK}15;padding:16px 32px;">
            <p style="margin:0;font-size:12px;color:${SUBTLE};">© Tryren · campus dating, thoughtfully done</p>
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

function buildOptInReminderHtml(optInUrl: string): string {
  const inner = `
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:${DARK};font-family:Georgia,serif;">Opt in this week</p>
    <p style="margin:0 0 24px;font-size:14px;color:${MUTED};line-height:1.6;">
      You&rsquo;re on Tryren but haven&rsquo;t opted in for this week&rsquo;s matchmaking yet. Opt in before Friday midnight IST and we&rsquo;ll find you a curated match.
    </p>
    ${ctaButton("Opt In Now", optInUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:${MUTED};line-height:1.6;">
      If you&rsquo;re not interested right now, you can safely ignore this message.
    </p>
  `;
  return wrap(`<tr><td style="padding:32px;">${inner}</td></tr>`);
}

function buildOptInReminderText(optInUrl: string): string {
  return [
    "Opt in for this week's Tryren match",
    "",
    "You're on Tryren but haven't opted in for this week's matchmaking yet. Opt in before Friday midnight IST and we'll find you a curated match.",
    "",
    "Opt in here:",
    optInUrl,
    "",
    "If you're not interested right now, you can safely ignore this message.",
    "",
    "— Tryren",
  ].join("\n");
}

const RECENT_SENDS_LIMIT = 20;

/** Safe user id fragment for stats (cuid-style). */
function sanitizeUserIdForHistory(userId: string): string | null {
  if (
    typeof userId === "string" &&
    userId.length >= 10 &&
    userId.length <= 36 &&
    /^[a-z0-9]+$/i.test(userId)
  ) {
    return userId;
  }
  return null;
}

export class AdminOptInReminderService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly repo: AdminOptInReminderRepository) {
    if (config.email.smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpPort === 465,
        auth: { user: config.email.smtpUser, pass: config.email.smtpPass },
      });
    }
  }

  async getRecentSendsWithRecipients(limit = RECENT_SENDS_LIMIT) {
    return this.repo.findRecentSendsWithRecipients(limit);
  }

  async sendRemindersForMatchingFilter(
    sentByUserId: string,
    q: string,
    gender = "",
  ): Promise<{ sentCount: number }> {
    const userIds = await this.repo.getEmailableNotOptedInUserIds(q, gender);
    if (userIds.length === 0) {
      throw new BadRequestError("No users with email match the current filter.");
    }
    return this.sendReminders(sentByUserId, userIds);
  }

  listNotOptedInUsers(
    page: number,
    pageSize: number,
    opts: { q?: string; sort?: string; gender?: string } = {},
  ) {
    return this.repo.listNotOptedInUsers(page, pageSize, opts);
  }

  async getLastSend() {
    const row = await this.repo.findLastSend();
    if (!row) return null;
    return {
      sentAt: row.sentAt.toISOString(),
      recipientCount: row.recipientCount,
      sentByName: row.sentBy.profile?.fullName ?? null,
    };
  }

  async getReminderHistoryForUser(userId: string) {
    const sanitized = sanitizeUserIdForHistory(userId);
    if (!sanitized) {
      throw new BadRequestError("Invalid user id.");
    }

    const user = await this.repo.findUserForReminderHistory(userId);
    if (!user) throw new NotFoundError("User", userId);
    if (user.role === UserRole.admin) {
      throw new ForbiddenError();
    }

    const sends = await this.repo.findSendsHavingRecipient(userId);

    return {
      user: {
        id: user.id,
        fullName: user.profile?.fullName ?? null,
        email: user.email,
      },
      events: sends.map((s) => ({
        id: s.id,
        sentAt: s.sentAt.toISOString(),
        batchBccCount: s.recipientCount,
        sentByName: s.sentBy.profile?.fullName ?? null,
      })),
    };
  }

  async sendReminders(sentByUserId: string, userIds: string[]): Promise<{ sentCount: number }> {
    if (userIds.length === 0) {
      throw new BadRequestError("Select at least one user.");
    }

    const users = await this.repo.findUsersForReminderSend(userIds);

    if (users.length !== userIds.length) {
      throw new BadRequestError("One or more users were not found.");
    }

    const valid: { id: string; email: string }[] = [];
    for (const u of users) {
      if (u.role === UserRole.admin || !u.onboardingCompleted || !u.email?.trim()) {
        throw new BadRequestError(
          "Some selected users cannot receive this email (admin, incomplete onboarding, or missing email).",
        );
      }
      valid.push({ id: u.id, email: u.email.trim() });
    }

    const seen = new Set<string>();
    const bcc: string[] = [];
    for (const v of valid) {
      const key = v.email.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        bcc.push(v.email);
      }
    }

    const recipientUserIds = valid.map((v) => v.id);
    const recipientCount = bcc.length;

    const base = config.app.url.replace(/\/$/, "");
    const optInUrl = `${base}/home`;
    const html = buildOptInReminderHtml(optInUrl);
    const text = buildOptInReminderText(optInUrl);

    if (!this.transporter) {
      log.info(
        `[DEV] Opt-in reminder not sent — no SMTP. Would BCC ${recipientCount} address(es) for ${recipientUserIds.length} user(s).`,
      );
      throw new BadRequestError(
        "Email is not configured (SMTP_HOST). Reminders cannot be sent until SMTP is set up.",
      );
    }

    try {
      await this.transporter.sendMail({
        from: `"Tryren" <${config.email.fromAddress}>`,
        to: config.email.fromAddress,
        bcc,
        subject: "Opt in for this week's Tryren match",
        text,
        html,
      });
    } catch (error) {
      log.error("Failed to send opt-in reminder batch", { error });
      throw new BadRequestError("Failed to send email. Check SMTP configuration and try again.");
    }

    await this.repo.createReminderSend({
      sentByUserId,
      recipientCount,
      recipientUserIds,
    });

    log.info("Opt-in reminder batch sent", {
      sentByUserId,
      recipientCount,
      userCount: recipientUserIds.length,
    });

    return { sentCount: recipientCount };
  }
}
