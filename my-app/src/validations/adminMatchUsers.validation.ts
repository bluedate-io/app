import { z } from "zod";

const intString = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((v) => {
      const n = Number.parseInt(v ?? "", 10);
      return Number.isNaN(n) ? fallback : n;
    });

export const adminMatchUsersPageQuerySchema = z.object({
  page: intString(1).transform((n) => Math.max(1, n)),
  limit: intString(20).transform((n) => Math.min(50, Math.max(1, n))),
});

export const adminMatchUsersSuggestionsQuerySchema = z.object({
  userId: z.string().trim().min(1, "userId required"),
});

export const adminMatchUsersSkipBodySchema = z.object({
  userId1: z.string().trim().min(1, "userId1 and userId2 required"),
  userId2: z.string().trim().min(1, "userId1 and userId2 required"),
});

export const adminMatchUsersCreateBodySchema = z.object({
  userId1: z.string().trim().min(1, "userId1 and userId2 required"),
  userId2: z.string().trim().min(1, "userId1 and userId2 required"),
  blurb: z.string().nullable().optional(),
  cardImageUrl: z.string().nullable().optional(),
});

export type AdminMatchUsersPageQuery = z.infer<typeof adminMatchUsersPageQuerySchema>;
export type AdminMatchUsersSuggestionsQuery = z.infer<typeof adminMatchUsersSuggestionsQuerySchema>;
export type AdminMatchUsersSkipBody = z.infer<typeof adminMatchUsersSkipBodySchema>;
export type AdminMatchUsersCreateBody = z.infer<typeof adminMatchUsersCreateBodySchema>;

export function parseAdminMatchUsersPageQuery(sp: URLSearchParams): AdminMatchUsersPageQuery {
  return adminMatchUsersPageQuerySchema.parse({
    page: sp.get("page") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  });
}

export function parseAdminMatchUsersSuggestionsQuery(
  sp: URLSearchParams,
): AdminMatchUsersSuggestionsQuery {
  return adminMatchUsersSuggestionsQuerySchema.parse({
    userId: sp.get("userId") ?? "",
  });
}

export function parseAdminMatchUsersSkipBody(body: unknown): AdminMatchUsersSkipBody {
  return adminMatchUsersSkipBodySchema.parse(body);
}

export function parseAdminMatchUsersCreateBody(body: unknown): AdminMatchUsersCreateBody {
  return adminMatchUsersCreateBodySchema.parse(body);
}
