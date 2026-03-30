// ─── AdminOnboardingReminderRepository — persistence for incomplete-onboarding reminders

import { Prisma, UserRole, type PrismaClient } from "@/generated/prisma/client";

const USER_SELECT_LIST = {
  id: true,
  email: true,
  createdAt: true,
  profile: { select: { fullName: true } },
} as const;

export type IncompleteUserListRow = {
  id: string;
  email: string | null;
  createdAt: Date;
  profile: { fullName: string | null } | null;
};

/** Safe user id fragment for raw SQL (cuid-style). */
function sanitizeUserIdsForStats(userIds: string[]): string[] {
  return [...new Set(userIds)].filter(
    (id) => typeof id === "string" && id.length >= 10 && id.length <= 36 && /^[a-z0-9]+$/i.test(id),
  );
}

export class AdminOnboardingReminderRepository {
  constructor(private readonly db: PrismaClient) {}

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

  private emailableIncompleteWhere(search: string): Prisma.UserWhereInput {
    return {
      AND: [
        this.incompleteUsersWhere(search),
        { email: { not: null } },
        { NOT: { email: { equals: "" } } },
      ],
    };
  }

  async getReminderStatsForUserIds(
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

  async findRecentSendsWithRecipients(limit: number) {
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

  async getEmailableIncompleteUserIds(q: string): Promise<string[]> {
    const search = q.trim();
    const rows = await this.db.user.findMany({
      where: this.emailableIncompleteWhere(search),
      select: { id: true, email: true },
    });
    return rows.filter((r) => r.email?.trim()).map((r) => r.id);
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
    const [total, emailableRows] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({
        where: this.emailableIncompleteWhere(search),
        select: { email: true },
      }),
    ]);
    const emailableTotal = emailableRows.filter((r) => r.email?.trim()).length;

    let orderedUsers: IncompleteUserListRow[];

    if (sort === "joined_desc" || sort === "joined_asc") {
      orderedUsers = await this.db.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: sort === "joined_desc" ? "desc" : "asc" },
        select: USER_SELECT_LIST,
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
        return {
          total,
          emailableTotal,
          users: [],
          page,
          pageSize,
          q: search,
          sort,
        };
      }

      const users = await this.db.user.findMany({
        where: { id: { in: ids } },
        select: USER_SELECT_LIST,
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

    return {
      total,
      emailableTotal,
      users: usersWithReminders,
      page,
      pageSize,
      q: search,
      sort,
    };
  }

  async findLastSend() {
    return this.db.adminOnboardingReminderSend.findFirst({
      orderBy: { sentAt: "desc" },
      include: {
        sentBy: { select: { profile: { select: { fullName: true } } } },
      },
    });
  }

  findUserForReminderHistory(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { fullName: true } },
      },
    });
  }

  findSendsHavingRecipient(userId: string) {
    return this.db.adminOnboardingReminderSend.findMany({
      where: { recipientUserIds: { has: userId } },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        sentAt: true,
        recipientCount: true,
        sentBy: { select: { profile: { select: { fullName: true } } } },
      },
    });
  }

  findUsersForReminderSend(userIds: string[]) {
    return this.db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingCompleted: true,
      },
    });
  }

  createReminderSend(data: {
    sentByUserId: string;
    recipientCount: number;
    recipientUserIds: string[];
  }) {
    return this.db.adminOnboardingReminderSend.create({ data });
  }
}
