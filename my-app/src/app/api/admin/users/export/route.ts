// ─── Admin users CSV export ───────────────────────────────────────────────────
// GET /api/admin/users/export?filter=&domains=&genders=&sort=&q=&optInStatus=
// Returns a CSV file containing all matching users (no pagination) with full
// profile data and photo URLs.

import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { Prisma } from "@/generated/prisma/client";
import { config } from "@/config";
import db from "@/lib/db";
import {
  ADMIN_GENDER_OPTIONS,
  adminUserOrderBy,
  computeAdminUserStep,
  parseAdminUserSort,
} from "@/lib/adminUserStep";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function csvCell(v: string | number | boolean | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}

// ─── Param parsing (mirrors page.tsx) ────────────────────────────────────────

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

function parseOptInStatus(raw: string | null) {
  if (raw === "opted_in" || raw === "opted_out" || raw === "opted_in_late") return raw;
  return "all" as const;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Parse filters
  const sp = req.nextUrl.searchParams;
  const filterRaw = sp.get("filter") ?? "all";
  const filter = filterRaw === "completed" || filterRaw === "incomplete" ? filterRaw : "all";
  const sort = parseAdminUserSort(sp.get("sort") ?? undefined);
  const optInStatus = parseOptInStatus(sp.get("optInStatus"));
  const activeGenders = parseGenders(sp.get("genders"));
  const domainTokens = parseCsvLower(sp.get("domains"));
  const q = sp.get("q")?.trim() ?? "";

  // Validate domains against DB
  const collegeDomains = await db.collegeDomain.findMany();
  const allowedSet = new Set(collegeDomains.map((d) => d.domain.toLowerCase()));
  const activeDomains = domainTokens.filter((d) => allowedSet.has(d));

  // Build where clause
  const and: Prisma.UserWhereInput[] = [{ role: { not: "admin" } }];

  if (filter === "completed") and.push({ onboardingCompleted: true });
  else if (filter === "incomplete") and.push({ onboardingCompleted: false });

  if (activeDomains.length > 0) {
    and.push({
      OR: activeDomains.map((domain) => ({
        email: { endsWith: `@${domain}`, mode: "insensitive" },
      })),
    });
  }

  if (activeGenders.length > 0) {
    and.push({ preferences: { is: { genderIdentity: { in: [...activeGenders] } } } });
  }

  if (optInStatus !== "all") {
    and.push({ optInStatus });
  }

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

  // Fetch all matching users (no pagination)
  const users = await db.user.findMany({
    where,
    include: {
      profile: {
        select: { fullName: true, nickname: true, dateOfBirth: true, age: true, city: true, bio: true },
      },
      preferences: {
        select: {
          genderIdentity: true,
          genderPreference: true,
          ageRangeMin: true,
          ageRangeMax: true,
          relationshipIntent: true,
          relationshipGoals: true,
          heightCm: true,
          wantDate: true,
        },
      },
      interests: {
        select: {
          id: true,
          hobbies: true,
          favouriteActivities: true,
          musicTaste: true,
          foodTaste: true,
        },
      },
      personality: {
        select: {
          id: true,
          smokingHabit: true,
          drinkingHabit: true,
          funFact: true,
          kidsStatus: true,
          kidsPreference: true,
          religion: true,
          politics: true,
          relationshipStatus: true,
        },
      },
      availability: { select: { days: true, times: true } },
      photos: { select: { url: true }, orderBy: { order: "asc" } },
      _count: { select: { photos: true } },
    },
    orderBy,
  });

  // Build CSV
  const HEADERS = [
    "ID",
    "Name",
    "Nickname",
    "Email",
    "Phone",
    "College",
    "City",
    "Date of Birth",
    "Age",
    "Bio",
    "Gender",
    "Gender Preference",
    "Looking For",
    "Relationship Goals",
    "Age Range",
    "Height (cm)",
    "Want Date",
    "Hobbies",
    "Favourite Activities",
    "Music",
    "Food",
    "Smoking Habit",
    "Drinking Habit",
    "Fun Fact",
    "Kids Status",
    "Kids Preference",
    "Religion",
    "Politics",
    "Relationship Status",
    "Availability Days",
    "Availability Times",
    "Onboarding Step",
    "Onboarding Completed",
    "Opt-in Status",
    "Opted In At",
    "Last Matched At",
    "Joined At",
    "Photo 1",
    "Photo 2",
    "Photo 3",
    "Photo 4",
  ];

  const lines: string[] = [csvRow(HEADERS)];

  for (const u of users) {
    const step = computeAdminUserStep(u);
    const photos = u.photos.map((p) => p.url);
    lines.push(
      csvRow([
        u.id,
        u.profile?.fullName,
        u.profile?.nickname,
        u.email,
        u.phone,
        u.collegeName,
        u.profile?.city,
        u.profile?.dateOfBirth?.toISOString().slice(0, 10),
        u.profile?.age,
        u.profile?.bio,
        u.preferences?.genderIdentity,
        u.preferences?.genderPreference?.join("; "),
        u.preferences?.relationshipIntent,
        u.preferences?.relationshipGoals?.join("; "),
        u.preferences?.ageRangeMin != null && u.preferences?.ageRangeMax != null
          ? `${u.preferences.ageRangeMin}–${u.preferences.ageRangeMax}`
          : null,
        u.preferences?.heightCm,
        u.preferences?.wantDate != null ? (u.preferences.wantDate ? "Yes" : "No") : null,
        u.interests?.hobbies?.join("; "),
        u.interests?.favouriteActivities?.join("; "),
        u.interests?.musicTaste?.join("; "),
        u.interests?.foodTaste?.join("; "),
        u.personality?.smokingHabit,
        u.personality?.drinkingHabit,
        u.personality?.funFact,
        u.personality?.kidsStatus,
        u.personality?.kidsPreference,
        u.personality?.religion?.join("; "),
        u.personality?.politics?.join("; "),
        u.personality?.relationshipStatus,
        u.availability?.days?.join("; "),
        u.availability?.times?.join("; "),
        step,
        u.onboardingCompleted ? "Yes" : "No",
        u.optInStatus,
        u.optedInAt?.toISOString(),
        u.lastMatchedAt?.toISOString(),
        u.createdAt.toISOString(),
        photos[0],
        photos[1],
        photos[2],
        photos[3],
      ]),
    );
  }

  const csv = lines.join("\n");
  const filename = `bluedate-users-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
