import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import AdminShell from "../AdminShell";

export default async function ViewMatchesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  return (
    <AdminShell>
      <div className="flex flex-col items-center justify-center min-h-full py-32" style={{ color: "#9B87B0" }}>
        <p className="text-lg font-semibold mb-2" style={{ color: "#1A0A2E" }}>View Matches</p>
        <p className="text-sm">Coming soon.</p>
      </div>
    </AdminShell>
  );
}
