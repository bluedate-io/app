import type { Prisma } from "@/generated/prisma/client";
import { ADMIN_GENDER_OPTIONS, adminUserOrderBy, computeAdminUserStep } from "@/lib/adminUserStep";
import { AdminUsersRepository } from "@/repositories/AdminUsersRepository";
import type { AdminUsersExportQuery } from "@/validations/adminUsers.validation";
import { NotFoundError } from "@/utils/errors";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

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

export class AdminUsersService {
  constructor(private readonly repo: AdminUsersRepository) {}

  async listUsers(completed?: "true" | "false") {
    const onboardingWhere =
      completed === "true"
        ? { onboardingCompleted: true }
        : completed === "false"
          ? { onboardingCompleted: false }
          : {};

    const users = await this.repo.findUsers({
      role: { not: "admin" },
      ...onboardingWhere,
    });

    return users.map((u) => ({
      id: u.id,
      phone: u.phone,
      name: u.profile?.fullName ?? "—",
      city: u.profile?.city ?? "—",
      gender: u.preferences?.genderIdentity ?? "—",
      step: computeAdminUserStep(u),
      completed: u.onboardingCompleted,
      joinedAt: u.createdAt.toISOString(),
    }));
  }

  async getUser(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user || user.role === "admin") throw new NotFoundError("User", userId);

    const hobbies = user.interests?.hobbies?.filter((h) => h && h !== "Not specified") ?? [];
    const goals = user.preferences?.relationshipGoals?.filter(Boolean) ?? [];
    const religionList = user.personality?.religion?.filter(Boolean) ?? [];

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      collegeName: user.collegeName,
      photoUrl: user.photos[0]?.url ?? null,
      name: user.profile?.fullName ?? null,
      nickname: user.profile?.nickname ?? null,
      city: user.profile?.city ?? null,
      age: calcAge(user.profile?.dateOfBirth ?? null),
      gender: user.preferences?.genderIdentity ?? null,
      interests: hobbies,
      lookingFor: goals.length ? goals.join(", ") : null,
      heightCm: user.preferences?.heightCm ?? null,
      smokingHabit: user.personality?.smokingHabit ?? null,
      drinkingHabit: user.personality?.drinkingHabit ?? null,
      smoking: user.personality?.smokingHabit ?? null,
      drinking: user.personality?.drinkingHabit ?? null,
      religion: religionList.length ? religionList.join(", ") : null,
      familyPlans: user.personality?.kidsStatus ?? null,
      kidsPreference: user.personality?.kidsPreference ?? null,
    };
  }

  async exportUsers(query: AdminUsersExportQuery) {
    const collegeDomains = await this.repo.findAllCollegeDomains();
    const allowedSet = new Set(collegeDomains.map((d) => d.domain.toLowerCase()));
    const activeDomains = query.activeDomains.filter((d) => allowedSet.has(d));

    const and: Prisma.UserWhereInput[] = [{ role: { not: "admin" } }];
    if (query.filter === "completed") and.push({ onboardingCompleted: true });
    else if (query.filter === "incomplete") and.push({ onboardingCompleted: false });
    if (activeDomains.length > 0) {
      and.push({
        OR: activeDomains.map((domain) => ({
          email: { endsWith: `@${domain}`, mode: "insensitive" },
        })),
      });
    }
    if (query.activeGenders.length > 0) {
      const allowed = new Set<string>(ADMIN_GENDER_OPTIONS);
      and.push({
        preferences: { is: { genderIdentity: { in: query.activeGenders.filter((g) => allowed.has(g)) } } },
      });
    }
    if (query.optInStatus !== "all") and.push({ optInStatus: query.optInStatus });
    if (query.q) {
      and.push({
        OR: [
          { email: { contains: query.q, mode: "insensitive" } },
          { profile: { is: { fullName: { contains: query.q, mode: "insensitive" } } } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = { AND: and };
    const users = await this.repo.findUsersForExport(where, adminUserOrderBy(query.sort));

    const headers = [
      "ID", "Name", "Nickname", "Email", "Phone", "College", "City", "Date of Birth", "Age", "Bio",
      "Gender", "Gender Preference", "Looking For", "Relationship Goals", "Age Range", "Height (cm)",
      "Want Date", "Hobbies", "Favourite Activities", "Music", "Food", "Smoking Habit", "Drinking Habit",
      "Fun Fact", "Kids Status", "Kids Preference", "Religion", "Politics", "Relationship Status",
      "Availability Days", "Availability Times", "Onboarding Step", "Onboarding Completed",
      "Opt-in Status", "Opted In At", "Last Matched At", "Joined At", "Photo 1", "Photo 2", "Photo 3", "Photo 4",
    ];

    const lines: string[] = [csvRow(headers)];
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

    return {
      csv: lines.join("\n"),
      filename: `bluedate-users-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }
}
