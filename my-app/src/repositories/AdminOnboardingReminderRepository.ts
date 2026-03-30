// ─── AdminOnboardingReminderRepository — persistence for incomplete-onboarding reminders

import { Prisma, UserRole, type PrismaClient } from "@/generated/prisma/client";
import { ADMIN_GENDER_OPTIONS } from "@/lib/adminUserStep";

const USER_SELECT_LIST = {
  id: true,
  email: true,
  createdAt: true,
  profile: { select: { fullName: true } },
  preferences: { select: { genderIdentity: true } },
} as const;

export type IncompleteUserListRow = {
  id: string;
  email: string | null;
  createdAt: Date;
  profile: { fullName: string | null } | null;
  preferences: { genderIdentity: string | null } | null;
};

/** Safe user id fragment for raw SQL (cuid-style). */
function sanitizeUserIdsForStats(userIds: string[]): string[] {
  return [...new Set(userIds)].filter(
    (id) => typeof id === "string" && id.length >= 10 && id.length <= 36 && /^[a-z0-9]+$/i.test(id),
  );
}

export class AdminOnboardingReminderRepository {
  constructor(private readonly db: PrismaClient) {}

  private static readonly ONBOARDING_REMINDER_GENDER_NOT_PROVIDED =
    "__not_provided__";

  private isAllowedGender(g: string): g is (typeof ADMIN_GENDER_OPTIONS)[number] {
    return ADMIN_GENDER_OPTIONS.includes(g as (typeof ADMIN_GENDER_OPTIONS)[number]);
  }

  /** Optional filter on `preferences.genderIdentity` (Woman | Man | Nonbinary | Not provided). */
  private normalizeGenderFilter(gender?: string): string | undefined {
    const g = gender?.trim();
    if (!g) return undefined;
    if (g === AdminOnboardingReminderRepository.ONBOARDING_REMINDER_GENDER_NOT_PROVIDED) {
      return g;
    }
    return this.isAllowedGender(g) ? g : undefined;
  }

  private incompleteUsersWhere(search: string, gender?: string): Prisma.UserWhereInput {
    const parts: Prisma.UserWhereInput[] = [
      { role: { not: UserRole.admin }, onboardingCompleted: false },
    ];
    const g = this.normalizeGenderFilter(gender);
    if (g) {
      if (g === AdminOnboardingReminderRepository.ONBOARDING_REMINDER_GENDER_NOT_PROVIDED) {
        // Include users where preferences row doesn't exist OR where genderIdentity is null.
        parts.push({
          OR: [
            { preferences: { is: null } },
            { preferences: { is: { genderIdentity: null } } },
          ],
        });
      } else {
        parts.push({ preferences: { is: { genderIdentity: g } } });
      }
    }
    const trimmed = search.trim();
    if (trimmed) {
      parts.push({
        OR: [
          { email: { contains: trimmed, mode: "insensitive" } },
          { profile: { is: { fullName: { contains: trimmed, mode: "insensitive" } } } },
        ],
      });
    }
    return parts.length === 1 ? parts[0]! : { AND: parts };
  }

  private emailableIncompleteWhere(search: string, gender?: string): Prisma.UserWhereInput {
    return {
      AND: [
        this.incompleteUsersWhere(search, gender),
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

  async getEmailableIncompleteUserIds(q: string, gender?: string): Promise<string[]> {
    const search = q.trim();
    const rows = await this.db.user.findMany({
      where: this.emailableIncompleteWhere(search, gender),
      select: { id: true, email: true },
    });
    return rows.filter((r) => r.email?.trim()).map((r) => r.id);
  }

  async listIncompleteUsers(
    page: number,
    pageSize: number,
    opts: { q?: string; sort?: string; gender?: string } = {},
  ) {
    const search = (opts.q ?? "").trim();
    const genderParam = this.normalizeGenderFilter(opts.gender);
    const genderEcho = genderParam ?? "";
    const rawSort = opts.sort ?? "joined_desc";
    const sort =
      rawSort === "joined_asc" ||
      rawSort === "reminders_desc" ||
      rawSort === "reminders_asc"
        ? rawSort
        : "joined_desc";

    const skip = (page - 1) * pageSize;
    const where = this.incompleteUsersWhere(search, genderParam);
    const [total, emailableRows] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({
        where: this.emailableIncompleteWhere(search, genderParam),
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
      const genderSql =
        genderParam != null
          ? genderParam === AdminOnboardingReminderRepository.ONBOARDING_REMINDER_GENDER_NOT_PROVIDED
            ? Prisma.sql`AND (
                NOT EXISTS (
                  SELECT 1 FROM preferences pr WHERE pr."userId" = u.id
                )
                OR EXISTS (
                  SELECT 1 FROM preferences pr
                  WHERE pr."userId" = u.id AND pr."genderIdentity" IS NULL
                )
              )`
            : Prisma.sql`AND EXISTS (
                SELECT 1 FROM preferences pr
                WHERE pr."userId" = u.id AND pr."genderIdentity" = ${genderParam}
              )`
          : Prisma.sql``;

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
            ${genderSql}
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
            ${genderSql}
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
          gender: genderEcho,
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
      gender: genderEcho,
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
