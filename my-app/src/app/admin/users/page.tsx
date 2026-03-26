import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import type { Prisma } from "@/generated/prisma/client";
import { config } from "@/config";
import db from "@/lib/db";
import {
  ADMIN_GENDER_OPTIONS,
  adminUserOrderBy,
  buildAdminUsersHref,
  computeAdminUserStep,
  parseAdminUserSort,
  type AdminOptInStatusFilter,
  type AdminUserSort,
} from "@/lib/adminUserStep";
import UsersTable from "./UsersTable";
import AdminShell from "../AdminShell";

const PAGE_SIZE = 20;

type Filter = "all" | "completed" | "incomplete";

function parseOptInStatus(raw: string | undefined): AdminOptInStatusFilter {
  if (raw === "opted_in" || raw === "opted_out" || raw === "opted_in_late") return raw;
  return "all";
}

function parseCsvLower(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseGenders(raw: string | undefined): (typeof ADMIN_GENDER_OPTIONS)[number][] {
  if (!raw?.trim()) return [];
  const allowed = new Set<string>(ADMIN_GENDER_OPTIONS);
  const out: (typeof ADMIN_GENDER_OPTIONS)[number][] = [];
  for (const g of raw.split(",").map((s) => s.trim())) {
    if (allowed.has(g)) out.push(g as (typeof ADMIN_GENDER_OPTIONS)[number]);
  }
  return out;
}

async function getUsers(
  filter: Filter,
  page: number,
  allowedDomains: { domain: string }[],
  activeDomains: string[],
  activeGenders: (typeof ADMIN_GENDER_OPTIONS)[number][],
  sort: AdminUserSort,
  search: string,
  optInStatus: AdminOptInStatusFilter,
) {
  const allowedSet = new Set(allowedDomains.map((d) => d.domain.toLowerCase()));
  const domainsFiltered = activeDomains.filter((d) => allowedSet.has(d));

  const and: Prisma.UserWhereInput[] = [{ role: { not: "admin" } }];

  if (filter === "completed") and.push({ onboardingCompleted: true });
  else if (filter === "incomplete") and.push({ onboardingCompleted: false });

  if (domainsFiltered.length > 0) {
    and.push({
      OR: domainsFiltered.map((domain) => ({
        email: { endsWith: `@${domain}`, mode: "insensitive" },
      })),
    });
  }

  if (activeGenders.length > 0) {
    and.push({
      preferences: { is: { genderIdentity: { in: [...activeGenders] } } },
    });
  }

  if (optInStatus !== "all") {
    and.push({ optInStatus });
  }

  const q = search.trim();
  if (q) {
    and.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { profile: { is: { fullName: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }

  const where: Prisma.UserWhereInput = { AND: and };
  const orderBy = adminUserOrderBy(sort);

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: {
        profile: { select: { fullName: true, city: true } },
        preferences: { select: { genderIdentity: true } },
        interests: { select: { id: true } },
        personality: { select: { id: true } },
        _count: { select: { photos: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const rows = users.map((u) => ({
    id: u.id,
    phone: u.phone,
    email: u.email,
    name: u.profile?.fullName ?? "—",
    city: u.profile?.city ?? "—",
    gender: u.preferences?.genderIdentity ?? "—",
    step: computeAdminUserStep(u),
    completed: u.onboardingCompleted,
    optInStatus: (u.optInStatus as string) ?? "opted_out",
    joinedAt: u.createdAt.toISOString(),
  }));

  return { rows, total };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    page?: string;
    domains?: string;
    genders?: string;
    sort?: string;
    q?: string;
    optInStatus?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  const sp = await searchParams;
  const filter: Filter =
    sp.filter === "completed" || sp.filter === "incomplete" ? sp.filter : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = parseAdminUserSort(sp.sort);
  const optInStatus = parseOptInStatus(sp.optInStatus);

  const [collegeDomains, rawDomainTokens] = await Promise.all([
    db.collegeDomain.findMany({ orderBy: { collegeName: "asc" } }),
    Promise.resolve(parseCsvLower(sp.domains)),
  ]);

  const activeGenders = parseGenders(sp.genders);
  const allowedDomainLower = new Set(collegeDomains.map((d) => d.domain.toLowerCase()));
  const activeDomains = rawDomainTokens.filter((d) => allowedDomainLower.has(d));

  const appliedSearch = sp.q?.trim() ?? "";

  const domainsCsvForToolbar =
    activeDomains.length > 0 ? activeDomains.join(",") : sp.domains?.trim() ?? "";
  const gendersCsvForToolbar =
    activeGenders.length > 0 ? activeGenders.join(",") : sp.genders?.trim() ?? "";

  const { rows, total } = await getUsers(
    filter,
    page,
    collegeDomains,
    activeDomains,
    activeGenders,
    sort,
    appliedSearch,
    optInStatus,
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const tabHref = (f: Filter) =>
    buildAdminUsersHref({
      filter: f,
      page: 1,
      domainsCsv: domainsCsvForToolbar || undefined,
      gendersCsv: gendersCsvForToolbar || undefined,
      sort,
      q: appliedSearch || undefined,
      optInStatus,
    });

  /** Clears Email/Phone, Gender, and Step column filters; keeps onboarding tab; page 1. */
  const resetAllColumnFiltersHref = buildAdminUsersHref({
    filter,
    page: 1,
  });

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold mb-0.5"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#1A0A2E" }}
          >
            Users
          </h1>
          <p className="text-sm" style={{ color: "#9B87B0" }}>
            {total} total
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {(["all", "completed", "incomplete"] as const).map((f) => (
            <a
              key={f}
              href={tabHref(f)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition"
              style={
                filter === f
                  ? { background: "linear-gradient(135deg,#8F3A8F,#C060C0)", color: "#fff" }
                  : { backgroundColor: "#EDE8F7", color: "#6B5E7A" }
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </a>
          ))}
        </div>

        <UsersTable
          users={rows}
          page={page}
          totalPages={totalPages}
          filter={filter}
          domainsCsv={domainsCsvForToolbar}
          gendersCsv={gendersCsvForToolbar}
          sort={sort}
          collegeDomains={collegeDomains}
          initialDomainsCsv={domainsCsvForToolbar}
          initialGendersCsv={gendersCsvForToolbar}
          q={appliedSearch}
          optInStatus={optInStatus}
          resetAllFiltersHref={resetAllColumnFiltersHref}
        />
      </div>
    </AdminShell>
  );
}
