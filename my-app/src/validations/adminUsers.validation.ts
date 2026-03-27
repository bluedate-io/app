import { z } from "zod";
import { ADMIN_GENDER_OPTIONS, parseAdminUserSort } from "@/lib/adminUserStep";

function parseCsvLower(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function parseGenders(raw: string | null): (typeof ADMIN_GENDER_OPTIONS)[number][] {
  if (!raw?.trim()) return [];
  const allowed = new Set<string>(ADMIN_GENDER_OPTIONS);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((g) => allowed.has(g)) as (typeof ADMIN_GENDER_OPTIONS)[number][];
}

function parseOptInStatus(raw: string | null): AdminOptInStatusQuery {
  if (raw === "opted_in" || raw === "opted_out" || raw === "opted_in_late") return raw;
  return "all" as const;
}

export type AdminOptInStatusQuery = "opted_in" | "opted_out" | "opted_in_late" | "all";

export const adminUsersQuerySchema = z.object({
  completed: z.enum(["true", "false"]).optional(),
});

export const adminUserDetailParamsSchema = z.object({
  userId: z.string().trim().min(1, "Missing user id"),
});

export const adminUsersExportQuerySchema = z.object({
  filter: z.enum(["all", "completed", "incomplete"]).default("all"),
  sort: z.string().optional().transform((v) => parseAdminUserSort(v)),
  q: z.string().optional().default(""),
  optInStatus: z.string().optional(),
  domains: z.string().optional(),
  genders: z.string().optional(),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type AdminUserDetailParams = z.infer<typeof adminUserDetailParamsSchema>;
export type AdminUsersExportQuery = ReturnType<typeof parseAdminUsersExportQuery>;

export function parseAdminUsersQuery(sp: URLSearchParams): AdminUsersQuery {
  return adminUsersQuerySchema.parse({ completed: sp.get("completed") ?? undefined });
}

export function parseAdminUserDetailParams(params: unknown): AdminUserDetailParams {
  return adminUserDetailParamsSchema.parse(params);
}

export function parseAdminUsersExportQuery(sp: URLSearchParams) {
  const parsed = adminUsersExportQuerySchema.parse({
    filter: sp.get("filter") ?? "all",
    sort: sp.get("sort") ?? undefined,
    q: sp.get("q") ?? "",
    optInStatus: sp.get("optInStatus") ?? undefined,
    domains: sp.get("domains") ?? undefined,
    genders: sp.get("genders") ?? undefined,
  });
  return {
    filter: parsed.filter,
    sort: parsed.sort,
    q: parsed.q.trim(),
    optInStatus: parseOptInStatus(parsed.optInStatus ?? null),
    activeDomains: parseCsvLower(parsed.domains ?? null),
    activeGenders: parseGenders(parsed.genders ?? null),
  };
}
