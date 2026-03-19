import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import UsersTable from "./UsersTable";
import AdminShell from "../AdminShell";

const PAGE_SIZE = 20;

async function getUsers(filter: "all" | "completed" | "incomplete", page: number) {
  const where =
    filter === "completed"
      ? { onboardingCompleted: true }
      : filter === "incomplete"
        ? { onboardingCompleted: false }
        : undefined;

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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const rows = users
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

  return { rows, total };
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
  searchParams: Promise<{ filter?: string; page?: string }>;
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

  const { filter: rawFilter, page: rawPage } = await searchParams;
  const filter: Filter =
    rawFilter === "completed" || rawFilter === "incomplete" ? rawFilter : "all";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const { rows, total } = await getUsers(filter, page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
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

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(["all", "completed", "incomplete"] as const).map((f) => (
            <a
              key={f}
              href={f === "all" ? "/admin/users" : `/admin/users?filter=${f}`}
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
        />
      </div>
    </AdminShell>
  );
}
