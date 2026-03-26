import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import AdminShell from "../AdminShell";
import MatchView from "./MatchView";

export default async function AdminMatchPage() {
  // Auth
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  // Fetch distinct cities and colleges for filter dropdowns.
  // Use collegeDomain as source-of-truth since matching/filtering is domain-based.
  const [profilesRaw, collegeDomainRows] = await Promise.all([
    db.profile.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    db.collegeDomain.findMany({
      select: { collegeName: true },
      orderBy: { collegeName: "asc" },
    }),
  ]);

  const cities = profilesRaw.map((p) => p.city!).filter(Boolean);
  const colleges = Array.from(
    new Set(collegeDomainRows.map((row) => row.collegeName).filter(Boolean)),
  );

  return (
    <AdminShell>
      <MatchView cities={cities} colleges={colleges} />
    </AdminShell>
  );
}
