import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import AdminShell from "../AdminShell";
import MatchView from "../match/MatchView";

export default async function AdminMatchNonStudentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  const locationRows = await db.location.findMany({
    orderBy: [{ city: "asc" }, { subArea: "asc" }],
  });

  const locationMap = new Map<string, string[]>();
  for (const row of locationRows) {
    if (!locationMap.has(row.city)) locationMap.set(row.city, []);
    locationMap.get(row.city)!.push(row.subArea);
  }
  const locations = Array.from(locationMap.entries()).map(([city, subAreas]) => ({ city, subAreas }));
  const cities = locations.map((l) => l.city);

  return (
    <AdminShell>
      <MatchView cities={cities} colleges={[]} locations={locations} userType="non_student" />
    </AdminShell>
  );
}
