import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import AdminShell from "../AdminShell";
import MatchUsersView from "./MatchUsersView";

export default async function MatchUsersPage() {
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-0.5"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#1A0A2E" }}
          >
            Match Users
          </h1>
          <p className="text-sm" style={{ color: "#9B87B0" }}>
            Review a pair and decide to match or skip.
          </p>
        </div>
        <MatchUsersView />
      </div>
    </AdminShell>
  );
}
