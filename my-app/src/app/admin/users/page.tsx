import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import UsersTable from "./UsersTable";

async function getUsers(filter: "all" | "completed" | "incomplete") {
  const users = await db.user.findMany({
    where:
      filter === "completed"
        ? { onboardingCompleted: true }
        : filter === "incomplete"
          ? { onboardingCompleted: false }
          : undefined,
    include: {
      profile: { select: { fullName: true, city: true } },
      preferences: { select: { genderIdentity: true } },
      interests: { select: { id: true } },
      personality: { select: { id: true } },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return users
    .filter((u) => u.role !== "admin")
    .map((u) => ({
      id: u.id,
      phone: u.phone,
      name: u.profile?.fullName ?? "—",
      city: u.profile?.city ?? "—",
      gender: u.preferences?.genderIdentity ?? "—",
      step: computeStep(u),
      completed: u.onboardingCompleted,
      joinedAt: u.createdAt.toISOString(),
    }));
}

function computeStep(u: {
  onboardingCompleted: boolean;
  profile: { fullName: string | null } | null;
  preferences: { genderIdentity: string | null } | null;
  interests: { id: string } | null;
  personality: { id: string } | null;
  _count: { photos: number };
}): string {
  if (u.onboardingCompleted) return "Complete";
  if (u._count.photos >= 2) return "Photos";
  if (u.personality) return "Habits";
  if (u.interests) return "Interests";
  if (u.preferences) return "Preferences";
  if (u.profile) return "Profile";
  return "New";
}

type Filter = "all" | "completed" | "incomplete";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  const { filter: rawFilter } = await searchParams;
  const filter: Filter =
    rawFilter === "completed" || rawFilter === "incomplete" ? rawFilter : "all";

  const users = await getUsers(filter);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FBF8F6" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Users
          </h1>
          <p className="text-sm text-gray-500">{users.length} total</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "completed", "incomplete"] as const).map((f) => (
            <a
              key={f}
              href={f === "all" ? "/admin/users" : `/admin/users?filter=${f}`}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition"
              style={
                filter === f
                  ? { backgroundColor: "#8F3A8F", color: "#fff" }
                  : { backgroundColor: "#E0E0E0", color: "#444" }
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </a>
          ))}
        </div>

        <UsersTable users={users} />
      </div>
    </main>
  );
}
