// ─── AdminOnboardingReminderService — BCC batch reminders for incomplete onboarding

import nodemailer from "nodemailer";
import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma, UserRole } from "@/generated/prisma/client";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/utils/errors";

const log = logger.child("AdminOnboardingReminderService");

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
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:800;color:${BG};letter-spacing:-0.5px;">bluedate</p>
          </td>
        </tr>
        ${body}
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

function buildOnboardingReminderHtml(onboardingUrl: string): string {
  const inner = `
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:${DARK};font-family:Georgia,serif;">Finish your profile</p>
    <p style="margin:0 0 24px;font-size:14px;color:${MUTED};line-height:1.6;">
      You started joining bluedate but haven&rsquo;t finished onboarding yet. It only takes a few minutes &mdash; add your details and photos so we can match you thoughtfully.
    </p>
    ${ctaButton("Continue onboarding", onboardingUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:${MUTED};line-height:1.6;">
      If you didn&rsquo;t sign up for bluedate, you can ignore this message.
    </p>
  `;
  return wrap(`<tr><td style="padding:32px;">${inner}</td></tr>`);
}

function buildOnboardingReminderText(onboardingUrl: string): string {
  return [
    "Finish your bluedate profile",
    "",
    "You started joining bluedate but haven't finished onboarding yet. Continue here:",
    onboardingUrl,
    "",
    "If you didn't sign up for bluedate, you can ignore this message.",
    "",
    "— bluedate",
  ].join("\n");
}

const RECENT_SENDS_LIMIT = 20;

/** Safe user id fragment for raw SQL (cuid-style). */
function sanitizeUserIdsForStats(userIds: string[]): string[] {
  return [...new Set(userIds)].filter(
    (id) => typeof id === "string" && id.length >= 10 && id.length <= 36 && /^[a-z0-9]+$/i.test(id),
  );
}

export class AdminOnboardingReminderService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly db: PrismaClient) {
    if (config.email.smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpPort === 465,
        auth: { user: config.email.smtpUser, pass: config.email.smtpPass },
      });
    }
  }

  private async getReminderStatsForUserIds(
    userIds: string[],
  ): Promise<Map<string, { reminderCount: number; lastReminderSentAt: string | null }>> {
    const map = new Map<string, { reminderCount: number; lastReminderSentAt: string | null }>();
    for (const id of userIds) {
      map.set(id, { reminderCount: 0, lastReminderSentAt: null });
    }
    const sanitized = sanitizeUserIdsForStats(userIds);
    if (sanitized.length === 0) return map;

    const rows = await this.db.$queryRaw<
      { userId: string; reminderCount: number; lastReminderSentAt: Date | null }[]
    >`
      SELECT u.uid AS "userId",
             COUNT(s.id)::int AS "reminderCount",
             MAX(s."sentAt") AS "lastReminderSentAt"
      FROM unnest(ARRAY[${Prisma.join(sanitized.map((id) => Prisma.sql`${id}`))}]::text[]) AS u(uid)
      LEFT JOIN "admin_onboarding_reminder_sends" s ON s."recipientUserIds" @> ARRAY[u.uid]::text[]
      GROUP BY u.uid
    `;

    for (const row of rows) {
      map.set(row.userId, {
        reminderCount: row.reminderCount,
        lastReminderSentAt: row.lastReminderSentAt
          ? row.lastReminderSentAt.toISOString()
          : null,
      });
    }
    return map;
  }

  async getRecentSendsWithRecipients(limit = RECENT_SENDS_LIMIT) {
    const rows = await this.db.adminOnboardingReminderSend.findMany({
      orderBy: { sentAt: "desc" },
      take: limit,
      select: {
        id: true,
        sentAt: true,
        recipientCount: true,
        recipientUserIds: true,
        sentBy: { select: { profile: { select: { fullName: true } } } },
      },
    });

    const allRecipientIds = [...new Set(rows.flatMap((r) => r.recipientUserIds))];
    const users =
      allRecipientIds.length === 0
        ? []
        : await this.db.user.findMany({
            where: { id: { in: allRecipientIds } },
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          });
    const byId = new Map(users.map((u) => [u.id, u]));

    return rows.map((row) => ({
      id: row.id,
      sentAt: row.sentAt.toISOString(),
      recipientCount: row.recipientCount,
      sentByName: row.sentBy.profile?.fullName ?? null,
      recipients: row.recipientUserIds.map((userId) => {
        const u = byId.get(userId);
        return {
          userId,
          fullName: u?.profile?.fullName ?? null,
          email: u?.email ?? null,
        };
      }),
    }));
  }

  private incompleteUsersWhere(search: string): Prisma.UserWhereInput {
    const base: Prisma.UserWhereInput = {
      role: { not: UserRole.admin },
      onboardingCompleted: false,
    };
    const trimmed = search.trim();
    if (!trimmed) return base;
    return {
      AND: [
        base,
        {
          OR: [
            { email: { contains: trimmed, mode: "insensitive" } },
            { profile: { is: { fullName: { contains: trimmed, mode: "insensitive" } } } },
          ],
        },
      ],
    };
  }

  async listIncompleteUsers(
    page: number,
    pageSize: number,
    opts: { q?: string; sort?: string } = {},
  ) {
    const search = (opts.q ?? "").trim();
    const rawSort = opts.sort ?? "joined_desc";
    const sort =
      rawSort === "joined_asc" ||
      rawSort === "reminders_desc" ||
      rawSort === "reminders_asc"
        ? rawSort
        : "joined_desc";

    const skip = (page - 1) * pageSize;
    const where = this.incompleteUsersWhere(search);
    const total = await this.db.user.count({ where });

    const userSelect = {
      id: true,
      email: true,
      createdAt: true,
      profile: { select: { fullName: true } },
    } as const;

    type ListUserRow = {
      id: string;
      email: string | null;
      createdAt: Date;
      profile: { fullName: string | null } | null;
    };

    let orderedUsers: ListUserRow[];

    if (sort === "joined_desc" || sort === "joined_asc") {
      orderedUsers = await this.db.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: sort === "joined_desc" ? "desc" : "asc" },
        select: userSelect,
      });
    } else {
      const rcOrder =
        sort === "reminders_desc"
          ? Prisma.sql`DESC NULLS LAST`
          : Prisma.sql`ASC NULLS LAST`;
      const pattern = search ? `%${search}%` : null;

      type IdRow = { id: string };
      let idRows: IdRow[];

      if (pattern) {
        idRows = await this.db.$queryRaw<IdRow[]>`
          SELECT u.id
          FROM users u
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS rc
            FROM "admin_onboarding_reminder_sends" s
            WHERE s."recipientUserIds" @> ARRAY[u.id]::text[]
          ) AS counts ON true
          WHERE u.role <> 'admin'::"UserRole"
            AND u."onboardingCompleted" = false
            AND (
              u.email ILIKE ${pattern}
              OR EXISTS (
                SELECT 1 FROM profiles p
                WHERE p."userId" = u.id AND p."fullName" ILIKE ${pattern}
              )
            )
          ORDER BY counts.rc ${rcOrder}, u."createdAt" DESC
          LIMIT ${pageSize} OFFSET ${skip}
        `;
      } else {
        idRows = await this.db.$queryRaw<IdRow[]>`
          SELECT u.id
          FROM users u
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS rc
            FROM "admin_onboarding_reminder_sends" s
            WHERE s."recipientUserIds" @> ARRAY[u.id]::text[]
          ) AS counts ON true
          WHERE u.role <> 'admin'::"UserRole"
            AND u."onboardingCompleted" = false
          ORDER BY counts.rc ${rcOrder}, u."createdAt" DESC
          LIMIT ${pageSize} OFFSET ${skip}
        `;
      }

      const ids = idRows.map((r) => r.id);
      if (ids.length === 0) {
        return { total, users: [], page, pageSize, q: search, sort };
      }

      const users = await this.db.user.findMany({
        where: { id: { in: ids } },
        select: userSelect,
      });
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      orderedUsers = [...users].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
      );
    }

    const stats = await this.getReminderStatsForUserIds(orderedUsers.map((u) => u.id));
    const usersWithReminders = orderedUsers.map((u) => {
      const s = stats.get(u.id) ?? { reminderCount: 0, lastReminderSentAt: null };
      return {
        ...u,
        reminderCount: s.reminderCount,
        lastReminderSentAt: s.lastReminderSentAt,
      };
    });

    return { total, users: usersWithReminders, page, pageSize, q: search, sort };
  }

  async getLastSend() {
    const row = await this.db.adminOnboardingReminderSend.findFirst({
      orderBy: { sentAt: "desc" },
      include: {
        sentBy: { select: { profile: { select: { fullName: true } } } },
      },
    });
    if (!row) return null;
    return {
      sentAt: row.sentAt.toISOString(),
      recipientCount: row.recipientCount,
      sentByName: row.sentBy.profile?.fullName ?? null,
    };
  }

  /**
   * All batches that included this user in BCC (newest first).
   * User must exist and not be an admin.
   */
  async getReminderHistoryForUser(userId: string) {
    const sanitized = sanitizeUserIdsForStats([userId]);
    if (sanitized.length !== 1) {
      throw new BadRequestError("Invalid user id.");
    }

    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { fullName: true } },
      },
    });
    if (!user) throw new NotFoundError("User", userId);
    if (user.role === UserRole.admin) {
      throw new ForbiddenError();
    }

    const sends = await this.db.adminOnboardingReminderSend.findMany({
      where: { recipientUserIds: { has: userId } },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        sentAt: true,
        recipientCount: true,
        sentBy: { select: { profile: { select: { fullName: true } } } },
      },
    });

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

    const users = await this.db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingCompleted: true,
      },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestError("One or more users were not found.");
    }

    const valid: { id: string; email: string }[] = [];
    for (const u of users) {
      if (u.role === UserRole.admin || u.onboardingCompleted || !u.email?.trim()) {
        throw new BadRequestError(
          "Some selected users cannot receive this email (admin, onboarding already complete, or missing email).",
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
    const onboardingUrl = `${base}/onboarding`;
    const html = buildOnboardingReminderHtml(onboardingUrl);
    const text = buildOnboardingReminderText(onboardingUrl);

    if (!this.transporter) {
      log.info(
        `[DEV] Onboarding reminder not sent — no SMTP. Would BCC ${recipientCount} address(es) for ${recipientUserIds.length} user(s).`,
      );
      throw new BadRequestError(
        "Email is not configured (SMTP_HOST). Reminders cannot be sent until SMTP is set up.",
      );
    }

    try {
      await this.transporter.sendMail({
        from: `"bluedate" <${config.email.fromAddress}>`,
        to: config.email.fromAddress,
        bcc,
        subject: "Complete your bluedate profile",
        text,
        html,
      });
    } catch (error) {
      log.error("Failed to send onboarding reminder batch", { error });
      throw new BadRequestError("Failed to send email. Check SMTP configuration and try again.");
    }

    await this.db.adminOnboardingReminderSend.create({
      data: {
        sentByUserId,
        recipientCount,
        recipientUserIds,
      },
    });

    log.info("Onboarding reminder batch sent", {
      sentByUserId,
      recipientCount,
      userCount: recipientUserIds.length,
    });

    return { sentCount: recipientCount };
  }
}
