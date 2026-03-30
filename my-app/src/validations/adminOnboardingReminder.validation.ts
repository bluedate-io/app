import { z } from "zod";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;
const SEARCH_MAX = 200;

const sortSchema = z.enum([
  "joined_desc",
  "joined_asc",
  "reminders_desc",
  "reminders_asc",
]);

export type OnboardingIncompleteListSort = z.infer<typeof sortSchema>;

export function parseOnboardingIncompleteListQuery(searchParams: URLSearchParams) {
  const rawPage = searchParams.get("page");
  const rawPageSize = searchParams.get("pageSize");
  const page = Math.max(1, rawPage ? parseInt(rawPage, 10) || 1 : 1);
  let pageSize = rawPageSize ? parseInt(rawPageSize, 10) || PAGE_SIZE_DEFAULT : PAGE_SIZE_DEFAULT;
  pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize));

  const rawQ = searchParams.get("q")?.trim() ?? "";
  const q = rawQ.slice(0, SEARCH_MAX);

  const rawSort = searchParams.get("sort") ?? "joined_desc";
  const sortParsed = sortSchema.safeParse(rawSort);
  const sort = sortParsed.success ? sortParsed.data : "joined_desc";

  return { page, pageSize, q, sort };
}

const sendByIdsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "Select at least one user."),
});

const sendAllMatchingSchema = z.object({
  selectAllMatching: z.literal(true),
  q: z.string().max(SEARCH_MAX).optional(),
});

/** Normalizes POST body: either legacy `{ userIds }` or `{ selectAllMatching, q? }`. */
export function parseOnboardingIncompleteSendBody(body: unknown):
  | { kind: "userIds"; userIds: string[] }
  | { kind: "selectAllMatching"; q: string } {
  const raw = body as Record<string, unknown> | null;
  if (raw && raw.selectAllMatching === true) {
    const parsed = sendAllMatchingSchema.parse(raw);
    return { kind: "selectAllMatching", q: (parsed.q ?? "").trim().slice(0, SEARCH_MAX) };
  }
  const parsed = sendByIdsSchema.parse(body);
  return { kind: "userIds", userIds: [...new Set(parsed.userIds)] };
}
