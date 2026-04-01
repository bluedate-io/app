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
  search: z
    .string()
    .optional()
    .default("")
    .transform((s) => s.trim())
    .pipe(z.string().max(120)),
  relationshipIntent: z
    .string()
    .optional()
    .default("")
    .transform((s) => s.trim())
    .refine((s) => s === "" || s === "date" || s === "friendship", {
      message: "relationshipIntent must be empty, date, or friendship",
    }),
});

export type AdminMatchPoolQuery = z.infer<typeof adminMatchPoolQuerySchema>;

export function parseAdminMatchPoolQuery(sp: URLSearchParams): AdminMatchPoolQuery {
  return adminMatchPoolQuerySchema.parse({
    gender: sp.get("gender") ?? "",
    city: sp.get("city") ?? "",
    college: sp.get("college") ?? "",
    ageMin: sp.get("ageMin") ?? undefined,
    ageMax: sp.get("ageMax") ?? undefined,
    search: sp.get("search") ?? "",
    relationshipIntent: sp.get("relationshipIntent") ?? "",
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
    search: sp.get("search") ?? "",
    relationshipIntent: sp.get("relationshipIntent") ?? "",
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
  s3CardUrl: z
    .string()
    .trim()
    .min(1, "Match card image is required")
    .pipe(z.string().url("Match card image must be a valid URL")),
});

export type AdminMatchCreateBody = z.infer<typeof adminMatchCreateBodySchema>;

export function parseAdminMatchCreateBody(body: unknown): AdminMatchCreateBody {
  return adminMatchCreateBodySchema.parse(body);
}

export const adminMatchDeleteCardBodySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Image URL is required")
    .pipe(z.string().url("Image URL must be valid")),
});

export type AdminMatchDeleteCardBody = z.infer<typeof adminMatchDeleteCardBodySchema>;

export function parseAdminMatchDeleteCardBody(body: unknown): AdminMatchDeleteCardBody {
  return adminMatchDeleteCardBodySchema.parse(body);
}
