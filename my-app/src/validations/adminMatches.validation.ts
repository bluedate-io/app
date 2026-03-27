import { z } from "zod";

export const adminMatchIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Match id required"),
});

export type AdminMatchIdParams = z.infer<typeof adminMatchIdParamsSchema>;

export function parseAdminMatchIdParams(params: unknown): AdminMatchIdParams {
  return adminMatchIdParamsSchema.parse(params);
}

