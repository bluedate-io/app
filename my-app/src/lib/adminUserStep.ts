// ─── Admin user list — onboarding funnel step label ─────────────────────────

export type AdminUserStepInput = {
  onboardingCompleted: boolean;
  profile: { fullName: string | null } | null;
  preferences: { genderIdentity: string | null } | null;
  interests: { id: string } | null;
  personality: { id: string } | null;
  _count: { photos: number };
};

export function computeAdminUserStep(u: AdminUserStepInput): string {
  if (u.onboardingCompleted) return "Complete";
  if (u._count.photos >= 2) return "Photos";
  if (u.personality) return "Habits";
  if (u.interests) return "Interests";
  if (u.preferences) return "Preferences";
  if (u.profile) return "Profile";
  return "New";
}

export const ADMIN_GENDER_OPTIONS = ["Woman", "Man", "Nonbinary"] as const;

export type AdminUserSort =
  | "joined_desc"
  | "joined_asc"
  | "completed_first"
  | "incomplete_first";

export function parseAdminUserSort(raw: string | undefined): AdminUserSort {
  if (
    raw === "joined_asc" ||
    raw === "completed_first" ||
    raw === "incomplete_first"
  ) {
    return raw;
  }
  return "joined_desc";
}

export function adminUserOrderBy(sort: AdminUserSort) {
  switch (sort) {
    case "joined_asc":
      return { createdAt: "asc" as const };
    case "completed_first":
      return [{ onboardingCompleted: "desc" as const }, { createdAt: "desc" as const }];
    case "incomplete_first":
      return [{ onboardingCompleted: "asc" as const }, { createdAt: "desc" as const }];
    default:
      return { createdAt: "desc" as const };
  }
}

export type AdminUsersFilterTab = "all" | "completed" | "incomplete";

export type AdminOptInStatusFilter = "opted_in" | "opted_out" | "opted_in_late" | "all";

export function buildAdminUsersHref(opts: {
  filter: AdminUsersFilterTab;
  page?: number;
  domainsCsv?: string;
  gendersCsv?: string;
  sort?: AdminUserSort;
  /** Case-insensitive match on email or profile full name */
  q?: string;
  optInStatus?: AdminOptInStatusFilter;
}): string {
  const p = new URLSearchParams();
  if (opts.filter !== "all") p.set("filter", opts.filter);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  if (opts.domainsCsv?.trim()) p.set("domains", opts.domainsCsv.trim());
  if (opts.gendersCsv?.trim()) p.set("genders", opts.gendersCsv.trim());
  if (opts.sort && opts.sort !== "joined_desc") p.set("sort", opts.sort);
  if (opts.q?.trim()) p.set("q", opts.q.trim());
  if (opts.optInStatus && opts.optInStatus !== "all") p.set("optInStatus", opts.optInStatus);
  const qs = p.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}
