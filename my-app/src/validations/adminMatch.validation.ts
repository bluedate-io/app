import { z } from "zod";
import { parseCsvParam } from "@/domains/adminMatchmaking";

const optionalAge = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s === "") return undefined;
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? undefined : n;
  });

export const adminMatchPoolQuerySchema = z.object({
  gender: z.string().optional().default(""),
  city: z.string().optional().default(""),
  college: z.string().optional().default(""),
  ageMin: optionalAge,
  ageMax: optionalAge,
});

export type AdminMatchPoolQuery = z.infer<typeof adminMatchPoolQuerySchema>;

export function parseAdminMatchPoolQuery(sp: URLSearchParams): AdminMatchPoolQuery {
  return adminMatchPoolQuerySchema.parse({
    gender: sp.get("gender") ?? "",
    city: sp.get("city") ?? "",
    college: sp.get("college") ?? "",
    ageMin: sp.get("ageMin") ?? undefined,
    ageMax: sp.get("ageMax") ?? undefined,
  });
}

export const adminMatchCandidatesQuerySchema = adminMatchPoolQuerySchema.extend({
  userId: z.string().trim().min(1, "userId is required"),
  gender: z.string().optional().default(""),
});

export type AdminMatchCandidatesQuery = z.infer<typeof adminMatchCandidatesQuerySchema>;

export function parseAdminMatchCandidatesQuery(sp: URLSearchParams): AdminMatchCandidatesQuery {
  return adminMatchCandidatesQuerySchema.parse({
    userId: sp.get("userId") ?? "",
    gender: sp.get("gender") ?? "",
    city: sp.get("city") ?? "",
    college: sp.get("college") ?? "",
    ageMin: sp.get("ageMin") ?? undefined,
    ageMax: sp.get("ageMax") ?? undefined,
  });
}

export function csvFromPoolQuery(q: AdminMatchPoolQuery | AdminMatchCandidatesQuery): {
  cities: string[];
  colleges: string[];
  genderFilterRaw: string[];
} {
  return {
    cities: parseCsvParam(q.city || null),
    colleges: parseCsvParam(q.college || null),
    genderFilterRaw: parseCsvParam(q.gender || null),
  };
}

export const adminMatchCreateBodySchema = z.object({
  userAId: z.string().trim().min(1, "userAId is required"),
  userBId: z.string().trim().min(1, "userBId is required"),
  s3CardUrl: z.string().trim().min(1, "s3CardUrl is required"),
});

export type AdminMatchCreateBody = z.infer<typeof adminMatchCreateBodySchema>;

export function parseAdminMatchCreateBody(body: unknown): AdminMatchCreateBody {
  return adminMatchCreateBodySchema.parse(body);
}
